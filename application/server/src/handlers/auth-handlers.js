import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { BadRequest, Unauthorized } from '../middlewares/error-handlers.js';

const ADMIN_USER = process.env.ADMIN_USER;
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH;
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

// Dummy hash used to keep bcrypt.compare's timing similar when the submitted
// username doesn't match, so responses don't leak whether a username exists.
const DUMMY_HASH = '$2b$12$C6UzMDM.H6dfI/f/IKcEeO4pXEbf/pZ0GN2QxU9L1SgFsMImk.KX2';

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

        const usernameMatches = username === ADMIN_USER;
        const passwordMatches = await bcrypt.compare(
            password,
            usernameMatches ? ADMIN_PASSWORD_HASH : DUMMY_HASH,
        );

        if (!usernameMatches || !passwordMatches) {
            return next(new Unauthorized('Invalid credentials.'));
        }

        const token = jwt.sign({ sub: username, role: 'admin' }, JWT_SECRET, {
            expiresIn: JWT_EXPIRES_IN,
        });

        return res.json({ token, expiresIn: JWT_EXPIRES_IN });
    } catch (err) {
        return next(err);
    }
}

/**
 * Checks a bare password against the admin password, without issuing a token.
 *
 * The secret page gates on the admin password alone - it has no username field
 * to fill in, and hardcoding ADMIN_USER into the client bundle just to satisfy
 * /auth/login would leak it for no benefit. This grants no API access: it only
 * answers "is this the admin password", so the client can reveal a static page.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function unlock(req, res, next) {
    try {
        const { password } = req.body || {};

        if (!password) {
            return next(new BadRequest('Password is required.'));
        }

        const matches = await bcrypt.compare(password, ADMIN_PASSWORD_HASH || DUMMY_HASH);

        if (!matches) {
            return next(new Unauthorized('Invalid password.'));
        }

        return res.status(204).send();
    } catch (err) {
        return next(err);
    }
}

/**
 * Acknowledges a logout request. Tokens are stateless JWTs with a short
 * expiry and are not tracked server-side, so there is nothing to revoke -
 * the client is responsible for discarding the token it holds. This endpoint
 * exists so the frontend has a symmetric call to make on logout and so a
 * missing/invalid token is reported consistently via authMiddleware.
 *
 * @param {import('express').Request} _req
 * @param {import('express').Response} res
 */
function logout(_req, res) {
    return res.status(204).send();
}

export { login, unlock, logout };
