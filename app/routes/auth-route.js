import express from 'express';
import { login } from '../handlers/auth-handlers.js';

const authRouter = express.Router();

authRouter.post('/login', login);

export { authRouter };
