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
            // When explicitly false, this checker may fall back to an HTTP probe
            // of `url` if the Azure control-plane check can't run. Left unset (or
            // true) for scale-to-zero apps, which must NEVER be probed over HTTP —
            // a request would wake them. Kept in sync with the server's model.
            scaleToZero: { type: Boolean },
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
//    from ever scaling back down. Instead we read the state of the app's live
//    production revision from ARM without touching the app. A revision idle at
//    "ScaledToZero" is healthy and available on demand — that's up, not an outage.
//
//    Monitors come solely from the seeded list (database/data/monitors.json);
//    we do NOT auto-discover Container Apps, so each app appears exactly once,
//    with the name/URL/group the admin defined — no ARM-named duplicates.

// PR/preview revisions are created by the sibling repos' pr-preview workflow
// with `--revision-suffix pr-<number>-<sha>`, so their names contain "--pr-<n>-".
// They're throwaway per-PR deployments and must NEVER be taken as the service's
// health, so we skip them when picking the revision to check.
const PR_REVISION_RE = /--pr-\d+-/;

// A revision can serve requests when it's actively Running, or idle at
// ScaledToZero (healthy, spins up on demand — not an outage). Anything else
// (Stopped/Degraded/Failed/Processing/Unknown), or an Unhealthy health probe,
// is down. ScaledToZero isn't in the SDK's KnownRevisionRunningState enum but
// the live ARM API returns it, so we match the string literal.
const UP_RUNNING_STATES = new Set(['Running', 'ScaledToZero']);
function revisionIsUp(revision) {
    return revision.healthState !== 'Unhealthy' && UP_RUNNING_STATES.has(revision.runningState ?? 'Unknown');
}

// The health of a Container App is the health of its live production revision:
// the latest ACTIVE, non-PR revision (the one that serves traffic and scales),
// not the app-level runningStatus (which can't tell a healthy scale-to-zero app
// from a broken one). Returns null when there's no such revision.
async function latestProductionRevision(client, resourceGroup, name) {
    const candidates = [];
    for await (const rev of client.containerAppsRevisions.listRevisions(resourceGroup, name)) {
        if (rev.active && !PR_REVISION_RE.test(rev.name ?? '')) candidates.push(rev);
    }
    candidates.sort((a, b) => (b.createdTime?.getTime() ?? 0) - (a.createdTime?.getTime() ?? 0));
    return candidates[0] ?? null;
}

async function checkContainerAppMonitor(monitor, client, context) {
    const start = Date.now();
    try {
        const { resourceGroup, name } = monitor.containerApp;
        const revision = await latestProductionRevision(client, resourceGroup, name);

        if (!revision) {
            await MonitorCheckModel.create({
                monitor: monitor._id,
                at: Date.now(),
                ok: false,
                latencyMs: Date.now() - start,
                error: 'No active non-PR revision found',
                runningStatus: 'Unknown',
            });
            return;
        }

        const runningStatus = revision.runningState ?? 'Unknown';
        const isUp = revisionIsUp(revision);

        await MonitorCheckModel.create({
            monitor: monitor._id,
            at: Date.now(),
            ok: isUp,
            latencyMs: Date.now() - start,
            error: isUp
                ? undefined
                : `Revision ${revision.name} is ${runningStatus} (health: ${revision.healthState ?? 'unknown'})`,
            runningStatus,
        });
    } catch (err) {
        // The Azure control-plane check couldn't run — no credentials / Reader
        // role, an ARM error, or the app no longer exists. As a second option,
        // fall back to an HTTP probe of the monitor's URL, but ONLY for apps
        // explicitly marked scaleToZero: false. A scale-to-zero app must never be
        // probed over HTTP (the request would wake it, defeating the reason we
        // check it from the control plane), so those just record the failure.
        if (monitor.url && monitor.containerApp?.scaleToZero === false) {
            context?.warn?.(
                `monitor-checker: ARM check failed for "${monitor.name}" (${err.message}); ` +
                    `falling back to HTTP probe of ${monitor.url}`,
            );
            const result = await pingUrl(monitor.url);
            await MonitorCheckModel.create({ monitor: monitor._id, at: Date.now(), ...result });
            return;
        }

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

    // Container-app monitors are checked via ARM (credentials), plain-URL
    // monitors via HTTP — one check per seeded monitor, no discovery.
    const monitors = await MonitorModel.find();
    const results = await Promise.allSettled(
        monitors.map(monitor =>
            monitor.containerApp?.name ? checkContainerAppMonitor(monitor, client, context) : checkMonitor(monitor),
        ),
    );

    const failed = results.filter(r => r.status === 'rejected').length;
    context.log(
        `monitor-checker: checked ${monitors.length} monitor(s)` + (failed ? `, ${failed} check(s) threw` : ''),
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
