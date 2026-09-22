import jwt from 'jsonwebtoken';
import { getStatusReport } from '../utils/status-checker.js';
import { InternalServerError } from '../middlewares/error-handlers.js';

// One report costs ~2 findOne + 3 aggregations + a 90-day bucket aggregation +
// a latency query per monitor, plus a Metrion fetch, and the endpoint is public.
// The checker writes once a minute, so a 10 s cache never hides a real change
// for long. Cost: up to 10 s of staleness and two cached reports (public and
// admin) in memory. The in-flight PROMISE is stored so concurrent requests
// share one computation; a failed one is evicted so errors are not cached.
const CACHE_MS = 10 * 1000;
const cache = new Map(); // key: `${source}:${detailed}` -> { at, promise }

// Read alongside getStatusReport's own default so the cache key always
// matches whichever branch a call would actually take — otherwise flipping
// STATUS_SOURCE mid-runtime could serve a stale mongo-keyed entry under the
// metrion cache slot (or vice versa) for up to CACHE_MS.
function currentSource() {
    return process.env.STATUS_SOURCE === 'metrion' ? 'metrion' : 'mongo';
}

function cachedReport(detailed) {
    const source = currentSource();
    const key = `${source}:${detailed}`;
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < CACHE_MS) return hit.promise;
    const entry = { at: Date.now(), promise: getStatusReport(detailed, source) };
    entry.promise.catch(() => {
        if (cache.get(key) === entry) cache.delete(key);
    });
    cache.set(key, entry);
    return entry.promise;
}

function clearStatusCache() {
    cache.clear();
}

// The route stays public: a missing or bad token just means the anonymous
// projection. Verification mirrors requireRole('admin') in authMiddleware.js
// (same secret, default options, role must be 'admin'); it must never throw
// or 401 here.
function isAdminRequest(req) {
    const token = req.header('Authorization')?.split(' ')[1];
    if (!token) return false;
    try {
        return jwt.verify(token, process.env.JWT_SECRET).role === 'admin';
    } catch {
        return false;
    }
}

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns Status report: overall status + per-monitor uptime history. Admins
 * additionally get container app names and raw error text.
 */
async function getServiceStatus(req, res, next) {
    try {
        // The body differs by Authorization, so shared caches must key on it.
        res.set('Vary', 'Authorization');
        const report = await cachedReport(isAdminRequest(req));
        return res.json(report);
    } catch (err) {
        next(new InternalServerError(err));
    }
}

export { getServiceStatus, clearStatusCache };
