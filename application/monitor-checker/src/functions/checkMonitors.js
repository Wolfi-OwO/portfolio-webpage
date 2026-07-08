import { app } from '@azure/functions';
import mongoose from 'mongoose';
import { DefaultAzureCredential } from '@azure/identity';
import { ContainerAppsAPIClient } from '@azure/arm-appcontainers';

// Mirrors application/server/src/models/monitor.js and monitor-check.js.
// Duplicated rather than imported because this Function App deploys
// independently of the main backend — keep schema changes in sync manually.
const monitorSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, index: true },
        url: { type: String },
        group: { type: String, trim: true, default: null, index: true },
        containerApp: {
            resourceGroup: { type: String },
            name: { type: String },
        },
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
    runningStatus: { type: String },
    createdAt: { type: Date, default: Date.now, expires: 90 * 24 * 60 * 60 },
});

const MonitorModel = mongoose.models.Monitor ?? mongoose.model('Monitor', monitorSchema);
const MonitorCheckModel = mongoose.models.MonitorCheck ?? mongoose.model('MonitorCheck', monitorCheckSchema);

const REQUEST_TIMEOUT_MS = 10000;

// Resource groups to auto-discover Container Apps from. Comma-separated so a
// new one can be added via app setting alone (no redeploy) — it still needs
// its own Reader role assignment for this Function's managed identity.
const CONTAINER_APP_RESOURCE_GROUPS = (
    process.env.CONTAINER_APP_RESOURCE_GROUPS || 'portfolio-webpage-rg,netviz-rg,dsai-5bhif-app'
)
    .split(',')
    .map(rg => rg.trim())
    .filter(Boolean);

// Consumption-plan instances get reused across invocations while warm, so
// caching the connection/client on module scope avoids recreating them every tick.
let connecting = null;
function ensureConnected() {
    if (mongoose.connection.readyState === 1) return Promise.resolve();
    if (!connecting) connecting = mongoose.connect(process.env.MONGODB_CONNECTION_STRING);
    return connecting;
}

let armClient = null;
function getArmClient() {
    if (!armClient) {
        armClient = new ContainerAppsAPIClient(new DefaultAzureCredential(), process.env.AZURE_SUBSCRIPTION_ID);
    }
    return armClient;
}

// ── HTTP checks ───────────────────────────────────────────────────────────────
async function pingUrl(url) {
    const start = Date.now();
    try {
        const response = await fetch(url, {
            method: 'GET',
            redirect: 'follow',
            signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });
        return { ok: response.ok, statusCode: response.status, latencyMs: Date.now() - start };
    } catch (err) {
        return { ok: false, latencyMs: Date.now() - start, error: err.message };
    }
}

async function checkMonitor(monitor) {
    const result = await pingUrl(monitor.url);
    await MonitorCheckModel.create({ monitor: monitor._id, at: Date.now(), ...result });
}

// ── Container Apps — checked purely from Azure's control plane ───────────────
//    We deliberately NEVER send an HTTP request to a Container App. A
//    scale-to-zero app treats any inbound request as traffic and wakes up, so
//    an HTTP probe would (a) always report "operational" and (b) keep the app
//    from ever scaling back down. runningStatus tells us the real state without
//    touching the app. (Note: a scaled-to-zero-but-idle app still reports
//    "Running" — that's correct, the service is available on demand.)
async function discoverContainerApps(client, context) {
    const discovered = [];
    for (const resourceGroup of CONTAINER_APP_RESOURCE_GROUPS) {
        try {
            for await (const containerApp of client.containerApps.listByResourceGroup(resourceGroup)) {
                discovered.push({ resourceGroup, name: containerApp.name });
            }
        } catch (err) {
            context.error(`monitor-checker: failed listing container apps in ${resourceGroup}: ${err.message}`);
        }
    }
    return discovered;
}

// Creates a Monitor for any newly-seen Container App; never overwrites an
// existing one, so admin edits (rename, group assignment) stick. This is what
// makes adding a Container App "zero code changes" — it just shows up.
async function syncContainerAppMonitors(discovered) {
    await Promise.all(
        discovered.map(({ resourceGroup, name }) =>
            MonitorModel.findOneAndUpdate(
                { 'containerApp.resourceGroup': resourceGroup, 'containerApp.name': name },
                { $setOnInsert: { name, containerApp: { resourceGroup, name } } },
                { upsert: true },
            ),
        ),
    );
}

async function checkContainerAppMonitor(monitor, client) {
    const start = Date.now();
    try {
        const { resourceGroup, name } = monitor.containerApp;
        const containerApp = await client.containerApps.get(resourceGroup, name);
        const runningStatus = containerApp.runningStatus ?? 'Unknown';
        const isRunning = runningStatus === 'Running';

        await MonitorCheckModel.create({
            monitor: monitor._id,
            at: Date.now(),
            ok: isRunning,
            latencyMs: Date.now() - start,
            error: isRunning ? undefined : `Container App is ${runningStatus}`,
            runningStatus,
        });
    } catch (err) {
        await MonitorCheckModel.create({
            monitor: monitor._id,
            at: Date.now(),
            ok: false,
            latencyMs: Date.now() - start,
            error: err.message,
            runningStatus: 'Unknown',
        });
    }
}

async function runCheckCycle(context) {
    const client = getArmClient();

    const discovered = await discoverContainerApps(client, context);
    await syncContainerAppMonitors(discovered);

    const monitors = await MonitorModel.find();
    const results = await Promise.allSettled(
        monitors.map(monitor =>
            monitor.containerApp?.name ? checkContainerAppMonitor(monitor, client) : checkMonitor(monitor),
        ),
    );

    const failed = results.filter(r => r.status === 'rejected').length;
    context.log(
        `monitor-checker: checked ${monitors.length} monitor(s), discovered ${discovered.length} container app(s)` +
            (failed ? `, ${failed} check(s) threw` : ''),
    );
}

app.timer('checkMonitors', {
    // NCRONTAB (6 fields incl. seconds): fires once per minute by default.
    // Override via the CHECK_SCHEDULE app setting.
    schedule: process.env.CHECK_SCHEDULE || '0 * * * * *',
    handler: async (myTimer, context) => {
        await ensureConnected();
        await runCheckCycle(context);
    },
});

// Exposed for tests.
export { ensureConnected, runCheckCycle, MonitorModel, MonitorCheckModel };
