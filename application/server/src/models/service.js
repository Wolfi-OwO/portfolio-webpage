import mongoose from 'mongoose';

/**
 * A thing I build for money: a website, an Android app, a desktop GUI.
 *
 * Prices are deliberately modelled as a *starting* price plus an hourly rate,
 * not a fixed quote — the page promises "ab X €", and anything precise has to
 * come out of an actual conversation. Both are stored in whole euros; there is
 * no cent-level pricing anywhere in this domain.
 */
const serviceSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            index: true,
        },
        // Short pitch, one or two sentences.
        description: {
            type: String,
            required: true,
        },
        // Groups the cards on the services page.
        category: {
            type: String,
            required: true,
            enum: ['web', 'mobile', 'desktop', 'other'],
            default: 'web',
        },
        // Bullet points: what is actually included.
        deliverables: [
            {
                type: String,
            },
        ],
        // Entry price in euros ("ab 600 €"). 0 means: only the hourly rate applies.
        priceFrom: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
        },
        // Euros per hour for work billed by time.
        hourlyRate: {
            type: Number,
            required: true,
            min: 0,
            default: 30,
        },
        // Rough calendar estimate, free text ("2–4 Wochen").
        duration: {
            type: String,
        },
        // Manual ordering on the page; lower comes first.
        order: {
            type: Number,
            default: 0,
        },
        // Lets a service be drafted without showing it publicly.
        published: {
            type: Boolean,
            default: true,
        },
    },
    {
        optimisticConcurrency: true,
        timestamps: true,
    },
);

const ServiceModel = mongoose.model('Service', serviceSchema);

export { ServiceModel };
