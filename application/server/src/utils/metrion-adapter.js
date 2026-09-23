// The `STATUS_SOURCE=metrion` path: builds the same report shape
// status-checker.js's Mongo path does, but measured entirely from Metrion's
// public `/uptime` feed instead of MonitorCheck documents. Mongo's `monitors`
// collection still owns the config (name/url/group/metrionKey); this module
// only supplies the measurement side of each entry, joined by `metrionKey`.
//
// Replaces the old mergeWithMetrion/buildMetrionMonitorStatus dedupe
// (slug-guessing a Mongo monitor's Metrion key from its name/URL, and only
// appending Metrion entries Mongo had no monitor for at all) — the join here
// is exact (`monitor.metrionKey` -> Metrion's `key`, set explicitly per
// monitor since commit 8cc6913), so there is nothing left to guess.
import { DAY, round1, severityFor } from './status-shared.js';
import { fetchMetrionUptime, fetchMetrionUptimeRange } from './metrion-source.js';

// The Metrion sink (jobs/src/lib/metrion-sink.js) writes at a 60s cadence.
// The OLD buildMetrionMonitorStatus had no freshness check at all, so a feed
// silent for 26h (measured 2026-09-21) still rendered "operational" — nothing
// ever compared `lastSampleAt` to the clock. 3 missed ticks (180s) plus 60s of
// slack for ingest/clock jitter is the cutoff below which "no news" stops
// being trustworthy as "still up".
const STALE_AFTER_MS = 4 * 60 * 1000; // 240s

// Maps Metrion's daily `{ day, upPct, samples }` buckets onto the same shape
// status-checker.js#buildDailyHistory produces, so the client's 90-day bars
// render identically regardless of which source an entry came from. A day
// with `samples: 0` is "no-data" whether it precedes the app's first sample
// or is a hole inside its span — never a manufactured 100%.
function mapMetrionHistory(history) {
    return (history ?? []).map(({ day, upPct, samples }) => {
        const dayMs = new Date(day).getTime();
        if (!samples) {
            return { day: dayMs, severity: 'no-data', downPct: null, downMs: 0, totalChecks: 0 };
        }
        const downRatio = (100 - upPct) / 100;
        const observedMs = Math.min(DAY, Date.now() - dayMs);
        return {
            day: dayMs,
            severity: severityFor(downRatio),
            downPct: round1(downRatio * 100),
            downMs: Math.round(downRatio * observedMs),
            totalChecks: samples,
        };
    });
}

// Same status ladder buildMonitorStatus uses (fail24 > 10% -> degraded, i.e.
// h24 < 90), adapted to what Metrion's envelope carries: no single "latest
// check" document, so "the newest sample is 0" reads off the most recent day
// in RAW history (not the mapped severity shape) that collected any samples.
//
// `containerApp`/`runningStatus`/idle detection are Mongo-only here: Metrion's
// public API never returns infrastructure names or an idle signal on
// `/uptime` (only `/uptime/range` carries `idlePct`, and only for whatever
// range a caller asks for) — ml-visualizer's scale-to-zero state is a
// Mongo-sourced fact today and stays that way under source=metrion too. A
// scope decision, not an oversight: nothing here blocks a later change to add
// `idlePct` from a range call once the client range picker exists.
function buildEntry(monitor, appsByKey, nowMs) {
    const app = monitor.metrionKey ? appsByKey.get(monitor.metrionKey) : undefined;
    const lastSampleAt = app?.lastSampleAt ?? null;
    const ageMs = lastSampleAt === null ? null : nowMs - Date.parse(lastSampleAt);

    // The staleness guard. Runs BEFORE any other status computation: a
    // missing app, a null lastSampleAt, or a feed older than the cadence
    // allows must never reach the down/degraded/operational branches below.
    const stale = !app || lastSampleAt === null || ageMs > STALE_AFTER_MS;

    const rawHistory = app?.history ?? [];
    const latestSampledDay = [...rawHistory].reverse().find((d) => d.samples > 0) ?? null;
    const h24 = app?.uptime?.h24 ?? null;
    const status = stale
        ? 'pending'
        : latestSampledDay?.upPct === 0
          ? 'down'
          : h24 != null && h24 < 90
            ? 'degraded'
            : 'operational';

    return {
        _id: monitor._id,
        name: monitor.name,
        url: monitor.url ?? null,
        group: monitor.group ?? null,
        containerApp: null,
        status,
        latencyMs: app?.latencyMs ?? null,
        // /uptime carries one latest latency sample, not a p50/p95 window —
        // that needs /uptime/range, which this report doesn't call (see the
        // module comment; the range picker is a follow-up).
        latency: null,
        lastCheckedAt: lastSampleAt,
        lastError: undefined,
        runningStatus: null,
        monitoringSince: null,
        uptime: {
            h24: app?.uptime?.h24 ?? null,
            d7: app?.uptime?.d7 ?? null,
            d30: app?.uptime?.d30 ?? null,
        },
        history: mapMetrionHistory(rawHistory),
        source: 'metrion',
    };
}

// Task 15: the last successful build, kept so a Metrion outage degrades to
// "stale but last-known-good", never to a page full of `pending` the moment
// one poll fails. A module-level singleton, same pattern as metrion-source's
// own fetch cache.
let lastGood = null; // { entries: Array, at: number }

/**
 * Returns `{ entries, stale, staleSince }`. `entries` is one report entry per
 * Mongo monitor (config from `monitors`, measurements from Metrion — a
 * monitor missing its Metrion key, or whose key has no match in the response,
 * still gets an entry, rendered `pending`, never dropped).
 */
async function buildMetrionStatuses(monitors) {
    const nowMs = Date.now();
    const { applications, ok } = await fetchMetrionUptime();

    if (ok) {
        const appsByKey = new Map(applications.map((a) => [a.key, a]));
        const entries = monitors.map((m) => buildEntry(m, appsByKey, nowMs));
        lastGood = { entries, at: nowMs };
        return { entries, stale: false, staleSince: null };
    }

    if (lastGood) {
        return {
            entries: lastGood.entries,
            stale: true,
            staleSince: new Date(lastGood.at).toISOString(),
        };
    }

    // Never had a successful fetch: nothing to retain, so every monitor
    // renders pending rather than a guess — same rule the staleness guard
    // applies per-entry, just with no prior data to fall back to at all.
    const entries = monitors.map((m) => buildEntry(m, new Map(), nowMs));
    return { entries, stale: true, staleSince: null };
}

// Test-only: forgets the retained last-good report between check.mjs cases.
function resetMetrionAdapterState() {
    lastGood = null;
}

// Range counterpart to mapMetrionHistory: maps Metrion's `{ t, upPct,
// samples }` range buckets (arbitrary granularity — 1m/5m/15m/1d, auto-picked
// server-side) onto the same { day, severity, downPct, downMs, totalChecks }
// shape, so the client's existing bar renderer works unchanged regardless of
// bucket width. `day` here means "bucket start ms", not necessarily a
// calendar day; sub-daily granularities reuse the same key rather than
// adding a second one for a client that doesn't otherwise care. A bucket
// with no samples is `no-data`, same rule as mapMetrionHistory — before an
// app's first sample and a hole inside its span read identically, never a
// manufactured 100%.
function mapRangeBuckets(buckets, bucketWidthMs) {
    const nowMs = Date.now();
    return (buckets ?? []).map(({ t, upPct, samples }) => {
        const tMs = Date.parse(t);
        if (!samples) {
            return { day: tMs, severity: 'no-data', downPct: null, downMs: 0, totalChecks: 0 };
        }
        const downRatio = (100 - upPct) / 100;
        const observedMs = Math.min(bucketWidthMs, Math.max(0, nowMs - tMs));
        return {
            day: tMs,
            severity: severityFor(downRatio),
            downPct: round1(downRatio * 100),
            downMs: Math.round(downRatio * observedMs),
            totalChecks: samples,
        };
    });
}

/**
 * Range-mode counterpart to buildMetrionStatuses. The live/current tiles
 * (status, uptime.h24/d7/d30, the latest latency sample, stale/staleSince) are
 * exactly what buildMetrionStatuses already computes from the UNCHANGED plain
 * `/uptime` endpoint — a caller picking a date range does not change what
 * "currently up" means, and that band keeps its own Task 15 stale-retention
 * regardless of whether the range fetch below succeeds. Only the per-monitor
 * RANGE-specific fields (history bars, latency p50/p95 FOR THE WINDOW,
 * incidents, the window's own uptimePct) are overlaid from Metrion's
 * `/uptime/range` response, joined by the same `metrionKey` the current-view
 * path uses.
 *
 * A monitor absent from the range response (no metrionKey, key not present in
 * this window, or the whole range fetch failed) gets an honestly empty range
 * — no bars, no incidents, never a fabricated uptime figure — while its live
 * tiles above still read whatever buildMetrionStatuses already gave them.
 */
async function buildMetrionRangeStatuses(monitors, fromMs, toMs) {
    const [live, rangeResult] = await Promise.all([
        buildMetrionStatuses(monitors),
        fetchMetrionUptimeRange(fromMs, toMs),
    ]);

    const rangeAppsByKey = new Map(rangeResult.applications.map((a) => [a.key, a]));
    // Buckets are evenly spaced across [range.from, range.to), so dividing the
    // span by the count gives the exact width regardless of which granularity
    // Metrion auto-picked — no need to hardcode a name -> ms table here.
    const bucketWidthMs =
        rangeResult.range?.bucketCount > 0
            ? (Date.parse(rangeResult.range.to) - Date.parse(rangeResult.range.from)) /
              rangeResult.range.bucketCount
            : DAY;

    // Order parity with `monitors` is guaranteed by buildMetrionStatuses'
    // own implementation (`monitors.map(buildEntry)`), so zipping by index
    // here is safe and avoids a second _id-keyed lookup.
    const entries = live.entries.map((entry, i) => {
        const monitor = monitors[i];
        const rangeApp = monitor.metrionKey ? rangeAppsByKey.get(monitor.metrionKey) : undefined;

        return {
            ...entry,
            latency: rangeApp?.latency
                ? { p50: rangeApp.latency.p50, p95: rangeApp.latency.p95 }
                : null,
            history: rangeApp ? mapRangeBuckets(rangeApp.buckets, bucketWidthMs) : [],
            uptime: { ...entry.uptime, range: rangeApp?.uptimePct ?? null },
            incidents: (rangeApp?.incidents ?? []).map((inc) => ({
                startedAt: inc.startedAt,
                endedAt: inc.endedAt ?? null,
                durationSeconds: inc.durationSeconds,
                downSamples: inc.downSamples,
            })),
            truncated: rangeApp?.truncated ?? false,
            totalIncidents: rangeApp?.totalIncidents ?? 0,
        };
    });

    return {
        entries,
        stale: live.stale,
        staleSince: live.staleSince,
        range: rangeResult.range ?? {
            from: new Date(fromMs).toISOString(),
            to: new Date(toMs).toISOString(),
            granularity: null,
            bucketCount: 0,
        },
        rangeUnavailable: !rangeResult.ok,
    };
}

export {
    buildMetrionStatuses,
    buildMetrionRangeStatuses,
    buildEntry,
    mapMetrionHistory,
    mapRangeBuckets,
    resetMetrionAdapterState,
};
