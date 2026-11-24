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

import { createAttachment } from '../handlers/attachment-handlers.js';
import { ALLOWED_TYPES, MAX_ATTACHMENT_BYTES } from '../utils/attachment-rules.js';
import { attachmentWriteLimiter } from '../middlewares/attachment-limits.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { optionalAuth } from '../middlewares/optionalAuth.js';

/* ***************** CONFIG and CONSTS ********************* */
const availabilityRouter = express.Router();

/* ***************** PUBLIC ROUTES ************************* */
availabilityRouter.get('/', optionalAuth, getAllAvailability);
availabilityRouter.get('/:id', optionalAuth, getAvailabilityById);

/* ***************** PROTECTED ROUTES ********************** */
availabilityRouter.post('/', authMiddleware, createNewAvailability);
availabilityRouter.put('/:id', authMiddleware, updateAvailabilityById);
availabilityRouter.delete('/:id', authMiddleware, deleteAvailabilityById);
// The file is the request body. The auth check runs first, so an anonymous caller never gets the body read.
availabilityRouter.post(
    '/:id/attachments',
    attachmentWriteLimiter,
    authMiddleware,
    express.raw({ type: ALLOWED_TYPES, limit: MAX_ATTACHMENT_BYTES }),
    createAttachment,
);

export { availabilityRouter };
