/* ***************** IMPORT packages *********************** */
import express from 'express';

/* ***************** IMPORT REQUEST-HANDLER **************** */
import {
    getAllTechnologies,
    getTechnologyById,
    createTechnology,
    updateTechnologyById,
    deleteTechnologyById,
} from '../handlers/technologies-handlers.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

/* ***************** CONFIG and CONSTS ********************* */
const technologiesRouter = express.Router();

/* ***************** PUBLIC ROUTES ************************* */
technologiesRouter.get('/', getAllTechnologies);
technologiesRouter.get('/:id', getTechnologyById);

/* ***************** PROTECTED ROUTES ********************** */
technologiesRouter.post('/', authMiddleware, createTechnology);
technologiesRouter.put('/:id', authMiddleware, updateTechnologyById);
technologiesRouter.delete('/:id', authMiddleware, deleteTechnologyById);

export { technologiesRouter };
