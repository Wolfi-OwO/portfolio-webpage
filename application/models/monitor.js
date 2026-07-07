import mongoose from 'mongoose';

const monitorSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            index: true,
        },
        url: {
            type: String,
            required: true,
        },
        // Free-text label — monitors sharing the same group are shown together
        // on the status page with a summarized (averaged) uptime.
        group: {
            type: String,
            trim: true,
            default: null,
            index: true,
        },
    },
    {
        optimisticConcurrency: true,
        timestamps: true,
    },
);

const MonitorModel = mongoose.model('Monitor', monitorSchema);

export { MonitorModel };
