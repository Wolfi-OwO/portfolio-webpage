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

/* ***************** CONFIG and CONSTS ********************* */
const projectsRouter = express.Router();

projectsRouter.get('', getAllProjects);
projectsRouter.get('{id}', getProjectById);
projectsRouter.post('', createNewProject);
projectsRouter.put('{id}', updateProjectById);
projectsRouter.delete('{id}', deleteProjectById);

export { projectsRouter };
