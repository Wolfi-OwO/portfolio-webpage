import jwt from 'jsonwebtoken';
import { getStatusReport } from '../utils/status-checker.js';
import { BadRequest, InternalServerError } from '../middlewares/error-handlers.js';

// One report costs ~2 findOne + 3 aggregations + a 90-day bucket aggregation +
// a latency query per monitor, plus a Metrion fetch, and the endpoint is public.
// The checker writes once a minute, so a 10 s cache never hides a real change
// for long. Cost: up to 10 s of staleness and two cached reports (public and
// admin) in memory. The in-flight PROMISE is stored so concurrent requests
// share one computation; a failed one is evicted so errors are not cached.
const CACHE_MS = 10 * 1000;
// The key now also carries a normalised (epoch-ms) from/to, so a date-range
// pick is its own cache slot — unlike source/detailed, a caller can send
// unboundedly many distinct ranges, and this Map must not grow without limit
// because of that. Capped the same way Metrion's own range cache is (mona's
// public-uptime-range-service.ts, CACHE_MAX_ENTRIES = 256): evict the oldest
// entry once over budget. Map iteration order is insertion order, and a hit
// re-inserts itself (see cachedReport), so the first key is always the
// least-recently-used one.
const CACHE_MAX_ENTRIES = 256;
const cache = new Map(); // key: `${source}:${detailed}:${from}:${to}` -> { at, promise }

// Read alongside getStatusReport's own default so the cache key always
// matches whichever branch a call would actually take — otherwise flipping
// STATUS_SOURCE mid-runtime could serve a stale mongo-keyed entry under the
// metrion cache slot (or vice versa) for up to CACHE_MS.
function currentSource() {
    return process.env.STATUS_SOURCE === 'metrion' ? 'metrion' : 'mongo';
}

function evictCacheOverBudget() {
    while (cache.size > CACHE_MAX_ENTRIES) {
        const oldest = cache.keys().next();
        if (oldest.done) return;
        cache.delete(oldest.value);
    }
}

function cachedReport(detailed, range) {
    const source = currentSource();
    const key = `${source}:${detailed}:${range ? `${range.from}:${range.to}` : '-'}`;
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < CACHE_MS) {
        cache.delete(key); // re-insert so this key is no longer the oldest
        cache.set(key, hit);
        return hit.promise;
    }
    const entry = { at: Date.now(), promise: getStatusReport(detailed, source, range) };
    entry.promise.catch(() => {
        if (cache.get(key) === entry) cache.delete(key);
    });
    cache.set(key, entry);
    evictCacheOverBudget();
    return entry.promise;
}

function clearStatusCache() {
    cache.clear();
}

// Test-only: lets the cache-bound check assert on the eviction policy without
// reaching into the module-private Map.
function statusCacheSize() {
    return cache.size;
}

const MIN_FROM_MS = Date.parse('2000-01-01T00:00:00.000Z');
// Clock skew / "now" tolerance for `to` — a picker built around Date.now()
// on the client can legitimately be a few seconds to a couple of minutes
// ahead of this server's clock; 5 minutes covers that without accepting a
// caller asking for data from next week.
const FUTURE_SLACK_MS = 5 * 60 * 1000;

/**
 * Validates the date-range picker's `?from=&to=` query params. Returns
 * `null` when neither is present — the untouched default path (today's
 * h24/d7/d30 + 90-day bars) — or `{ from, to }` in epoch ms otherwise.
 * Throws a BadRequest (the same shape every other handler in this repo
 * throws, see error-handlers.js) on anything malformed, so a bad range
 * answers 400 instead of silently falling back to the default view.
 */
function parseRangeQuery(query) {
    const { from, to } = query;
    if (from === undefined && to === undefined) return null;
    if (from === undefined || to === undefined) {
        throw new BadRequest('"from" and "to" must both be provided together.');
    }

    const fromMs = Date.parse(from);
    const toMs = Date.parse(to);
    if (Number.isNaN(fromMs)) throw new BadRequest('"from" is not a valid date.');
    if (Number.isNaN(toMs)) throw new BadRequest('"to" is not a valid date.');
    if (fromMs < MIN_FROM_MS) throw new BadRequest('"from" must not be before 2000-01-01.');
    if (fromMs >= toMs) throw new BadRequest('"from" must be before "to".');
    if (toMs > Date.now() + FUTURE_SLACK_MS)
        throw new BadRequest('"to" must not be in the future.');

    return { from: fromMs, to: toMs };
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
 * additionally get container app names and raw error text. Optional
 * `?from=&to=` (ISO dates) switch to the date-range shape — see
 * parseRangeQuery and status-checker.js#getStatusReport's `range` param.
 */
async function getServiceStatus(req, res, next) {
    let range;
    try {
        range = parseRangeQuery(req.query);
    } catch (err) {
        return next(err);
    }

    try {
        // The body differs by Authorization, so shared caches must key on it.
        res.set('Vary', 'Authorization');
        const report = await cachedReport(isAdminRequest(req), range);
        return res.json(report);
    } catch (err) {
        next(new InternalServerError(err));
    }
}

export { getServiceStatus, clearStatusCache, statusCacheSize };
