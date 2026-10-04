/* ***************** IMPORT packages *********************** */
import mongoose from 'mongoose';
import { ContactMessageModel } from '../models/contact-message.js';
import { validateContact } from '../utils/contact-validation.js';
import { BadRequest, InternalServerError, NotFound } from '../middlewares/error-handlers.js';
import { listPayload, contact as contactLinks } from '../utils/hateoas.js';
import { logger } from '../utils/logger.js';

// Logs never carry the message, the address or the IP: only the event, the field lengths and the id.

/**
 * POST /api/contact. Spam (filled honeypot, impossible timing) gets the same 201 as a real
 * message, so a bot cannot tell it was filtered.
 */
async function createContactMessage(req, res, next) {
    try {
        const result = validateContact(req.body);

        if (!result.ok) {
            const err = new BadRequest('Invalid contact message.');
            err.details = result.errors; // per-field codes, e.g. { email: 'invalid_format' }
            return next(err);
        }

        if (result.spam) {
            logger.info(`contact: dropped (${result.spam})`);
        } else {
            const { name, email, subject, message } = result.value;
            const saved = await ContactMessageModel.create(result.value);
            logger.info(
                `contact: stored id=${saved._id} lengths name=${name.length} email=${email.length} subject=${subject.length} message=${message.length}`,
            );
        }

        return res.status(201).json({ status: 201, message: 'Message received.' });
    } catch (err) {
        return next(new InternalServerError(err));
    }
}

/** GET /api/contact (admin): newest first, same `{ _links, count, items }` shape as the other lists. */
async function getAllContactMessages(req, res, next) {
    try {
        const messages = await ContactMessageModel.find().sort({ createdAt: -1 });
        return res.json(listPayload(req, contactLinks, messages));
    } catch (err) {
        return next(new InternalServerError(err));
    }
}

/** DELETE /api/contact/:id (admin) */
async function deleteContactMessageById(req, res, next) {
    try {
        const deleted = await ContactMessageModel.findByIdAndDelete(req.params.id);

        if (!deleted) {
            return next(new NotFound(`Message ${req.params.id} not found.`));
        }

        logger.info(`contact: deleted id=${req.params.id}`);
        return res.status(204).send();
    } catch (err) {
        if (err instanceof mongoose.Error.CastError) {
            return next(new BadRequest('Invalid message id.', err));
        }
        return next(new InternalServerError(err));
    }
}

export { createContactMessage, getAllContactMessages, deleteContactMessageById };
