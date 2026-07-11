/* ***************** IMPORT packages *********************** */
import express from 'express';

/* ***************** IMPORT REQUEST-HANDLER **************** */
import {
    getAllAvailability,
    getAvailabilityById,
    createNewAvailability,
    updateAvailabilityById,
    deleteAvailabilityById,
} from '../handlers/availability-handlers.js';

import { authMiddleware } from '../middlewares/authMiddleware.js';

/* ***************** CONFIG and CONSTS ********************* */
const availabilityRouter = express.Router();

/* ***************** PUBLIC ROUTES ************************* */
availabilityRouter.get('/', getAllAvailability);
availabilityRouter.get('/:id', getAvailabilityById);

/* ***************** PROTECTED ROUTES ********************** */
availabilityRouter.post('/', authMiddleware, createNewAvailability);
availabilityRouter.put('/:id', authMiddleware, updateAvailabilityById);
availabilityRouter.delete('/:id', authMiddleware, deleteAvailabilityById);

export { availabilityRouter };
