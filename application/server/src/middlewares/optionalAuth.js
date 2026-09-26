import jwt from 'jsonwebtoken';

/**
 * Identifies an admin caller without ever rejecting the request.
 *
 * Unlike `authMiddleware`/`requireRole`, this is for public read routes that
 * need to know "is this the admin looking at their own drafts?" without
 * requiring a token — a missing, expired or malformed token is simply an
 * anonymous visitor, not an error. Any failure just leaves `req.user` unset
 * and continues; only `decoded.role === 'admin'` sets it.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function optionalAuth(req, res, next) {
    const token = req.header('Authorization')?.split(' ')[1]; // Extracts token from "Bearer <token>"

    if (!token) {
        return next();
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.role === 'admin') {
            req.user = decoded;
        }
    } catch (_error) {
        // Invalid/expired token: treat as anonymous, do not reject.
    }

    next();
}

export { optionalAuth };
