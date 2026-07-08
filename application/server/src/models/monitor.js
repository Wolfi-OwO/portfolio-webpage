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
        },
    },
    {
        optimisticConcurrency: true,
        timestamps: true,
    },
);

const MonitorModel = mongoose.model('Monitor', monitorSchema);

export { MonitorModel };
