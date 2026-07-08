import mongoose from 'mongoose';

// A single periodic probe of a Monitor's URL, used to compute uptime % and
// render the status page's history bar. Not exposed as its own REST resource.
const monitorCheckSchema = new mongoose.Schema(
    {
        monitor: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'Monitor',
            required: true,
            index: true,
        },
        at: { type: Number, required: true, index: true }, // epoch ms
        ok: { type: Boolean, required: true },
        statusCode: { type: Number },
        latencyMs: { type: Number, required: true },
        error: { type: String },
        // Set only for container-app monitors — Azure's ARM runningStatus
        // (e.g. "Running", "Stopped"), independent of any HTTP status code.
        runningStatus: { type: String },
        // Auto-expire samples after 90 days.
        createdAt: { type: Date, default: Date.now, expires: 90 * 24 * 60 * 60 },
    },
    {
        toJSON: {
            transform: (_doc, ret) => {
                delete ret._id;
                delete ret.__v;
                delete ret.createdAt;
                return ret;
            },
        },
    },
);

const MonitorCheckModel = mongoose.model('MonitorCheck', monitorCheckSchema);

export { MonitorCheckModel };
