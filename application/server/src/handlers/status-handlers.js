import jwt from 'jsonwebtoken';
import { withBudget } from '../utils/with-budget.js';
import { logger } from '../utils/logger.js';
import { getStatusReport } from '../utils/status-checker.js';
import { BadRequest, InternalServerError } from '../middlewares/error-handlers.js';
import { objectLinks } from '../utils/hateoas.js';

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

// The last report that was built successfully, per cache slot. A report that takes too long, or fails, is answered with
// this instead, so the status page shows what it knew a moment ago, not a spinner. Capped like the cache above.
const lastGood = new Map();
// How long a request waits for a fresh report once there is an earlier one to show. A normal report takes well under
// a second; waiting longer means the database or Metrion is struggling.
const BUDGET_MS = 6 * 1000;

function slotKey(detailed, range) {
    return `${currentSource()}:${detailed}:${range ? `${range.from}:${range.to}` : '-'}`;
}

function cachedReport(detailed, range, compute = getStatusReport) {
    const source = currentSource();
    const key = slotKey(detailed, range);
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < CACHE_MS) {
        cache.delete(key); // re-insert so this key is no longer the oldest
        cache.set(key, hit);
        return hit.promise;
    }
    const entry = { at: Date.now(), promise: compute(detailed, source, range) };
    entry.promise.then(
        (report) => {
            lastGood.delete(key);
            lastGood.set(key, report);
            while (lastGood.size > CACHE_MAX_ENTRIES) lastGood.delete(lastGood.keys().next().value);
        },
        () => {
            if (cache.get(key) === entry) cache.delete(key);
        },
    );
    cache.set(key, entry);
    evictCacheOverBudget();
    return entry.promise;
}

/**
 * The report, but never later than the budget once an earlier one exists: a slow or failing build is answered with
 * the last good report, and the build carries on in the background to fill the cache for the next request. With no
 * earlier report the caller waits for the build, as before.
 */
function reportWithinBudget(detailed, range, { budgetMs = BUDGET_MS, compute } = {}) {
    const pending = cachedReport(detailed, range, compute);
    const fallback = lastGood.get(slotKey(detailed, range));
    if (!fallback) return pending;
    return withBudget(pending, budgetMs, (reason, error) => {
        logger.warn(`status: report ${reason}, serving the last good one`, error);
        return fallback;
    });
}

const WARM_EVERY_MS = 8 * 1000; // under CACHE_MS, so the public report is never allowed to go stale

let warmer = null;
/**
 * Builds the public report in the background, always a little before its cache entry runs out. A visitor then
 * reads a report that is already there; before this, whoever came first after ten idle seconds paid for the
 * database and Metrion round trips themselves, and after a restart or a dropped connection that was the slow
 * page. Errors are only logged: the next tick, or the next request, tries again.
 */
function startStatusWarmer() {
    if (warmer) return;
    const tick = () =>
        cachedReport(false, null).catch((err) => logger.warn('status: warm-up failed', err));
    tick();
    warmer = setInterval(tick, WARM_EVERY_MS);
    warmer.unref();
}

function clearStatusCache() {
    cache.clear();
    lastGood.clear();
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
        const report = await reportWithinBudget(isAdminRequest(req), range);
        // `report` is the shared, cached object (see cachedReport above) — spread
        // rather than mutate it, so `_links` never leaks into what's served to
        // the next caller from the same cache slot.
        const body = { ...report, _links: objectLinks('/status') };
        // 10 == CACHE_MS above, so the browser never shows anything staler
        // than this server's own cache floor already permits; 50 fills the
        // rest of the Metrion 60s window, so a reload or back-navigation
        // paints from cache and refreshes behind it. `private`, never
        // `public`, because the body carries admin-only container names and
        // raw error text when isAdminRequest() is true — a shared cache must
        // not serve one visitor's cached admin response to another.
        res.set('Cache-Control', 'private, max-age=10, stale-while-revalidate=50');
        return res.json(body);
    } catch (err) {
        next(new InternalServerError(err));
    }
}

// Test-only: drops the cached promises but keeps the last good reports, as ten seconds of waiting would.
function expireStatusCache() {
    cache.clear();
}

export {
    getServiceStatus,
    startStatusWarmer,
    clearStatusCache,
    statusCacheSize,
    reportWithinBudget,
    expireStatusCache,
};
