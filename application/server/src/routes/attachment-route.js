/* ***************** IMPORT packages *********************** */
import express from 'express';

import { downloadAttachment, deleteAttachment } from '../handlers/attachment-handlers.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { optionalAuth } from '../middlewares/optionalAuth.js';

const attachmentRouter = express.Router();

attachmentRouter.get('/:id', optionalAuth, downloadAttachment);
attachmentRouter.delete('/:id', authMiddleware, deleteAttachment);

export { attachmentRouter };
