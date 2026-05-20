'use strict';

const __dirname = import.meta.dirname;

/* ***************** IMPORT packages *********************** */
import express from 'express';
import { createServer } from 'http';
import path from 'path';

/* ***************** IMPORT LIBS *************************** */
import { logger } from './utils/logger.js';
import { setupHealthChecks } from './utils/health-checks.js';

/* ***************** IMPORT ROUTES **************** */
import { projectsRouter } from './routes/projects-route.js';
import { errorHandler } from './middlewares/error-handlers.js';

/* ***************** CONFIG and CONSTS ********************* */
/* Take configuration from environment variables or use hardcoded default value */
const HOSTNAME = process.env.BINDADDRESS || '0.0.0.0';
const PORT = process.env.PORT || 8080;
const _MONGODB_CONNECTION_STRING = process.env.MONGODB_CONNECTION_STRING || 'mongodb://127.0.0.1/team_a';
const _MONGODB_RECREATE = process.env.MONGODB_RECREATE === 'true';

/* ***************** START UP ******************************* */
logger.info('Backend - Starting configuration...');

const app = express();
app.use(
    express.json({
        type: ['application/json', 'application/merge-patch+json'],
    }),
);

// use build folder of vite as static directory
app.use(express.static(path.join(__dirname, 'client', 'dist')));

// setup routes
app.use('/api/projects/', projectsRouter);

// SPA fallback (support direct navigation to client routes like /projects)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'dist', 'index.html'));
});

// setup error handling middleware
app.use(errorHandler)

// create HTTP server
logger.info('Backend - Starting up ...');
const httpServer = createServer(app);

// setup health check endpoints on server
setupHealthChecks(httpServer);

// start listening to HTTP requests
httpServer.listen(PORT, HOSTNAME, () => {
    logger.info(`Backend - Running on port ${PORT}...`);
});

export default httpServer;
