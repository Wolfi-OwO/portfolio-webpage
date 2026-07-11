import jwt from 'jsonwebtoken';
import { Unauthorized } from './error-handlers.js';

const authMiddleware = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1]; // Extracts token from "Bearer <token>"

    if (!token) {
        return next(new Unauthorized());
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = decoded; // Attach user info to request
        next(); // Proceed to route handler
    } catch (error) {
        next(new Unauthorized(error.message, error));
    }
};

export { authMiddleware };
