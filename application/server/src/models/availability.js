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
        // Why this exists: `layout()` on the client lays every entry it is given
        // out as non-overlapping segments on one axis (widths summing to 100%),
        // and `badgeState()`/`currentEntry()` pick the first entry that contains
        // today. Career history genuinely overlaps — an internship sits inside a
        // multi-year school enrollment — so feeding it into the same rows would
        // break both the rail's width math and the "first match wins" badge
        // logic. `track` keeps career entries answering a different question
        // (history) on the same collection without corrupting either read.
        // Missing `track` (every document written before this field existed)
        // reads as 'availability', not just future writes: Mongoose applies
        // schema defaults on hydration, not only on save, so `.find()` already
        // returns 'availability' for old rows with no query change needed.
        track: {
            type: String,
            enum: ['availability', 'career'],
            default: 'availability',
            index: true,
        },
        organisation: {
            type: String,
        },
        location: {
            type: String,
        },
        // A same-origin path only ("/logos/infineon.svg") — never an external
        // URL, so a career entry can't be used to load a tracking pixel or hot-
        // link someone else's asset.
        logo: {
            type: String,
            validate: {
                validator: (value) => !value || !/^https?:\/\//i.test(value),
                message: 'logo must be a same-origin path, not an external URL.',
            },
        },
        // Matches the {tech, color} tag convention from projects.json / tech-color.js
        // verbatim, so career tags render with the same chip component.
        tags: {
            type: [
                {
                    tech: { type: String, required: true },
                    color: { type: String, required: true },
                    _id: false,
                },
            ],
            default: undefined,
        },
    },
    {
        optimisticConcurrency: true,
        timestamps: true,
    },
);

const AvailabilityModel = mongoose.model('Availability', availabilitySchema);

export { AvailabilityModel };
