import express from 'express';
import rateLimit from 'express-rate-limit';
import { login, unlock, logout } from '../handlers/auth-handlers.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const authRouter = express.Router();

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { status: 429, message: 'Too many login attempts. Please try again later.' },
});

authRouter.post('/login', loginLimiter, login);
authRouter.post('/unlock', loginLimiter, unlock);
authRouter.post('/logout', authMiddleware, logout);

export { authRouter };
