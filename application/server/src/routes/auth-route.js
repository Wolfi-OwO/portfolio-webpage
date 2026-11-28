import express from 'express';
import rateLimit from 'express-rate-limit';
import { login, unlock, logout } from '../handlers/auth-handlers.js';
import {
    finishLogin,
    finishRegistration,
    listPasskeys,
    loginOptions,
    registrationOptions,
    removePasskey,
} from '../handlers/passkey-handlers.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const authRouter = express.Router();

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: Number(process.env.LOGIN_RATE_LIMIT_MAX) || 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { status: 429, message: 'Too many login attempts. Please try again later.' },
});

// The management routes sit behind the admin token, but a stolen token should not be able to hammer them either.
const manageLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: true,
    legacyHeaders: false,
});

authRouter.post('/login', loginLimiter, login);
authRouter.post('/unlock', loginLimiter, unlock);
authRouter.post('/passkey/options', loginLimiter, loginOptions);
authRouter.post('/passkey/login', loginLimiter, finishLogin);
authRouter.get('/passkeys', manageLimiter, authMiddleware, listPasskeys);
authRouter.post('/passkeys/register/options', manageLimiter, authMiddleware, registrationOptions);
authRouter.post('/passkeys/register', manageLimiter, authMiddleware, finishRegistration);
authRouter.delete('/passkeys/:id', manageLimiter, authMiddleware, removePasskey);
authRouter.post('/logout', manageLimiter, authMiddleware, logout);

export { authRouter };
