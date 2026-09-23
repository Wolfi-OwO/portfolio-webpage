import { MonitorModel } from '../models/monitor.js';
import { MonitorCheckModel } from '../models/monitor-check.js';
import { DAY, round1, severityFor } from './status-shared.js';
import { buildMetrionStatuses, buildMetrionRangeStatuses } from './metrion-adapter.js';

// This service no longer probes anything itself: the separate monitor-checker
// Azure Function performs every check (~once per minute, 24/7) and writes the
// samples to MongoDB. This module only READS those samples to build the status
// report.
//
// CHECK_MS is the checker's NOMINAL cadence, and it is only ever a display hint
// ("checks every 60s"). Nothing here divides by it: the Function's real cadence
// drifts well above the schedule — Azure's timer trigger replays ticks it thinks
// it missed, so a full day holds ~1700 samples rather than the 1440 the schedule
// implies. Every measurement below is therefore derived from the samples we
// actually have, never from a wall-clock guess at how many should exist.
const CHECK_MS = (Number(process.env.STATUS_CHECK_INTERVAL_SECONDS) || 60) * 1000;
const HISTORY_DAYS = 90;

// Worst-of ordering for rolled-up statuses (groups AND the overall report —
// both call this one function, so the rule lives in exactly one place).
//
// `idle` is deliberately NOT a rung on this ladder. A scaled-to-zero app is
// verified-healthy (buildMonitorStatus only assigns `idle` when the latest
// check's `ok` is true — a stopped/errored/unreachable app is `down` before
// `idle` is ever considered), so for a rollup it counts exactly as
// `operational` does. Before this, `idle` outranked `operational` in the
// order below, so ml-visualizer's permanent scale-to-zero idle state pinned
// the whole page's banner to "idle" forever, even with every other monitor
// green — a banner that never turns green gets ignored, and a real outage
// stops standing out. `idle` still prints per-monitor (buildMonitorStatus
// sets it directly, not via this function), so the distinction isn't lost —
// only the top-level summary treats it as healthy.
//
// `pending` (never checked) stays a real rung, above `operational`: unknown
// is not the same as healthy, and must not be folded in with `idle`.
const STATUS_ORDER = ['down', 'degraded', 'pending', 'operational'];
const worstStatus = (statuses) => {
    const rollup = statuses.map((s) => (s === 'idle' ? 'operational' : s));
    return STATUS_ORDER.find((s) => rollup.includes(s)) ?? 'operational';
};

// severityFor now lives in status-shared.js (reused by metrion-adapter.js);
// re-exported below unchanged so existing importers (tests, this file) don't
// need to change their import path.

async function buildDailyHistory(monitorId) {
    const todayBucket = Math.floor(Date.now() / DAY);
    const firstBucket = todayBucket - HISTORY_DAYS + 1;

    const buckets = await MonitorCheckModel.aggregate([
        { $match: { monitor: monitorId, at: { $gte: firstBucket * DAY } } },
        {
            $group: {
                _id: { $floor: { $divide: ['$at', DAY] } },
                total: { $sum: 1 },
                down: { $sum: { $cond: ['$ok', 0, 1] } },
            },
        },
    ]);

    const byDay = new Map(buckets.map((b) => [b._id, b]));

    return Array.from({ length: HISTORY_DAYS }, (_, i) => {
        const dayBucket = firstBucket + i;
        const bucket = byDay.get(dayBucket);
        if (!bucket) {
            return {
                day: dayBucket * DAY,
                severity: 'no-data',
                downPct: null,
                downMs: 0,
                totalChecks: 0,
            };
        }
        const downRatio = bucket.down / bucket.total;
        // How much of this day we have actually observed: a whole day for past
        // days, the elapsed part of it for today.
        const observedMs = Math.min(DAY, Date.now() - dayBucket * DAY);
        return {
            day: dayBucket * DAY,
            severity: severityFor(downRatio),
            downPct: round1(downRatio * 100),
            // The share of the day's checks that failed, projected onto the part
            // of the day we watched — checks are evenly spaced, so this
            // approximates duration (e.g. "1 hrs 44 mins") without tracking
            // incident start/end, and stays right regardless of the real cadence.
            downMs: Math.round(downRatio * observedMs),
            totalChecks: bucket.total,
        };
    });
}

// ── Reporting ─────────────────────────────────────────────────────────────────
// Uptime is the share of the window's checks that passed. It is deliberately NOT
// "successful checks ÷ how many checks should have run in this span": that older
// form divided by span/CHECK_MS and clamped the result to 100, and because the
// checker really writes ~1700 samples a day against an assumed 1440, every ratio
// landed above 1 and clamped — so the page reported a flat 100% while days with
// real failures sat right there in the history bars.
//
// A window with no samples at all returns null ("no data"), matching how the
// daily history treats gaps. Missing checks are missing information, not
// downtime, and must not be averaged in as either.
async function uptimePct(monitorId, windowMs, since) {
    const start = Math.max(Date.now() - windowMs, since);
    const [totals] = await MonitorCheckModel.aggregate([
        { $match: { monitor: monitorId, at: { $gte: start } } },
        {
            $group: {
                _id: null,
                total: { $sum: 1 },
                up: { $sum: { $cond: ['$ok', 1, 0] } },
            },
        },
    ]);
    if (!totals?.total) return null;
    return round1((totals.up / totals.total) * 100);
}

async function failurePct(monitorId, windowMs, since) {
    const start = Math.max(Date.now() - windowMs, since);
    const [totals] = await MonitorCheckModel.aggregate([
        { $match: { monitor: monitorId, at: { $gte: start } } },
        {
            $group: {
                _id: null,
                total: { $sum: 1 },
                down: { $sum: { $cond: ['$ok', 0, 1] } },
            },
        },
    ]);
    if (!totals?.total) return null;
    // Unrounded: uptimePct rounds for display, but the degraded threshold must
    // be exact (10.04% failures must trip it, not round down to 10.0).
    return (totals.down / totals.total) * 100;
}

// Median and p95 of the last 24 h of passing checks. The tile used to average
// each monitor's single latest sample, so one slow outlier (a 5056 ms Metrion
// netviz sample) dragged the headline to ~968 ms. Measured 24 h to 2026-09-20
// on the VPS-hosted monitors: p50 146-224 ms against a mean of 306-404 ms and
// a p95 of 1.1-1.2 s, i.e. the mean was ~2x the typical response.
// Computed in JS from a bounded, latency-only query (~1.7k numbers per
// monitor) rather than $percentile, which needs MongoDB >= 7 and would break
// silently on an older server.
async function latencyPercentiles(monitorId) {
    const rows = await MonitorCheckModel.find(
        { monitor: monitorId, ok: true, at: { $gte: Date.now() - DAY } },
        { latencyMs: 1, _id: 0 },
    ).lean();
    if (!rows.length) return null;
    const sorted = rows.map((r) => r.latencyMs).sort((a, b) => a - b);
    const at = (p) =>
        Math.round(sorted[Math.min(sorted.length - 1, Math.ceil(p * sorted.length) - 1)]);
    return { p50: at(0.5), p95: at(0.95) };
}

// This report is served to ANONYMOUS callers (status-route.js is public on
// purpose), so its default projection must not name infrastructure. Stored
// errors come from two places in jobs/src/functions/checkMonitors.js:
//   - the ARM branch: "Revision dsai-containerapp--0000004 is Failed
//     (health: Unhealthy)" and, in its catch, the Azure SDK's OWN err.message
//     - unbounded text that carries full resource ids including the
//     subscription GUID when a credential or role breaks;
//   - the HTTP branch: bounded, "fetch failed (ECONNRESET)".
// Only the ARM branch ever sets runningStatus, so that field is the
// discriminator - no string sniffing. The errno stays: it names a failure
// mode, not a host. Full text stays in Mongo and in the admin projection.
const ERRNO_RE = /\(([A-Z][A-Z0-9_]+)\)\s*$/;
function publicError(check) {
    if (!check || check.ok || !check.error) return undefined;
    if (check.runningStatus) return 'Container app revision is not healthy';
    const code = check.error.match(ERRNO_RE)?.[1];
    return code ? `Request failed (${code})` : 'Request failed';
}

// The page only needs "is a container app" and "is it scaled to zero", so the
// anonymous view gets those two facts instead of the resource group/name.
function projectInfra(monitor, latest, detailed) {
    const hasApp = Boolean(monitor.containerApp?.name);
    return {
        containerApp: !hasApp
            ? null
            : detailed
              ? monitor.containerApp
              : { scaleToZero: monitor.containerApp.scaleToZero ?? true },
        lastError: detailed ? (!latest?.ok ? latest?.error : undefined) : publicError(latest),
        runningStatus: detailed
            ? (latest?.runningStatus ?? null)
            : latest?.runningStatus === 'ScaledToZero'
              ? 'ScaledToZero'
              : null,
    };
}

async function buildMonitorStatus(monitor, detailed = false) {
    const first = await MonitorCheckModel.findOne({ monitor: monitor._id }).sort({ at: 1 });
    const latest = await MonitorCheckModel.findOne({ monitor: monitor._id }).sort({ at: -1 });
    const monitoringSince = first?.at ?? Date.now();

    const history = await buildDailyHistory(monitor._id);

    // `ScaledToZero` is a healthy state (checkMonitors.js reads it from ARM), so
    // it wins as `idle` before the last-24h failure rate is considered.
    const fail24 = await failurePct(monitor._id, DAY, monitoringSince);
    const status = !latest
        ? 'pending'
        : !latest.ok
          ? 'down'
          : latest.runningStatus === 'ScaledToZero'
            ? 'idle'
            : fail24 != null && fail24 > 10
              ? 'degraded'
              : 'operational';

    return {
        _id: monitor._id,
        name: monitor.name,
        url: monitor.url,
        group: monitor.group ?? null,
        ...projectInfra(monitor, latest, detailed),
        status,
        latencyMs: latest?.latencyMs ?? null,
        latency: await latencyPercentiles(monitor._id),
        lastCheckedAt: latest?.at ?? null,
        monitoringSince,
        uptime: {
            h24: fail24 != null ? round1(100 - fail24) : null,
            d7: await uptimePct(monitor._id, 7 * DAY, monitoringSince),
            d30: await uptimePct(monitor._id, 30 * DAY, monitoringSince),
        },
        history,
    };
}

// Groups member monitors under their shared `group` label with a summarized
// (averaged) uptime and a worst-of status, so related services (e.g. a site
// and its app subdomain) read as one entry on the status page.
function buildGroups(statuses) {
    const byGroup = new Map();
    const ungrouped = [];

    for (const entry of statuses) {
        if (!entry.group) {
            ungrouped.push(entry);
            continue;
        }
        if (!byGroup.has(entry.group)) byGroup.set(entry.group, []);
        byGroup.get(entry.group).push(entry);
    }

    // Members still waiting for their first sample report a null uptime; they sit
    // out the average rather than dragging it to 0 or inventing a 100.
    const avg = (members, field) => {
        const known = members.map((m) => m.uptime[field]).filter((pct) => pct != null);
        if (!known.length) return null;
        return round1(known.reduce((sum, pct) => sum + pct, 0) / known.length);
    };

    const groups = Array.from(byGroup.entries()).map(([name, members]) => ({
        name,
        status: worstStatus(members.map((m) => m.status)),
        uptime: {
            h24: avg(members, 'h24'),
            d7: avg(members, 'd7'),
            d30: avg(members, 'd30'),
        },
        monitors: members,
    }));

    return { groups, ungrouped };
}

// `STATUS_SOURCE` read once per call (as the default parameter, evaluated at
// call time, not module load) so a test — or an operator flipping the env var
// on a live process — sees the change on the very next call, no reimport
// needed. Unset or any value other than 'metrion' keeps today's Mongo path.
function defaultSource() {
    return process.env.STATUS_SOURCE === 'metrion' ? 'metrion' : 'mongo';
}

/**
 * @param {boolean} detailed - admin projection (container app names, raw errors)
 * @param {string} source - 'metrion' or 'mongo'
 * @param {{ from: number, to: number } | null} range - epoch-ms window from a
 * date-range picker request, or `null` for the default "current" view
 * (h24/d7/d30 + 90-day daily bars). Already validated by the caller
 * (status-handlers.js's parseRangeQuery) — this function trusts `from < to`.
 */
async function getStatusReport(detailed = false, source = defaultSource(), range = null) {
    const monitors = await MonitorModel.find().sort({ createdAt: 1 });

    if (source === 'metrion') {
        if (range) {
            const {
                entries,
                stale,
                staleSince,
                range: rangeMeta,
                rangeUnavailable,
            } = await buildMetrionRangeStatuses(monitors, range.from, range.to);
            const status = worstStatus(entries.map((m) => m.status));
            const { groups, ungrouped } = buildGroups(entries);
            return {
                status,
                checkIntervalMs: CHECK_MS,
                groups,
                ungrouped,
                stale,
                staleSince,
                range: rangeMeta,
                // Only present when the range fetch itself failed (Metrion's
                // /uptime/range unreachable/erroring) — distinct from "no
                // incidents"/"no bars", which is just an empty range.
                ...(rangeUnavailable ? { rangeUnavailable: true } : {}),
            };
        }

        const { entries, stale, staleSince } = await buildMetrionStatuses(monitors);
        const status = worstStatus(entries.map((m) => m.status));
        const { groups, ungrouped } = buildGroups(entries);
        return { status, checkIntervalMs: CHECK_MS, groups, ungrouped, stale, staleSince };
    }

    // Explicit arrow, NOT `monitors.map(buildMonitorStatus)`: map would pass the
    // array index as `detailed`, and every monitor after the first would be
    // served with full infrastructure detail to anonymous callers.
    const mongoStatuses = await Promise.all(
        monitors.map(async (m) => ({
            ...(await buildMonitorStatus(m, detailed)),
            source: 'mongo',
        })),
    );

    const status = worstStatus(mongoStatuses.map((m) => m.status));
    const { groups, ungrouped } = buildGroups(mongoStatuses);

    // No `stale`/`staleSince` keys here: the mongo branch's output must stay
    // byte-identical to the pre-Metrion-adapter report (STATUS_SOURCE unset
    // is the live default, so this is what every current caller still sees).
    //
    // A `range` request against `source=mongo` gets the SAME default view,
    // flagged `rangeUnsupported: true` so the client can show a "date ranges
    // need the Metrion source" note instead of silently ignoring what was
    // asked for. Slicing Mongo's MonitorCheck documents to an arbitrary
    // window would mean reimplementing buildDailyHistory/uptimePct/
    // latencyPercentiles above against a caller-supplied window instead of
    // their fixed DAY/7*DAY/30*DAY/90-day ones — real work, for a source
    // that's being retired once Metrion fully replaces it (see this file's
    // top module comment), so it isn't built here.
    return {
        status,
        checkIntervalMs: CHECK_MS,
        groups,
        ungrouped,
        ...(range ? { rangeUnsupported: true } : {}),
    };
}

// worstStatus exported for the framework-free unit checks in
// tests/status/*.check.mjs (see worst-status.check.mjs for why: it's a pure
// function and doesn't need the Mongo-backed mocha harness the rest of the
// status suite runs under).
export { getStatusReport, publicError, projectInfra, severityFor, worstStatus };
