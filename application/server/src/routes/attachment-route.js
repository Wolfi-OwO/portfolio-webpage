/* ***************** IMPORT packages *********************** */
import express from 'express';

import { downloadAttachment, deleteAttachment } from '../handlers/attachment-handlers.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { optionalAuth } from '../middlewares/optionalAuth.js';
import { attachmentReadLimiter, attachmentWriteLimiter } from '../middlewares/attachment-limits.js';

const attachmentRouter = express.Router();

attachmentRouter.get('/:id', attachmentReadLimiter, optionalAuth, downloadAttachment);
attachmentRouter.delete('/:id', attachmentWriteLimiter, authMiddleware, deleteAttachment);

export { attachmentRouter };
