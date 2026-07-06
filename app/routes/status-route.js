/* ***************** IMPORT packages *********************** */
import express from 'express';

/* ***************** IMPORT REQUEST-HANDLER **************** */
import { getServiceStatus } from '../handlers/status-handlers.js';

/* ***************** CONFIG and CONSTS ********************* */
const statusRouter = express.Router();

/* ***************** PUBLIC ROUTES ************************* */
// Public — a status page is meant to be reachable without signing in.
statusRouter.get('/', getServiceStatus);

export { statusRouter };
