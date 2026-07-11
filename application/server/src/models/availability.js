import mongoose from 'mongoose';

/**
 * One block of my calendar: an internship, the military service, a stretch of
 * being free. The homepage timeline is drawn straight from these — segment
 * widths come from the dates, and which entry reads as "current" is decided by
 * today's date, not by a flag someone has to remember to flip.
 *
 * `endDate` is optional: an open-ended entry ("available from …") is the last
 * segment and simply has no end.
 */
const availabilitySchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
        },
        description: {
            type: String,
        },
        startDate: {
            type: Date,
            required: true,
            index: true,
        },
        endDate: {
            type: Date,
            default: null,
            // An entry that ends before it starts would draw a negative-width
            // segment on the timeline. Null stays legal: that means open-ended.
            validate: {
                validator: function isAfterStart(value) {
                    return !value || !this.startDate || value >= this.startDate;
                },
                message: 'endDate must not be before startDate.',
            },
        },
        // Drives the colour of the segment: busy blocks read as unavailable,
        // 'available' reads as open.
        kind: {
            type: String,
            required: true,
            enum: ['work', 'military', 'education', 'available'],
            default: 'work',
        },
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

const AvailabilityModel = mongoose.model('Availability', availabilitySchema);

export { AvailabilityModel };
