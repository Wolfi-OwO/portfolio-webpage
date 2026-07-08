'use strict';

const __dirname = import.meta.dirname;
// server.js lives at server/src/, but the built client lives at ../../client
// (a sibling of server/ under application/) — not a sibling of src/ itself.
const CLIENT_DIST = path.join(__dirname, '..', '..', 'client', 'dist');

/* ***************** IMPORT packages *********************** */
import express from 'express';
import helmet from 'helmet';
import { createServer } from 'http';
import path from 'path';

/* ***************** IMPORT LIBS *************************** */
import { logger } from './utils/logger.js';
import { setupHealthChecks } from './utils/health-checks.js';
import { dropCurrentDatabase, setupDatabaseConnection } from './database/database.js'
import { startStatusChecker } from './utils/status-checker.js';

/* ***************** IMPORT ROUTES **************** */
import { projectsRouter } from './routes/projects-route.js';
import { technologiesRouter } from './routes/technologies-route.js';
import { authRouter } from './routes/auth-route.js';
import { infoRouter } from './routes/info-route.js';
import { monitorsRouter } from './routes/monitors-route.js';
import { statusRouter } from './routes/status-route.js';
import { errorHandler } from './middlewares/error-handlers.js';

/* ***************** CONFIG and CONSTS ********************* */
/* Take configuration from environment variables or use hardcoded default value */
const HOSTNAME = process.env.BINDADDRESS || '0.0.0.0';
const PORT = process.env.PORT || 8080;
const MONGODB_CONNECTION_STRING = process.env.MONGODB_CONNECTION_STRING || 'mongodb://127.0.0.1/portfolio-app';
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
// `index: false` — the SPA fallback below picks index.html vs status.html by
// hostname, so static must not shortcut `/` to index.html on its own.
app.use(express.static(CLIENT_DIST, { index: false }));

// setup routes
app.use('/auth/', authRouter);
app.use('/api/info/', infoRouter);
app.use('/api/projects/', projectsRouter);
app.use('/api/technologies/', technologiesRouter);
app.use('/api/monitors/', monitorsRouter);
app.use('/api/status/', statusRouter);

// SPA fallback (support direct navigation to client routes like /projects).
// The `status.` subdomain gets its own standalone bundle instead of the main app's.
app.get(/^(?!\/api).*/, (req, res) => {
    const entry = /^status\./i.test(req.hostname) ? 'status.html' : 'index.html';
    res.sendFile(path.join(CLIENT_DIST, entry));
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

// start periodic monitor checks (uptime tracking for the status page)
startStatusChecker();

// start listening to HTTP requests
httpServer.listen(PORT, HOSTNAME, () => {
    logger.info(`Backend - Running on port ${PORT}...`);
});

export default httpServer;
