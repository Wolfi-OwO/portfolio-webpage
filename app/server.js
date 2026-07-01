'use strict';

const __dirname = import.meta.dirname;

/* ***************** IMPORT packages *********************** */
import express from 'express';
import helmet from 'helmet';
import { createServer } from 'http';
import path from 'path';

/* ***************** IMPORT LIBS *************************** */
import { logger } from './utils/logger.js';
import { setupHealthChecks } from './utils/health-checks.js';
import { dropCurrentDatabase, setupDatabaseConnection } from './database/database.js'

/* ***************** IMPORT ROUTES **************** */
import { projectsRouter } from './routes/projects-route.js';
import { technologiesRouter } from './routes/technologies-route.js';
import { authRouter } from './routes/auth-route.js';
import { infoRouter } from './routes/info-route.js';
import { errorHandler } from './middlewares/error-handlers.js';

/* ***************** CONFIG and CONSTS ********************* */
/* Take configuration from environment variables or use hardcoded default value */
const HOSTNAME = process.env.BINDADDRESS || '0.0.0.0';
const PORT = process.env.PORT || 8080;
const MONGODB_CONNECTION_STRING = process.env.MONGODB_CONNECTION_STRING || 'mongodb://127.0.0.1/team_a';
const MONGODB_RECREATE = process.env.MONGODB_RECREATE === 'true';

/* ***************** START UP ******************************* */
logger.info('Backend - Starting configuration...');

const REQUIRED_ENV_VARS = ['JWT_SECRET', 'ADMIN_USER', 'ADMIN_PASSWORD_HASH'];
const missingEnvVars = REQUIRED_ENV_VARS.filter(name => !process.env[name]);
if (missingEnvVars.length > 0) {
    logger.error(`Backend - Missing required environment variable(s): ${missingEnvVars.join(', ')}`);
    process.exit(1);
}

const app = express();
app.use(helmet());
app.use(
    express.json({
        type: ['application/json', 'application/merge-patch+json'],
    }),
);

// use build folder of vite as static directory
app.use(express.static(path.join(__dirname, 'client', 'dist')));

// setup routes
app.use('/auth/', authRouter);
app.use('/api/info/', infoRouter);
app.use('/api/projects/', projectsRouter);
app.use('/api/technologies/', technologiesRouter);

// SPA fallback (support direct navigation to client routes like /projects)
app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'dist', 'index.html'));
});

// setup error handling middleware
app.use(errorHandler)

// create HTTP server
logger.info('Backend - Starting up ...');
const httpServer = createServer(app);

// setup health check endpoints on server
setupHealthChecks(httpServer);

// setup database connection
setupDatabaseConnection(MONGODB_CONNECTION_STRING, MONGODB_RECREATE)
httpServer.dropCurrentDatabase = dropCurrentDatabase;

// start listening to HTTP requests
httpServer.listen(PORT, HOSTNAME, () => {
    logger.info(`Backend - Running on port ${PORT}...`);
});

export default httpServer;
