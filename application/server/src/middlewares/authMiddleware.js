import jwt from 'jsonwebtoken';
import { Unauthorized } from './error-handlers.js';

/**
 * Builds a guard that accepts only tokens carrying the given role.
 *
 * The role check is the point, not a formality. Two kinds of token are signed
 * with the same secret - the admin token from `/auth/login` and the far weaker
 * one `/auth/unlock` hands the secret page - so verifying the signature alone
 * would let the unlock token drive every admin write route. Signature first,
 * then role.
 *
 * @param {string} role
 * @returns {import('express').RequestHandler}
 */
function requireRole(role) {
    return (req, res, next) => {
        const token = req.header('Authorization')?.split(' ')[1]; // Extracts token from "Bearer <token>"

        if (!token) {
            return next(new Unauthorized());
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            if (decoded.role !== role) {
                return next(new Unauthorized('Insufficient privileges.'));
            }

            req.user = decoded; // Attach user info to request
            next(); // Proceed to route handler
        } catch (error) {
            next(new Unauthorized(error.message, error));
        }
    };
}

const authMiddleware = requireRole('admin');
const secretMiddleware = requireRole('secret');

export { authMiddleware, secretMiddleware, requireRole };
