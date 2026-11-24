import rateLimit from 'express-rate-limit';

// Files are read from the database, so every request costs a query and up to ten megabytes of bytes. The limits are
// per visitor (the app trusts one proxy hop, see server.js) and far above what a person opening a few files needs.
const message = (text) => ({ status: 429, message: text });

export const attachmentReadLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 120,
    standardHeaders: true,
    legacyHeaders: false,
    message: message('Too many requests. Please try again in a minute.'),
});

// Uploads and deletes are the admin's alone; this only stops a runaway client.
export const attachmentWriteLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: message('Too many changes. Please try again in a minute.'),
});
