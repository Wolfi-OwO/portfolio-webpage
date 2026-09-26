/* ***************** IMPORT packages *********************** */
import express from 'express';

/* ***************** IMPORT REQUEST-HANDLER **************** */
import {
    getAllServices,
    getServiceById,
    createNewService,
    updateServiceById,
    deleteServiceById,
} from '../handlers/services-handlers.js';

import { authMiddleware } from '../middlewares/authMiddleware.js';
import { optionalAuth } from '../middlewares/optionalAuth.js';

/* ***************** CONFIG and CONSTS ********************* */
const servicesRouter = express.Router();

/* ***************** PUBLIC ROUTES ************************* */
servicesRouter.get('/', optionalAuth, getAllServices);
servicesRouter.get('/:id', getServiceById);

/* ***************** PROTECTED ROUTES ********************** */
servicesRouter.post('/', authMiddleware, createNewService);
servicesRouter.put('/:id', authMiddleware, updateServiceById);
servicesRouter.delete('/:id', authMiddleware, deleteServiceById);

export { servicesRouter };
