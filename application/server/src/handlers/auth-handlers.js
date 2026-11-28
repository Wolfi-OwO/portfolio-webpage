import jwt from 'jsonwebtoken';
import { verifyAdminPassword, isLegacy } from '../utils/admin-password.js';
import { BadRequest, Unauthorized } from '../middlewares/error-handlers.js';
import { authLoginLinks, authUnlockLinks } from '../utils/hateoas.js';

const ADMIN_USER = process.env.ADMIN_USER;
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

// The secret page is read in one sitting, so its token does not need to outlive
// one. Shorter than the admin token on purpose.
const SECRET_EXPIRES_IN = process.env.SECRET_EXPIRES_IN || '30m';

/**
 * Every refusal says whether the page should retry once with the typed password.
 * That depends only on whether a proof is stored yet, never on what was sent,
 * so it tells a guesser nothing.
 */
async function refusal(message) {
    const error = new Unauthorized(message);
    error.legacyLogin = await isLegacy();
    return error;
}

/**
 * Issues a JWT for a valid admin username/password pair.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function login(req, res, next) {
    try {
        const { username, password, legacyPassword } = req.body || {};

        if (
            typeof username !== 'string' ||
            typeof password !== 'string' ||
            !username ||
            !password
        ) {
            return next(new BadRequest('Username and password are required.'));
        }

        const usernameMatches = username === ADMIN_USER;
        // Checked even for a wrong username, so the timing does not tell the two apart.
        const passwordMatches = await verifyAdminPassword(password, legacyPassword);

        if (!usernameMatches || !passwordMatches) {
            return next(await refusal('Invalid credentials.'));
        }

        const token = jwt.sign({ sub: username, role: 'admin' }, JWT_SECRET, {
            expiresIn: JWT_EXPIRES_IN,
        });

        return res.json({ token, expiresIn: JWT_EXPIRES_IN, _links: authLoginLinks() });
    } catch (err) {
        return next(err);
    }
}

/**
 * Checks a bare password against the admin password and issues a `secret` token.
 *
 * The secret page gates on the admin password alone - it has no username field
 * to fill in, and hardcoding ADMIN_USER into the client bundle just to satisfy
 * /auth/login would leak it for no benefit.
 *
 * The token this returns is emphatically not an admin token. It carries
 * `role: 'secret'`, and every admin route is guarded by a middleware that
 * insists on `role: 'admin'`, so the only thing it opens is the secret page's
 * own download. It exists because that download has to be gated somewhere the
 * client cannot simply lie about - sessionStorage is not a lock.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function unlock(req, res, next) {
    try {
        const { password, legacyPassword } = req.body || {};

        if (typeof password !== 'string' || !password) {
            return next(new BadRequest('Password is required.'));
        }

        if (!(await verifyAdminPassword(password, legacyPassword))) {
            return next(await refusal('Invalid password.'));
        }

        const token = jwt.sign({ sub: 'secret', role: 'secret' }, JWT_SECRET, {
            expiresIn: SECRET_EXPIRES_IN,
        });

        return res.json({ token, expiresIn: SECRET_EXPIRES_IN, _links: authUnlockLinks() });
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
