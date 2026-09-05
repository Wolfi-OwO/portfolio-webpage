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
import { dropCurrentDatabase, setupDatabaseConnection } from './database/database.js';

/* ***************** IMPORT ROUTES **************** */
import { projectsRouter } from './routes/projects-route.js';
import { servicesRouter } from './routes/services-route.js';
import { availabilityRouter } from './routes/availability-route.js';
import { activityRouter } from './routes/activity-route.js';
import { technologiesRouter } from './routes/technologies-route.js';
import { authRouter } from './routes/auth-route.js';
import { infoRouter } from './routes/info-route.js';
import { monitorsRouter } from './routes/monitors-route.js';
import { statusRouter } from './routes/status-route.js';
import { secretRouter } from './routes/secret-route.js';
import { errorHandler, NotFound } from './middlewares/error-handlers.js';

/* ***************** CONFIG and CONSTS ********************* */
/* Take configuration from environment variables or use hardcoded default value */
const HOSTNAME = process.env.BINDADDRESS || '0.0.0.0';
const PORT = process.env.PORT || 8080;
const MONGODB_CONNECTION_STRING =
    process.env.MONGODB_CONNECTION_STRING || 'mongodb://127.0.0.1/portfolio-app';
const MONGODB_RECREATE = process.env.MONGODB_RECREATE === 'true';

/* ***************** START UP ******************************* */
logger.info('Backend - Starting configuration...');

const REQUIRED_ENV_VARS = ['JWT_SECRET', 'ADMIN_USER', 'ADMIN_PASSWORD_HASH'];
const missingEnvVars = REQUIRED_ENV_VARS.filter((name) => !process.env[name]);
if (missingEnvVars.length > 0) {
    logger.error(
        `Backend - Missing required environment variable(s): ${missingEnvVars.join(', ')}`,
    );
    process.exit(1);
}

const app = express();

// Canonical host: the apex is registered as a custom domain on the container app
// and serves the same content as `www`, so without this every URL is reachable
// twice and Google reports duplicate pages. Redirect before anything else runs
// so static assets and API routes are covered too, and keep the path + query
// intact so deep links survive. `status.` is a separate entry point — untouched.
app.use((req, res, next) => {
    if (req.hostname.toLowerCase() === 'woofi-developments.at') {
        return res.redirect(301, `https://www.woofi-developments.at${req.originalUrl}`);
    }
    next();
});

// Content-Security-Policy, Strict-Transport-Security, Referrer-Policy,
// X-Frame-Options and X-Content-Type-Options are turned off here on purpose:
// Caddy (the only reverse proxy in front of this app, application/Caddyfile)
// already sets each of them per-hostname, tuned to what the SPA actually
// needs. Measured with `curl -sI https://www.woofi-developments.at/`: every
// one of those five headers came back TWICE -- Caddy's value and helmet's
// default -- and a browser silently resolves two conflicting headers to
// whichever is stricter, which is not the same thing as either header
// alone and nobody notices until something is inexplicably blocked. One
// owner (the edge, since it is the one place that also serves the 502/503/
// 504/404/500 error pages and therefore must set these regardless of
// whether the app is even running) beats two. Helmet still sets everything
// it doesn't overlap with Caddy on (COOP, CORP, Origin-Agent-Cluster,
// X-DNS-Prefetch-Control, X-Download-Options, X-Permitted-Cross-Domain-
// Policies, X-XSS-Protection) as defense in depth.
app.use(
    helmet({
        contentSecurityPolicy: false,
        strictTransportSecurity: false,
        referrerPolicy: false,
        xFrameOptions: false,
        xContentTypeOptions: false,
    }),
);
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
app.use('/api/services/', servicesRouter);
app.use('/api/availability/', availabilityRouter);
app.use('/api/activity/', activityRouter);
app.use('/api/technologies/', technologiesRouter);
app.use('/api/monitors/', monitorsRouter);
app.use('/api/status/', statusRouter);
app.use('/api/secret/', secretRouter);

// Every /api/ router above only handles the sub-paths it defines; a request
// under /api/ that none of them match used to fall through all the way to
// Express's own built-in 404, which renders as `text/html` (confirmed:
// `curl -s .../api/gibt-es-nicht` came back `content-type: text/html`) --
// wrong for a JSON API and, since Caddy's edge error pages now intercept
// HTML 404s for real navigations, it would otherwise make a plain API 404
// double as an HTML page too. Scoped to `/api` only, ahead of the SPA
// catch-all below, so it never touches an actual client route.
app.use('/api', (req, _res, next) => {
    next(new NotFound(`Cannot ${req.method} ${req.originalUrl}`));
});

// Mirrors the paths defined in client/src/routes.jsx. The catch-all below
// always used to answer 200, even for a path no route matches -- client-side
// routing still rendered the right ErrorPage (React Router does its own
// matching independent of the HTTP status), but curl/crawlers/monitoring
// saw "this page exists" for something that provably doesn't. Keep in sync
// if a route is added or removed there.
const KNOWN_CLIENT_ROUTES = new Set([
    '/',
    '/projects',
    '/services',
    '/contact',
    '/privacy-policy',
    '/impressum',
    '/admin/login',
    '/secret',
]);

// SPA fallback (support direct navigation to client routes like /projects).
// The `status.` subdomain gets its own standalone bundle instead of the main
// app's, and has no client router at all (status-main.jsx renders a single
// page unconditionally) -- it never had per-path 404 handling, and adding
// one is out of scope here, so its 200-for-everything behaviour is unchanged.
app.get(/^(?!\/api).*/, (req, res) => {
    const isStatusHost = /^status\./i.test(req.hostname);
    const entry = isStatusHost ? 'status.html' : 'index.html';
    const knownPath = isStatusHost || KNOWN_CLIENT_ROUTES.has(req.path);
    res.status(knownPath ? 200 : 404).sendFile(path.join(CLIENT_DIST, entry));
});

// setup error handling middleware
app.use(errorHandler);

// create HTTP server
logger.info('Backend - Starting up ...');
const httpServer = createServer(app);

// setup health check endpoints on server
setupHealthChecks(httpServer);

// setup database connection
setupDatabaseConnection(MONGODB_CONNECTION_STRING, MONGODB_RECREATE);
httpServer.dropCurrentDatabase = dropCurrentDatabase;

// Monitor checks are performed entirely by the separate monitor-checker Azure
// Function (every ~60s, 24/7); this service only reads the samples it writes to
// serve the status page — see GET /api/status/ → getStatusReport.

// start listening to HTTP requests
httpServer.listen(PORT, HOSTNAME, () => {
    logger.info(`Backend - Running on port ${PORT}...`);
});

export default httpServer;
