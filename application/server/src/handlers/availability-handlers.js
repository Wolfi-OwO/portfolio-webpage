/* ***************** IMPORT packages *********************** */
import mongoose from 'mongoose';
import { AvailabilityModel } from '../models/availability.js';
import { validateQueryParams } from '../utils/validateQueryParams.js';
import { BadRequest, InternalServerError, NotFound } from '../middlewares/error-handlers.js';
import { listPayload, withLinks, availability as availabilityLinks } from '../utils/hateoas.js';

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

        // `published` is client-enforced everywhere else (the timeline hides
        // drafts by filtering after the fetch); this is the one place it must
        // also be server-enforced, since this route has no auth at all for
        // anonymous visitors. Only a verified admin (see optionalAuth) sees drafts.
        if (req.user?.role !== 'admin') {
            filter.published = true;
        }

        const entries = await AvailabilityModel.find(filter)
            .sort(sort || { startDate: 1 })
            .limit(limit)
            .skip(offset);

        return res.json(listPayload(req, availabilityLinks, entries));
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

        // Same not-found response whether the id doesn't exist or is a draft
        // an anonymous/non-admin caller shouldn't see — a distinct message here
        // would let a caller tell the two cases apart, which is its own leak.
        if (!entry || (!entry.published && req.user?.role !== 'admin')) {
            return next(new NotFound(`Availability entry ${req.params.id} not found.`));
        }

        return res.json(withLinks(entry, availabilityLinks.item(entry._id)));
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

        res.set('Location', `/api/availability/${entry._id}`);
        return res.status(201).json(withLinks(entry, availabilityLinks.item(entry._id)));
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

        return res.json(withLinks(updated, availabilityLinks.item(updated._id)));
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
