/* ***************** IMPORT packages *********************** */
import express from 'express';

/* ***************** IMPORT REQUEST-HANDLER **************** */
import { getActivity } from '../handlers/activity-handlers.js';

/* ***************** CONFIG and CONSTS ********************* */
const activityRouter = express.Router();

/* ***************** PUBLIC ROUTES ************************* */
// Read-only and cached upstream — there is nothing here to protect or to write.
activityRouter.get('/', getActivity);

export { activityRouter };
