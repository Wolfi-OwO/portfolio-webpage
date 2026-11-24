import mongoose from 'mongoose';

/**
 * A file the admin attached to a career entry (a thesis, a certificate, a reference letter). The bytes sit in the
 * document itself: the files are a few megabytes at most, the database already holds everything else, and there
 * is no second store to back up or to keep in step with the entry. `data` is never part of a list or an entry:
 * every read that is not the download itself leaves it out.
 */
const attachmentSchema = new mongoose.Schema(
    {
        entry: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Availability',
            required: true,
            index: true,
        },
        name: { type: String, required: true, maxlength: 120 },
        mime: { type: String, required: true },
        size: { type: Number, required: true },
        data: { type: Buffer, required: true, select: false },
    },
    { timestamps: { createdAt: true, updatedAt: false } },
);

attachmentSchema.set('toJSON', {
    transform: (_doc, ret) => ({
        id: String(ret._id),
        name: ret.name,
        mime: ret.mime,
        size: ret.size,
        createdAt: ret.createdAt,
    }),
});

export const AttachmentModel = mongoose.model('Attachment', attachmentSchema);
