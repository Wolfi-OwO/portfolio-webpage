/* ***************** IMPORT packages *********************** */
import mongoose from 'mongoose';
import { AttachmentModel } from '../models/attachment.js';
import { AvailabilityModel } from '../models/availability.js';
import { BadRequest, InternalServerError, NotFound } from '../middlewares/error-handlers.js';
import {
    ALLOWED,
    MAX_ATTACHMENTS_PER_ENTRY,
    MAX_ATTACHMENT_BYTES,
    cleanName,
} from '../utils/attachment-rules.js';

/**
 * Attaches the request body (the raw file) to a career entry. The admin's browser sends the file as the body with
 * its own Content-Type and the name in X-File-Name, so no multipart parser is needed.
 */
async function createAttachment(req, res, next) {
    try {
        const id = String(req.params.id);
        if (!mongoose.isValidObjectId(id)) return next(new BadRequest('Invalid id.'));
        const entry = await AvailabilityModel.findById(id).select('_id');
        if (!entry) return next(new NotFound('Entry not found.'));

        const mime = String(req.headers['content-type'] ?? '')
            .split(';')[0]
            .trim()
            .toLowerCase();
        const rule = ALLOWED[mime];
        // A copy of the guarded body: from here on it is a Buffer and nothing else.
        const body = Buffer.isBuffer(req.body) ? Buffer.from(req.body) : null;
        if (!rule || !body || body.length === 0) {
            return next(
                new BadRequest('Attach a PDF, an image, a text file or an Office document.'),
            );
        }
        if (body.length > MAX_ATTACHMENT_BYTES) {
            return next(new BadRequest('The file is larger than 10 MB.'));
        }
        if (!rule.check(body)) {
            return next(new BadRequest('The file content does not match its type.'));
        }
        if (
            (await AttachmentModel.countDocuments({ entry: entry._id })) >=
            MAX_ATTACHMENTS_PER_ENTRY
        ) {
            return next(
                new BadRequest(`An entry holds at most ${MAX_ATTACHMENTS_PER_ENTRY} attachments.`),
            );
        }

        const headerName = req.headers['x-file-name'];
        const fileName = typeof headerName === 'string' ? headerName : '';
        const created = await AttachmentModel.create({
            entry: entry._id,
            name: cleanName(fileName),
            mime,
            size: body.length,
            data: body,
        });
        return res.status(201).json(created.toJSON());
    } catch (err) {
        if (err instanceof mongoose.Error.CastError)
            return next(new BadRequest('Invalid id.', err));
        return next(new InternalServerError(err));
    }
}

/** The file itself. A draft entry's files are the admin's alone; everyone else gets the same 404 as for a missing id. */
async function downloadAttachment(req, res, next) {
    try {
        const id = String(req.params.id);
        if (!mongoose.isValidObjectId(id)) return next(new NotFound('Attachment not found.'));
        const file = await AttachmentModel.findById(id).select('+data');
        const entry = file && (await AvailabilityModel.findById(file.entry).select('published'));
        if (!file || !entry || (!entry.published && req.user?.role !== 'admin')) {
            return next(new NotFound('Attachment not found.'));
        }
        const rule = ALLOWED[file.mime];
        const encoded = encodeURIComponent(file.name).replace(/['()]/g, escape);
        res.set({
            'Content-Type': file.mime,
            'Content-Length': String(file.data.length),
            'Content-Disposition': `${rule?.inline ? 'inline' : 'attachment'}; filename*=UTF-8''${encoded}`,
            // The type was checked on the way in; the browser must not second-guess it.
            'X-Content-Type-Options': 'nosniff',
            'Cache-Control': req.user ? 'private, no-store' : 'public, max-age=3600',
        });
        return res.send(file.data);
    } catch (err) {
        if (err instanceof mongoose.Error.CastError)
            return next(new NotFound('Attachment not found.'));
        return next(new InternalServerError(err));
    }
}

async function deleteAttachment(req, res, next) {
    try {
        const id = String(req.params.id);
        if (!mongoose.isValidObjectId(id)) return next(new NotFound('Attachment not found.'));
        const removed = await AttachmentModel.findByIdAndDelete(id);
        if (!removed) return next(new NotFound('Attachment not found.'));
        return res.status(204).end();
    } catch (err) {
        if (err instanceof mongoose.Error.CastError)
            return next(new NotFound('Attachment not found.'));
        return next(new InternalServerError(err));
    }
}

/** @returns Map of entry id -> attachments (without bytes) for the given entries. */
async function attachmentsByEntry(entryIds) {
    const files = await AttachmentModel.find({ entry: { $in: entryIds } }).sort({ createdAt: 1 });
    const map = new Map();
    for (const f of files) {
        const key = String(f.entry);
        map.set(key, [...(map.get(key) ?? []), f.toJSON()]);
    }
    return map;
}

export { createAttachment, downloadAttachment, deleteAttachment, attachmentsByEntry };
