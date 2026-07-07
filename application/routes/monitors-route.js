/* ***************** IMPORT packages *********************** */
import express from 'express';

/* ***************** IMPORT REQUEST-HANDLER **************** */
import {
    getAllMonitors,
    createMonitor,
    deleteMonitorById,
} from '../handlers/monitors-handlers.js';

import { authMiddleware } from '../middlewares/authMiddleware.js';

/* ***************** CONFIG and CONSTS ********************* */
const monitorsRouter = express.Router();

/* ***************** PUBLIC ROUTES ************************* */
monitorsRouter.get('/', getAllMonitors);

/* ***************** PROTECTED ROUTES ********************** */
monitorsRouter.post('/', authMiddleware, createMonitor);
monitorsRouter.delete('/:id', authMiddleware, deleteMonitorById);

export { monitorsRouter };
