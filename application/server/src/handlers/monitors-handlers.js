import mongoose from 'mongoose';
import { MonitorModel } from '../models/monitor.js';
import { BadRequest, InternalServerError, NotFound } from '../middlewares/error-handlers.js';

// Blank/whitespace-only group means "no group" — store null, not an empty string.
function normalizeGroup(group) {
    const trimmed = typeof group === 'string' ? group.trim() : '';
    return trimmed || null;
}

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns List of monitored URLs
 */
async function getAllMonitors(req, res, next) {
    try {
        const monitors = await MonitorModel.find().sort({ createdAt: 1 });
        return res.json(monitors);
    } catch (err) {
        next(new InternalServerError(err));
    }
}

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function createMonitor(req, res, next) {
    try {
        const { name, url, group } = req.body;

        if (!name || !url) {
            return next(new BadRequest('Both "name" and "url" are required.'));
        }

        try {
            const parsed = new URL(url);
            if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
                throw new Error('unsupported protocol');
            }
        } catch {
            return next(new BadRequest('"url" must be a valid http(s) URL.'));
        }

        const monitor = await MonitorModel.create({ name, url, group: normalizeGroup(group) });
        return res.status(201).json(monitor);
    } catch (err) {
        if (err instanceof mongoose.Error.ValidationError) {
            return next(new BadRequest(err.message, err));
        }
        return next(new InternalServerError(err));
    }
}

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function updateMonitorById(req, res, next) {
    try {
        const { name, url, group } = req.body;

        if (!name || !url) {
            return next(new BadRequest('Both "name" and "url" are required.'));
        }

        try {
            const parsed = new URL(url);
            if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
                throw new Error('unsupported protocol');
            }
        } catch {
            return next(new BadRequest('"url" must be a valid http(s) URL.'));
        }

        const updated = await MonitorModel.findByIdAndUpdate(
            req.params.id,
            { name, url, group: normalizeGroup(group) },
            { new: true, runValidators: true },
        );

        if (!updated) {
            return next(new NotFound(`Monitor ${req.params.id} not found.`));
        }

        return res.json(updated);
    } catch (err) {
        if (err instanceof mongoose.Error.ValidationError) {
            return next(new BadRequest(err.message, err));
        }
        if (err instanceof mongoose.Error.CastError) {
            return next(new BadRequest('Invalid monitor id.', err));
        }
        return next(new InternalServerError(err));
    }
}

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function deleteMonitorById(req, res, next) {
    try {
        const deleted = await MonitorModel.findByIdAndDelete(req.params.id);

        if (!deleted) {
            return next(new NotFound(`Monitor ${req.params.id} not found.`));
        }

        return res.status(204).end();
    } catch (err) {
        if (err instanceof mongoose.Error.CastError) {
            return next(new BadRequest('Invalid monitor id.', err));
        }
        return next(new InternalServerError(err));
    }
}

export { getAllMonitors, createMonitor, updateMonitorById, deleteMonitorById };
