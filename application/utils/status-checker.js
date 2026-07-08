import { MonitorModel } from '../models/monitor.js';
import { MonitorCheckModel } from '../models/monitor-check.js';
import { logger } from './logger.js';

const CHECK_MS = (Number(process.env.STATUS_CHECK_INTERVAL_SECONDS) || 60) * 1000;
const REQUEST_TIMEOUT_MS = 10000;
const DAY = 24 * 60 * 60 * 1000;
const HISTORY_DAYS = 90;
const round1 = n => Math.round(n * 10) / 10;

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

    const byDay = new Map(buckets.map(b => [b._id, b]));

    return Array.from({ length: HISTORY_DAYS }, (_, i) => {
        const dayBucket = firstBucket + i;
        const bucket = byDay.get(dayBucket);
        if (!bucket) {
            return { day: dayBucket * DAY, severity: 'no-data', downPct: null, downMs: 0, totalChecks: 0 };
        }
        const downPct = round1((bucket.down / bucket.total) * 100);
        return {
            day: dayBucket * DAY,
            severity: severityFor(bucket.down / bucket.total),
            downPct,
            // Each failed check stands in for roughly one check-interval of
            // downtime — checks are evenly spaced, so this approximates duration
            // (e.g. "1 hrs 44 mins") without needing to track incident start/end.
            downMs: bucket.down * CHECK_MS,
            totalChecks: bucket.total,
        };
    });
}

// ── Probing ───────────────────────────────────────────────────────────────────
async function checkMonitor(monitor) {
    const start = Date.now();
    try {
        const response = await fetch(monitor.url, {
            method: 'GET',
            redirect: 'follow',
            signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });
        await MonitorCheckModel.create({
            monitor: monitor._id,
            at: Date.now(),
            ok: response.ok,
            statusCode: response.status,
            latencyMs: Date.now() - start,
        });
    } catch (err) {
        await MonitorCheckModel.create({
            monitor: monitor._id,
            at: Date.now(),
            ok: false,
            latencyMs: Date.now() - start,
            error: err.message,
        });
    }
}

async function runCheckCycle() {
    try {
        const monitors = await MonitorModel.find();
        await Promise.all(monitors.map(checkMonitor));
    } catch (err) {
        logger.error('Status checker cycle failed', err);
    }
}

let timer = null;

/** Begin periodic monitor checks (runs the first cycle immediately). */
function startStatusChecker() {
    if (timer) return;
    void runCheckCycle();
    timer = setInterval(() => void runCheckCycle(), CHECK_MS);
    if (typeof timer.unref === 'function') timer.unref();
}

function stopStatusChecker() {
    if (timer) {
        clearInterval(timer);
        timer = null;
    }
}

// ── Reporting ─────────────────────────────────────────────────────────────────
async function uptimePct(monitorId, windowMs, since) {
    const now = Date.now();
    const start = Math.max(now - windowMs, since);
    const span = now - start;
    if (span <= CHECK_MS) return 100;
    const expected = Math.max(1, Math.round(span / CHECK_MS));
    const count = await MonitorCheckModel.countDocuments({
        monitor: monitorId,
        at: { $gte: start },
        ok: true,
    });
    return round1(Math.min(100, (count / expected) * 100));
}

async function buildMonitorStatus(monitor) {
    const first = await MonitorCheckModel.findOne({ monitor: monitor._id }).sort({ at: 1 });
    const latest = await MonitorCheckModel.findOne({ monitor: monitor._id }).sort({ at: -1 });
    const monitoringSince = first?.at ?? Date.now();

    const history = await buildDailyHistory(monitor._id);

    const status = !latest ? 'pending' : latest.ok ? 'operational' : 'down';

    return {
        _id: monitor._id,
        name: monitor.name,
        url: monitor.url,
        group: monitor.group ?? null,
        status,
        latencyMs: latest?.latencyMs ?? null,
        lastCheckedAt: latest?.at ?? null,
        lastError: !latest?.ok ? latest?.error : undefined,
        monitoringSince,
        uptime: {
            h24: await uptimePct(monitor._id, DAY, monitoringSince),
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

    const avg = (members, field) =>
        round1(members.reduce((sum, m) => sum + m.uptime[field], 0) / members.length);

    const groups = Array.from(byGroup.entries()).map(([name, members]) => ({
        name,
        status: members.some(m => m.status === 'down') ? 'down' : 'operational',
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

    const status = statuses.some(m => m.status === 'down') ? 'down' : 'operational';
    const { groups, ungrouped } = buildGroups(statuses);

    return {
        status,
        checkIntervalMs: CHECK_MS,
        groups,
        ungrouped,
    };
}

export { startStatusChecker, stopStatusChecker, getStatusReport, checkMonitor };
