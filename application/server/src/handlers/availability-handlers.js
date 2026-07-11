/* ***************** IMPORT packages *********************** */
import mongoose from 'mongoose';
import { AvailabilityModel } from '../models/availability.js';
import { validateQueryParams } from '../utils/validateQueryParams.js';
import { BadRequest, InternalServerError, NotFound } from '../middlewares/error-handlers.js';

/* ***************** DECLARE handlers *********************** */

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns The calendar blocks, oldest first — the order the timeline draws them in.
 */
async function getAllAvailability(req, res, next) {
    try {
        const { sort, limit, offset, filter } = validateQueryParams(
            req.query,
            'title',
            'startDate',
            'endDate',
            'createdAt',
            'updatedAt',
        );

        const entries = await AvailabilityModel.find(filter)
            .sort(sort || { startDate: 1 })
            .limit(limit)
            .skip(offset);

        return res.json(entries);
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
async function getAvailabilityById(req, res, next) {
    try {
        const entry = await AvailabilityModel.findById(req.params.id);

        if (!entry) {
            return next(new NotFound(`Availability entry ${req.params.id} not found.`));
        }

        return res.json(entry);
    } catch (err) {
        if (err instanceof mongoose.Error.CastError) {
            return next(new BadRequest('Invalid availability id.', err));
        }
        return next(new InternalServerError(err));
    }
}

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function createNewAvailability(req, res, next) {
    try {
        const entry = await AvailabilityModel.create(req.body);

        return res.status(201).json(entry);
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
async function updateAvailabilityById(req, res, next) {
    try {
        const updated = await AvailabilityModel.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });

        if (!updated) {
            return next(new NotFound(`Availability entry ${req.params.id} not found.`));
        }

        return res.json(updated);
    } catch (err) {
        if (err instanceof mongoose.Error.ValidationError) {
            return next(new BadRequest(err.message, err));
        }
        if (err instanceof mongoose.Error.CastError) {
            return next(new BadRequest('Invalid availability id.', err));
        }
        return next(new InternalServerError(err));
    }
}

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function deleteAvailabilityById(req, res, next) {
    try {
        const deleted = await AvailabilityModel.findByIdAndDelete(req.params.id);

        if (!deleted) {
            return next(new NotFound(`Availability entry ${req.params.id} not found.`));
        }

        return res.status(204).send();
    } catch (err) {
        if (err instanceof mongoose.Error.CastError) {
            return next(new BadRequest('Invalid availability id.', err));
        }
        return next(new InternalServerError(err));
    }
}

export {
    getAllAvailability,
    getAvailabilityById,
    createNewAvailability,
    updateAvailabilityById,
    deleteAvailabilityById,
};
