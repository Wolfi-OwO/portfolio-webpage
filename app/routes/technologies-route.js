import express from 'express';

import {
    getAllTechnologies,
    getTechnologyById,
    createTechnology,
    updateTechnologyById,
    deleteTechnologyById,
} from '../handlers/technologies-handlers.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const technologiesRouter = express.Router();

technologiesRouter.get('', getAllTechnologies);
technologiesRouter.get('{id}', getTechnologyById);
technologiesRouter.post('', authMiddleware, createTechnology);
technologiesRouter.put('{id}', authMiddleware, updateTechnologyById);
technologiesRouter.delete('{id}', authMiddleware, deleteTechnologyById);

export { technologiesRouter };
