import { app } from '@azure/functions';
import mongoose from 'mongoose';

// Mirrors application/models/monitor.js and monitor-check.js. Duplicated
// rather than imported because this Function App deploys independently of
// the main backend — keep schema changes in sync manually on both sides.
const monitorSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, index: true },
        url: { type: String, required: true },
        group: { type: String, trim: true, default: null, index: true },
    },
    { optimisticConcurrency: true, timestamps: true },
);

const monitorCheckSchema = new mongoose.Schema({
    monitor: { type: mongoose.SchemaTypes.ObjectId, ref: 'Monitor', required: true, index: true },
    at: { type: Number, required: true, index: true },
    ok: { type: Boolean, required: true },
    statusCode: { type: Number },
    latencyMs: { type: Number, required: true },
    error: { type: String },
    createdAt: { type: Date, default: Date.now, expires: 90 * 24 * 60 * 60 },
});

const MonitorModel = mongoose.models.Monitor ?? mongoose.model('Monitor', monitorSchema);
const MonitorCheckModel = mongoose.models.MonitorCheck ?? mongoose.model('MonitorCheck', monitorCheckSchema);

const REQUEST_TIMEOUT_MS = 10000;

// Consumption-plan instances get reused across invocations while warm, so
// caching the connection on the module scope avoids reconnecting every tick.
let connecting = null;
function ensureConnected() {
    if (mongoose.connection.readyState === 1) return Promise.resolve();
    if (!connecting) connecting = mongoose.connect(process.env.MONGODB_CONNECTION_STRING);
    return connecting;
}

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

app.timer('checkMonitors', {
    // NCRONTAB (6 fields incl. seconds): fires once per minute by default.
    // Override via the CHECK_SCHEDULE app setting.
    schedule: process.env.CHECK_SCHEDULE || '0 * * * * *',
    handler: async (myTimer, context) => {
        await ensureConnected();
        const monitors = await MonitorModel.find();
        await Promise.allSettled(monitors.map(checkMonitor));
        context.log(`monitor-checker: checked ${monitors.length} monitor(s)`);
    },
});
