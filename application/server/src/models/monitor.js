import mongoose from 'mongoose';

const monitorSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            index: true,
        },
        // Required for plain HTTP monitors. Optional for container-app monitors:
        // those are checked purely via Azure's control-plane runningStatus and
        // are NEVER probed over HTTP (a request would wake a scale-to-zero app),
        // so here the URL is only a display/click-through link, not a health check.
        url: {
            type: String,
        },
        // Free-text label — monitors sharing the same group are shown together
        // on the status page with a summarized (averaged) uptime.
        group: {
            type: String,
            trim: true,
            default: null,
            index: true,
        },
        // Set only for monitors auto-discovered from Azure Container Apps (see
        // monitor-checker's syncContainerAppMonitors). Identifies the ARM
        // resource so the checker can query runningStatus without an HTTP call.
        containerApp: {
            resourceGroup: { type: String },
            name: { type: String },
            // When explicitly false, the monitor-checker Function may fall back to
            // an HTTP probe of `url` if the Azure control-plane check can't run.
            // Leave unset (or true) for scale-to-zero apps, which must NEVER be
            // probed over HTTP — a request would wake them. Mirrored in the
            // monitor-checker Function's duplicated schema; keep the two in sync.
            scaleToZero: { type: Boolean },
        },
    },
    {
        optimisticConcurrency: true,
        timestamps: true,
    },
);

const MonitorModel = mongoose.model('Monitor', monitorSchema);

export { MonitorModel };
