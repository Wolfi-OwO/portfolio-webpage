import mongoose from 'mongoose';
import { TechnologyModel } from '../models/technology.js';
import { BadRequest, InternalServerError, NotFound } from '../middlewares/error-handlers.js';
import { validateQueryParams } from '../utils/validateQueryParams.js';

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function getAllTechnologies(req, res, next) {
    try {
        const { sort, limit, offset, filter } = validateQueryParams(
            req.query,
            'tech',
            'createdAt',
            'updatedAt',
        );

        const technologies = await TechnologyModel.find(filter)
            .sort(sort || '+tech')
            .limit(limit)
            .skip(offset);

        return res.json(technologies);
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
async function getTechnologyById(req, res, next) {
    try {
        const technology = await TechnologyModel.findById(req.params.id);

        if (!technology) {
            return next(new NotFound(`Technology ${req.params.id} not found.`));
        }

        return res.json(technology);
    } catch (err) {
        if (err instanceof mongoose.Error.CastError) {
            return next(new BadRequest('Invalid technology id.', err));
        }
        return next(new InternalServerError(err));
    }
}

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function createTechnology(req, res, next) {
    try {
        const { tech, color } = req.body || {};

        if (!tech || !color) {
            return next(new BadRequest('tech and color are required.'));
        }

        const existing = await TechnologyModel.findOne({ tech: tech.trim() });
        if (existing) {
            return next(new BadRequest(`Technology "${tech}" already exists.`));
        }

        const created = await TechnologyModel.create({ tech: tech.trim(), color });
        return res.status(201).json(created);
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
async function updateTechnologyById(req, res, next) {
    try {
        const updated = await TechnologyModel.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });

        if (!updated) {
            return next(new NotFound(`Technology ${req.params.id} not found.`));
        }

        return res.json(updated);
    } catch (err) {
        if (err instanceof mongoose.Error.ValidationError) {
            return next(new BadRequest(err.message, err));
        }
        if (err instanceof mongoose.Error.CastError) {
            return next(new BadRequest('Invalid technology id.', err));
        }
        return next(new InternalServerError(err));
    }
}

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function deleteTechnologyById(req, res, next) {
    try {
        const deleted = await TechnologyModel.findByIdAndDelete(req.params.id);

        if (!deleted) {
            return next(new NotFound(`Technology ${req.params.id} not found.`));
        }

        return res.status(204).end();
    } catch (err) {
        if (err instanceof mongoose.Error.CastError) {
            return next(new BadRequest('Invalid technology id.', err));
        }
        return next(new InternalServerError(err));
    }
}

export {
    getAllTechnologies,
    getTechnologyById,
    createTechnology,
    updateTechnologyById,
    deleteTechnologyById,
};
