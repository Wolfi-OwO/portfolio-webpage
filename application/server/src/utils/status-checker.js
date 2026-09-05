import { MonitorModel } from '../models/monitor.js';
import { MonitorCheckModel } from '../models/monitor-check.js';

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
const DAY = 24 * 60 * 60 * 1000;
const HISTORY_DAYS = 90;
const round1 = (n) => Math.round(n * 10) / 10;

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

// Discord-style: one bar per calendar day, colored by how much of that day
// was down — not one bar per raw check (which, at a short check interval,
// would only cover the last few minutes instead of the last 90 days).
function severityFor(downRatio) {
    if (downRatio <= 0) return 'operational';
    if (downRatio <= 0.1) return 'minor';
    if (downRatio <= 0.5) return 'major';
    return 'critical';
}

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

async function buildMonitorStatus(monitor) {
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
        containerApp: monitor.containerApp?.name ? monitor.containerApp : null,
        status,
        latencyMs: latest?.latencyMs ?? null,
        lastCheckedAt: latest?.at ?? null,
        lastError: !latest?.ok ? latest?.error : undefined,
        runningStatus: latest?.runningStatus ?? null,
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

async function getStatusReport() {
    const monitors = await MonitorModel.find().sort({ createdAt: 1 });
    const statuses = await Promise.all(monitors.map(buildMonitorStatus));

    const status = worstStatus(statuses.map((m) => m.status));
    const { groups, ungrouped } = buildGroups(statuses);

    return {
        status,
        checkIntervalMs: CHECK_MS,
        groups,
        ungrouped,
    };
}

// worstStatus exported for the framework-free unit check in
// tests/status/worst-status.check.mjs (see that file for why: it's a pure
// function and doesn't need the Mongo-backed mocha harness the rest of the
// status suite runs under).
export { getStatusReport, worstStatus };
