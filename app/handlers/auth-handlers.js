import jwt from 'jsonwebtoken';
import { BadRequest, Unauthorized } from '../middlewares/error-handlers.js';

const ADMIN_USER = process.env.ADMIN_USER;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

/**
 * Issues a JWT for a valid admin username/password pair.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function login(req, res, next) {
    try {
        const { username, password } = req.body || {};

        if (!username || !password) {
            return next(new BadRequest('Username and password are required.'));
        }

        if (username !== ADMIN_USER || password !== ADMIN_PASSWORD) {
            return next(new Unauthorized('Invalid credentials.'));
        }

        const token = jwt.sign(
            { sub: username, role: 'admin' },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN },
        );

        return res.json({ token, expiresIn: JWT_EXPIRES_IN });
    } catch (err) {
        return next(err);
    }
}

export { login };
