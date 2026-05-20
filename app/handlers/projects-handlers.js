/* ***************** IMPORT packages *********************** */
import mongoose from 'mongoose';
import { ProjectModel } from '../models/project.js';
import {
    DEFAULT_SORTING_PARAMS,
    validateQueryParams,
} from '../utils/validateQueryParams.js';
import { BadRequest, InternalServerError } from '../middlewares/error-handlers.js';
import { TechnologyModel } from '../models/technology.js';

/* ***************** DECLARE handlers *********************** */

/**
 *
 * @param {import('express').Request} req - Express request object with query parameters
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 * @returns List of Projects
 */
async function getAllProjects(req, res, next) {
    try {
        const {  sort, limit, offset, embed, filter } = validateQueryParams(
            req.query,
            'title',
            'createdAt',
            'updatedAt',
            'embed',
        );

        const projects = await ProjectModel.find(filter)
            .sort(sort || DEFAULT_SORTING_PARAMS.projects)
            .limit(limit)
            .skip(offset)
            .populate(embed);

        return res.json(projects);
    } catch (err) {
        if (err instanceof mongoose.Error.ValidationError) {
            next(new BadRequest(err.message, err));
        } else {
            next(new InternalServerError(err));
        }
    }
}

/**
 *
 * @param {import('express').Request} req - Express request object with query parameters
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 * @returns List of Projects
 */
async function getProjectById(req, res, next) {
    try {
        const projectId = req.params.id;
        const { embed } = validateQueryParams(req.query, 'embed');

        const projects = await ProjectModel.findById(projectId).populate(embed);

        return res.json(projects);
    } catch (err) {
        if (err instanceof mongoose.Error.ValidationError) {
            next(new BadRequest(err.message, err));
        } else {
            next(new InternalServerError(err));
        }
    }
}

/**
 *
 * @param {import('express').Request} req - Express request object with query parameters
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 * @returns List of Projects
 */
async function createNewProject(req, res, next) {
    try {
        const projectToCreate = req.body;
        const technologies = projectToCreate.technologies || [];

        // Normalize names (important for consistency)
        const normalized = technologies.map(t => ({
            ...t,
            name: t.name?.trim(),
        }));

        // 1. Split by id presence
        const withId = normalized.filter(t => t._id);
        const withoutId = normalized.filter(t => !t._id);

        // 2. Validate existing IDs
        const existingDocs = await TechnologyModel.find({
            _id: { $in: withId.map(t => t._id) }
        });

        const foundIds = new Set(existingDocs.map(d => d._id.toString()));

        const invalidIds = withId
            .map(t => t._id)
            .filter(id => !foundIds.has(id.toString()));

        if (invalidIds.length) {
            return next(new BadRequest(
                `Invalid technology IDs: ${invalidIds.join(', ')}`
            ));
        }

        // 3. Find existing technologies WITHOUT id (by name)
        const names = withoutId.map(t => t.name);

        const existingByName = await TechnologyModel.find({
            name: { $in: names }
        });

        const existingNameMap = new Map(
            existingByName.map(t => [t.name, t])
        );

        // 4. Filter truly new technologies
        const newTechs = withoutId.filter(t => !existingNameMap.has(t.name));

        // 5. Insert only missing ones
        const createdTechs = newTechs.length
            ? await TechnologyModel.insertMany(newTechs)
            : [];

        // 6. Build final list
        const finalTechIds = [
            ...existingDocs.map(t => t._id),
            ...existingByName.map(t => t._id),
            ...createdTechs.map(t => t._id),
        ];

        // 7. Create project
        const project = await ProjectModel.create({
            ...projectToCreate,
            technologies: finalTechIds,
        });

        const result = await ProjectModel.findById(project._id)
            .populate('technologies');

        return res.json(result);

    } catch (err) {
        if (err instanceof mongoose.Error.ValidationError) {
            return next(new BadRequest(err.message, err));
        }

        return next(new InternalServerError(err));
    }
}

function updateProjectById(_req, _res, _next) {}

function deleteProjectById(_req, _res, _next) {}

export {
    getAllProjects,
    getProjectById,
    createNewProject,
    updateProjectById,
    deleteProjectById,
};
