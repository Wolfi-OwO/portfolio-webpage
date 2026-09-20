/* ***************** IMPORT packages *********************** */
import express from 'express';

/* ***************** IMPORT REQUEST-HANDLER **************** */
import {
    getAllMonitors,
    createMonitor,
    updateMonitorById,
    deleteMonitorById,
} from '../handlers/monitors-handlers.js';

import { authMiddleware } from '../middlewares/authMiddleware.js';

/* ***************** CONFIG and CONSTS ********************* */
const monitorsRouter = express.Router();

/* ***************** PROTECTED ROUTES ********************** */
// Admin-only raw monitor documents (containerApp resourceGroup/name). No client
// read path uses it, and it had no rate limit while public.
monitorsRouter.get('/', authMiddleware, getAllMonitors);
monitorsRouter.post('/', authMiddleware, createMonitor);
monitorsRouter.put('/:id', authMiddleware, updateMonitorById);
monitorsRouter.delete('/:id', authMiddleware, deleteMonitorById);

export { monitorsRouter };
