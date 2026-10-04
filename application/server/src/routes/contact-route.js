/* ***************** IMPORT packages *********************** */
import express from 'express';
import rateLimit from 'express-rate-limit';

/* ***************** IMPORT REQUEST-HANDLER **************** */
import {
    createContactMessage,
    getAllContactMessages,
    deleteContactMessageById,
} from '../handlers/contact-handlers.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

/**
 * Builds the router. `create` is injectable so the rate-limit test can mount it with a stub
 * handler; every call gets its own limiter store.
 */
function createContactRouter({ create = createContactMessage } = {}) {
    const router = express.Router();

    // 10 submissions per hour per visitor address, spam included. The address lives only in
    // the limiter's in-memory store (see `trust proxy` in server.js): nothing is logged or saved.
    const contactLimiter = rateLimit({
        windowMs: 60 * 60 * 1000,
        limit: 10,
        standardHeaders: true,
        legacyHeaders: false,
        message: { status: 429, message: 'Too many messages. Please try again later.' },
    });

    /* ***************** PUBLIC ROUTE ************************** */
    router.post('/', contactLimiter, create);

    /* ***************** PROTECTED ROUTES ********************** */
    router.get('/', authMiddleware, getAllContactMessages);
    router.delete('/:id', authMiddleware, deleteContactMessageById);

    return router;
}

const contactRouter = createContactRouter();

export { contactRouter, createContactRouter };
