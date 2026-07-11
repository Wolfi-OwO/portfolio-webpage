/* ***************** IMPORT packages *********************** */
import express from 'express';

/* ***************** IMPORT REQUEST-HANDLER **************** */
import {
    getAllProjects,
    getProjectById,
    createNewProject,
    updateProjectById,
    deleteProjectById,
} from '../handlers/projects-handlers.js';

import { authMiddleware } from '../middlewares/authMiddleware.js';

/* ***************** CONFIG and CONSTS ********************* */
const projectsRouter = express.Router();

/* ***************** PUBLIC ROUTES ************************* */
projectsRouter.get('/', getAllProjects);
projectsRouter.get('/:id', getProjectById);

/* ***************** PROTECTED ROUTES ********************** */
projectsRouter.post('/', authMiddleware, createNewProject);
projectsRouter.put('/:id', authMiddleware, updateProjectById);
projectsRouter.delete('/:id', authMiddleware, deleteProjectById);

export { projectsRouter };
