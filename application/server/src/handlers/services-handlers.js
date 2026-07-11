/* ***************** IMPORT packages *********************** */
import mongoose from 'mongoose';
import { ServiceModel } from '../models/service.js';
import { validateQueryParams } from '../utils/validateQueryParams.js';
import { BadRequest, InternalServerError, NotFound } from '../middlewares/error-handlers.js';

/* ***************** DECLARE handlers *********************** */

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns List of services, cheapest-first within the manual `order`.
 */
async function getAllServices(req, res, next) {
    try {
        const { sort, limit, offset, filter } = validateQueryParams(
            req.query,
            'title',
            'order',
            'priceFrom',
            'createdAt',
            'updatedAt',
        );

        const services = await ServiceModel.find(filter)
            .sort(sort || { order: 1, priceFrom: 1 })
            .limit(limit)
            .skip(offset);

        return res.json(services);
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
async function getServiceById(req, res, next) {
    try {
        const service = await ServiceModel.findById(req.params.id);

        if (!service) {
            return next(new NotFound(`Service ${req.params.id} not found.`));
        }

        return res.json(service);
    } catch (err) {
        if (err instanceof mongoose.Error.CastError) {
            return next(new BadRequest('Invalid service id.', err));
        }
        return next(new InternalServerError(err));
    }
}

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function createNewService(req, res, next) {
    try {
        const service = await ServiceModel.create(req.body);

        return res.status(201).json(service);
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
async function updateServiceById(req, res, next) {
    try {
        const updated = await ServiceModel.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });

        if (!updated) {
            return next(new NotFound(`Service ${req.params.id} not found.`));
        }

        return res.json(updated);
    } catch (err) {
        if (err instanceof mongoose.Error.ValidationError) {
            return next(new BadRequest(err.message, err));
        }
        if (err instanceof mongoose.Error.CastError) {
            return next(new BadRequest('Invalid service id.', err));
        }
        return next(new InternalServerError(err));
    }
}

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function deleteServiceById(req, res, next) {
    try {
        const deleted = await ServiceModel.findByIdAndDelete(req.params.id);

        if (!deleted) {
            return next(new NotFound(`Service ${req.params.id} not found.`));
        }

        return res.status(204).send();
    } catch (err) {
        if (err instanceof mongoose.Error.CastError) {
            return next(new BadRequest('Invalid service id.', err));
        }
        return next(new InternalServerError(err));
    }
}

export {
    getAllServices,
    getServiceById,
    createNewService,
    updateServiceById,
    deleteServiceById,
};
