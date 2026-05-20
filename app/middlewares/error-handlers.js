import { logger } from '../utils/logger.js';

/**
 * Creates a BadRequest error (400).
 * @param {string} msg - Error message
 * @param {Error} [innerErr] - Inner error object
 * @constructor
 */
function BadRequest(msg, innerErr) {
    this.status = 400;
    this.message = msg;
    this.details = innerErr?.message;
    this.innerErr = innerErr;
}

/**
 * Creates a NotFound error (404).
 * @param {string} msg - Error message
 * @constructor
 */
function NotFound(msg) {
    this.status = 404;
    this.message = msg;
    this.details = '-';
}

/**
 * Creates a PreConditionFailed error (412).
 * @param {string} msg - Error message
 * @constructor
 */
function PreConditionFailed(msg) {
    this.status = 412;
    this.message = msg;
    this.details = '-';
}

/**
 * Creates an UnsupportedMediaType error (415).
 * @param {string} msg - Error message
 * @constructor
 */
function UnsupportedMediaType(msg) {
    this.status = 415;
    this.message = msg;
    this.details = '-';
}

/**
 * Creates an InternalServerError error (500).
 * @param {Error} [innerErr] - Inner error object
 * @constructor
 */
function InternalServerError(innerErr) {
    this.status = 500;
    this.message = 'Unexpected';
    this.innerErr = innerErr;
}

/**
 * Creates an Unauthorized error (401).
 * @param {string} msg - Error message
 * @constructor
 */
function Unauthorized(msg) {
    this.status = 401;
    this.message = msg;
}

/**
 * Creates a Forbidden error (403).
 * @param {string} msg - Error message
 * @constructor
 */
function Forbidden(msg) {
    this.status = 403;
    this.message = msg;
}

/**
 * Express error handler middleware.
 * @param {Error} error - The error object
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} resp - Express response object
 * @param {import('express').NextFunction} _next - Express next function (unused)
 */
const errorHandler = (error, req, resp, _next) => {
    error.status = error.status || 500;
    error.message = error.message || 'Internal server error';
    error.details = error.details || 'Unexpected';
    error.instance = error.instance || req.path;
    error.method = error.method || req.method;

    log({ ...error });

    resp.header('Content-Type', 'application/json');

    delete error.innerErr;
    resp.status(error.status).json(error);
};

/**
 * Logs an error based on its status code.
 * @param {Error} err - The error object to log
 */
const log = err => {
    if (err.status >= 300 && err.status < 500 && process.env.NODE_ENV !== 'production') {
        logger.debug(JSON.stringify(err));
    } else {
        logger.error(JSON.stringify(err));
        logger.error(err?.innerErr?.stack);
    }
};

export {
    errorHandler,
    BadRequest,
    Unauthorized,
    Forbidden,
    NotFound,
    PreConditionFailed,
    UnsupportedMediaType,
    InternalServerError,
};
