/* ***************** IMPORT packages *********************** */
import express from 'express';
import rateLimit from 'express-rate-limit';

/* ***************** IMPORT REQUEST-HANDLER **************** */
import { getServiceStatus } from '../handlers/status-handlers.js';

/* ***************** CONFIG and CONSTS ********************* */
const statusRouter = express.Router();

// Public and unauthenticated, so it has no login wall to slow abuse down —
// unlike the Metrion-side cache, this limits by caller, not by endpoint. A
// real visitor's client polls every 15s (POLL_MS in status-page.jsx), i.e.
// ~4 requests/minute; 60/minute leaves headroom for several visitors sharing
// one IP (NAT, office network) while still capping how many upstream Metrion
// fetches (or outbound sockets, while a Metrion slowdown is in progress) a
// single caller can force per minute.
const statusLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: { status: 429, message: 'Too many requests. Please try again later.' },
});

/* ***************** PUBLIC ROUTES ************************* */
// Public — a status page is meant to be reachable without signing in.
statusRouter.get('/', statusLimiter, getServiceStatus);

export { statusRouter };
