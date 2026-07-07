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
    },
    {
        optimisticConcurrency: true,
        timestamps: true,
    },
);

const MonitorModel = mongoose.model('Monitor', monitorSchema);

export { MonitorModel };
