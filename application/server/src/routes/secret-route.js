import express from 'express';
import rateLimit from 'express-rate-limit';
import { downloadVoucherReceipt } from '../handlers/secret-handlers.js';
import { secretMiddleware } from '../middlewares/authMiddleware.js';

const secretRouter = express.Router();

// Every hit proxies a 600 KB blob out of Azure. One reader on one evening has no
// use for more than this, and it keeps a leaked token from running up egress.
const downloadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { status: 429, message: 'Too many downloads. Please try again later.' },
});

secretRouter.get('/voucher', downloadLimiter, secretMiddleware, downloadVoucherReceipt);

export { secretRouter };
