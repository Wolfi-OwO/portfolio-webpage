/* ***************** IMPORT packages *********************** */
import express from 'express';

/* ***************** IMPORT LIBS *************************** */
import { logger } from '../utils/logger.js';

/* ***************** CONFIG and CONSTS ********************* */
/* Build metadata is injected as env vars by the Dockerfile (mirrored from the
 * OCI image labels, see --build-arg VERSION/BUILD_DATE/VCS_REF/VCS_URL). */
const buildInfo = {
    version: process.env.APP_VERSION || 'dev',
    repositoryUrl: process.env.APP_REPOSITORY_URL || '',
    revision: process.env.APP_REVISION || '',
    buildDate: process.env.APP_BUILD_DATE || '',
};

const infoRouter = express.Router();

/* ***************** PUBLIC ROUTES ************************* */
// Exposes the deployed build's owner, repository and version for the footer.
infoRouter.get('/', (_req, res) => {
    logger.debug('Info - Serving build metadata');
    res.json(buildInfo);
});

export { infoRouter };
