/* ***************** IMPORT packages *********************** */
import mongoose from 'mongoose';
import { ProjectModel } from '../models/projects';
import { validateQueryParams } from '../utils/validateQueryParams.js';
import { BadRequest, InternalServerError } from '../middlewares/error-handlers.js';

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
        const { sort, embed, offset, limit, ...filter } = validateQueryParams(
            req.query,
            'title',
            'createdAt',
            'updatedAt',
            'embed'
        );

        const projects = await ProjectModel.find(filter)
            .sort(sort)
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
 * @param {import('express').Request} _req - Express request object with query parameters
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} _next - Express next function
 * @returns The given project with the id or 404 Not-Found error.
 */
function getProjectById(_req, _res, _next) {}

function createNewProject(_req, _res, _next) {}

function updateProjectById(_req, _res, _next) {}

function deleteProjectById(_req, _res, _next) {}

export { getAllProjects, getProjectById, createNewProject, updateProjectById, deleteProjectById };
