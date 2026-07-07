import { MonitorModel } from '../models/monitor.js';
import { MonitorCheckModel } from '../models/monitor-check.js';
import { logger } from './logger.js';

const CHECK_MS = (Number(process.env.STATUS_CHECK_INTERVAL_SECONDS) || 60) * 1000;
const REQUEST_TIMEOUT_MS = 10000;
const DAY = 24 * 60 * 60 * 1000;
const HISTORY_LENGTH = 90;
const round1 = n => Math.round(n * 10) / 10;

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

    const history = (
        await MonitorCheckModel.find({ monitor: monitor._id }).sort({ at: -1 }).limit(HISTORY_LENGTH)
    )
        .reverse()
        .map(s => ({ at: s.at, ok: s.ok }));

    const status = !latest ? 'pending' : latest.ok ? 'operational' : 'down';

    return {
        _id: monitor._id,
        name: monitor.name,
        url: monitor.url,
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

async function getStatusReport() {
    const monitors = await MonitorModel.find().sort({ createdAt: 1 });
    const report = await Promise.all(monitors.map(buildMonitorStatus));

    const status = report.some(m => m.status === 'down') ? 'down' : 'operational';

    return {
        status,
        checkIntervalMs: CHECK_MS,
        monitors: report,
    };
}

export { startStatusChecker, stopStatusChecker, getStatusReport, checkMonitor };
