/* ***************** IMPORT packages *********************** */
import express from 'express';
import rateLimit from 'express-rate-limit';

/* ***************** IMPORT REQUEST-HANDLER **************** */
import { getMusic } from '../handlers/music-handlers.js';

/* ***************** CONFIG and CONSTS ********************* */
const musicRouter = express.Router();

// Public; the handler caches for 30 minutes, the limiter only stops one caller from hammering it.
const musicLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { status: 429, message: 'Too many requests. Please try again later.' },
});

musicRouter.get('/', musicLimiter, getMusic);

export { musicRouter };
