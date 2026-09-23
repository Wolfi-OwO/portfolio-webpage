// Read-side counterpart to jobs/src/lib/metrion-sink.js (which WRITES uptime
// checks to Metrion). Fetches Metrion's public per-project uptime endpoint
// (`GET /api/v1/public/projects/:id/uptime`) for metrion-adapter.js to build
// a status report from.
//
// Unset METRION_STATUS_URL = the whole feature is off, exactly like
// createMetrionSink() treats a missing METRION_INGEST_URL/METRION_API_KEY on
// the write side. A fetch failure, timeout or unparseable body must never
// throw — the caller (metrion-adapter.js) distinguishes `ok: false` from an
// empty-but-successful response so it can retain the last good report
// instead of rendering everything pending on a blip.
import { logger } from './logger.js';

const TIMEOUT_MS = 5000;
// The client polls /api/status every 15s; this cache keeps that from fanning
// out to Metrion more than once a minute.
const CACHE_MS = 60 * 1000;
// Failures get a shorter TTL than successes: a struggling Metrion is still
// capped to one outbound attempt per window (the whole point of the cache),
// but a full 60s would delay noticing recovery longer than necessary. 15s
// keeps the same protection while halving worst-case staleness after a blip.
const FAILURE_CACHE_MS = 15 * 1000;

let cache = null; // { at: number, ttl: number, applications: Array, ok: boolean }
let pending = null; // in-flight fetch promise, shared by concurrent callers

// The range endpoint (below) varies by (from, to), so unlike the plain
// endpoint's single-slot cache this needs one entry per requested window —
// capped the same way mona's own public-uptime-range-service.ts caches
// itself (CACHE_MAX_ENTRIES = 256), so a caller cycling through distinct
// ranges can't grow this Map without bound. Map iteration order is insertion
// order, and a hit re-inserts itself, so the first key is always the oldest.
const RANGE_CACHE_MS = 60 * 1000;
const RANGE_FAILURE_CACHE_MS = 15 * 1000;
const RANGE_CACHE_MAX_ENTRIES = 256;
let rangeCache = new Map(); // key `${fromMs}:${toMs}` -> { at, ttl, applications, range, ok }
let rangePending = new Map(); // key -> in-flight promise, shared by concurrent callers on the same range

// A malformed-but-200 body (null entries, non-array `history`, ...) must
// degrade to "that one entry is dropped", never throw and take the whole
// report (or the already-cached last-good one) down with it. Validated here,
// at the fetch boundary, so every consumer downstream gets the same
// guarantee without re-checking.
function isValidApplication(app) {
    return (
        app != null &&
        typeof app === 'object' &&
        (app.history == null || Array.isArray(app.history))
    );
}

// Same guarantee as isValidApplication, for the range endpoint's shape
// (`buckets`/`incidents` instead of `history`).
function isValidRangeApplication(app) {
    return (
        app != null &&
        typeof app === 'object' &&
        typeof app.key === 'string' &&
        (app.buckets == null || Array.isArray(app.buckets)) &&
        (app.incidents == null || Array.isArray(app.incidents))
    );
}

async function doFetch(url) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) throw new Error(`responded ${response.status}`);
        const body = await response.json();
        const rawApplications = Array.isArray(body?.applications) ? body.applications : [];
        const applications = rawApplications.filter(isValidApplication);
        cache = { at: Date.now(), ttl: CACHE_MS, applications, ok: true };
        return { applications, ok: true };
    } catch (err) {
        // ponytail: no retry/backoff — the cache (now written on this path
        // too, see FAILURE_CACHE_MS above) already caps how often a
        // struggling endpoint gets hit, and the next /api/status request
        // just tries again once the negative TTL expires.
        logger.warn(`metrion-source: fetch failed: ${err.message}`);
        cache = { at: Date.now(), ttl: FAILURE_CACHE_MS, applications: [], ok: false };
        return { applications: [], ok: false };
    } finally {
        clearTimeout(timeout);
    }
}

/**
 * `ok: false` covers "unset URL", "fetch failed", "non-200" and "unparseable
 * body" alike — every case where the caller must not trust `applications` as
 * a real snapshot. Callers that need to tell "confirmed empty" apart from
 * "unreachable" only have `ok` to go on; there is currently no confirmed-
 * empty case (the endpoint always lists at least the 7 opted-in monitors).
 */
async function fetchMetrionUptime() {
    const url = process.env.METRION_STATUS_URL;
    if (!url) return { applications: [], ok: false };

    if (cache && Date.now() - cache.at < cache.ttl) {
        return { applications: cache.applications, ok: cache.ok };
    }

    // Concurrent callers on a cold/expired cache all share the one in-flight
    // fetch instead of each firing their own — without this, N simultaneous
    // /api/status requests produced N outbound fetches to the same URL.
    if (pending) return pending;

    pending = doFetch(url);
    try {
        return await pending;
    } finally {
        pending = null;
    }
}

// Thin convenience wrapper for callers that only ever want the array (kept
// for anything that doesn't need to distinguish a failure from a confirmed-
// empty response).
async function fetchMetrionApplications() {
    return (await fetchMetrionUptime()).applications;
}

function evictRangeCacheOverBudget() {
    while (rangeCache.size > RANGE_CACHE_MAX_ENTRIES) {
        const oldest = rangeCache.keys().next();
        if (oldest.done) return;
        rangeCache.delete(oldest.value);
    }
}

async function doFetchRange(url, key) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) throw new Error(`responded ${response.status}`);
        const body = await response.json();
        const rawApplications = Array.isArray(body?.applications) ? body.applications : [];
        const applications = rawApplications.filter(isValidRangeApplication);
        const range = body?.range && typeof body.range === 'object' ? body.range : null;
        rangeCache.set(key, { at: Date.now(), ttl: RANGE_CACHE_MS, applications, range, ok: true });
        evictRangeCacheOverBudget();
        return { applications, range, ok: true };
    } catch (err) {
        // ponytail: no retry/backoff, same reasoning as doFetch above — the
        // cache already caps how often one window gets re-fetched, and there
        // is no last-good retention here (see fetchMetrionUptimeRange's doc
        // comment for why that's the right call for a range, not an oversight).
        logger.warn(`metrion-source: range fetch failed: ${err.message}`);
        rangeCache.set(key, {
            at: Date.now(),
            ttl: RANGE_FAILURE_CACHE_MS,
            applications: [],
            range: null,
            ok: false,
        });
        evictRangeCacheOverBudget();
        return { applications: [], range: null, ok: false };
    } finally {
        clearTimeout(timeout);
    }
}

/**
 * Range counterpart to fetchMetrionUptime(): calls Metrion's
 * `GET /uptime/range?from=&to=` (mona's public-uptime-range-service.ts)
 * instead of the plain `/uptime` endpoint, by appending `/range` to
 * METRION_STATUS_URL (which already points at `.../uptime`) — no separate
 * env var needed. `fromMs`/`toMs` are epoch ms, already validated by the
 * caller (status-handlers.js's parseRangeQuery).
 *
 * Deliberately NO last-good retention here, unlike fetchMetrionUptime: a
 * stale answer to an arbitrary date range a caller just picked is not a
 * meaningful "last known good" the way the live dashboard tiles are (Task
 * 15's fallback exists so the CURRENT status band never goes blank). A
 * failed range fetch returns `ok: false` and an empty application list; the
 * caller (metrion-adapter.js) renders that range's bars/incidents as
 * honestly empty rather than reusing unrelated data — the live tiles
 * (status/uptime.h24/d7/d30) still come from the unchanged plain endpoint
 * and keep ITS retention regardless of whether the range fetch succeeded.
 */
async function fetchMetrionUptimeRange(fromMs, toMs) {
    const baseUrl = process.env.METRION_STATUS_URL;
    if (!baseUrl) return { applications: [], range: null, ok: false };

    const key = `${fromMs}:${toMs}`;
    const cached = rangeCache.get(key);
    if (cached && Date.now() - cached.at < cached.ttl) {
        rangeCache.delete(key); // re-insert so this key is no longer the oldest
        rangeCache.set(key, cached);
        return { applications: cached.applications, range: cached.range, ok: cached.ok };
    }

    if (rangePending.has(key)) return rangePending.get(key);

    const url = new URL(`${baseUrl}/range`);
    url.searchParams.set('from', new Date(fromMs).toISOString());
    url.searchParams.set('to', new Date(toMs).toISOString());

    const promise = doFetchRange(url.toString(), key);
    rangePending.set(key, promise);
    try {
        return await promise;
    } finally {
        rangePending.delete(key);
    }
}

// Test-only escape hatch: the 60s cache is a module-level singleton, so a
// check script exercising multiple scenarios in one process needs a way to
// clear it between them.
function resetMetrionCache() {
    cache = null;
    pending = null;
}

// Same, for the range cache.
function resetMetrionRangeCache() {
    rangeCache.clear();
    rangePending.clear();
}

export {
    fetchMetrionUptime,
    fetchMetrionApplications,
    fetchMetrionUptimeRange,
    resetMetrionCache,
    resetMetrionRangeCache,
};
