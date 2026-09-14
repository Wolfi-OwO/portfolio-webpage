// Read-side counterpart to jobs/src/lib/metrion-sink.js (which WRITES uptime
// checks to Metrion). Fetches Metrion's public per-project uptime endpoint so
// getStatusReport can append applications Mongo doesn't already cover.
//
// Unset METRION_STATUS_URL = the whole feature is off, exactly like
// createMetrionSink() treats a missing METRION_INGEST_URL/METRION_API_KEY on
// the write side. A fetch failure, timeout or unparseable body must never
// break the status page, so every error path here returns [] instead of
// throwing — the caller then just renders the Mongo-only report.
import { logger } from './logger.js';

const TIMEOUT_MS = 5000;
// The client polls /api/status every 15s; this cache keeps that from fanning
// out to Metrion more than once a minute.
const CACHE_MS = 60 * 1000;

let cache = null; // { at: number, applications: Array }

async function fetchMetrionApplications() {
    const url = process.env.METRION_STATUS_URL;
    if (!url) return [];

    if (cache && Date.now() - cache.at < CACHE_MS) return cache.applications;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) throw new Error(`responded ${response.status}`);
        const body = await response.json();
        const applications = Array.isArray(body?.applications) ? body.applications : [];
        cache = { at: Date.now(), applications };
        return applications;
    } catch (err) {
        // ponytail: no retry/backoff and no stale-cache fallback — the 60s
        // cache already caps how often a struggling endpoint gets hit, and
        // the next /api/status request just tries again.
        logger.warn(`metrion-source: fetch failed: ${err.message}`);
        return [];
    } finally {
        clearTimeout(timeout);
    }
}

// Test-only escape hatch: the 60s cache is a module-level singleton, so a
// check script exercising multiple scenarios in one process needs a way to
// clear it between them.
function resetMetrionCache() {
    cache = null;
}

export { fetchMetrionApplications, resetMetrionCache };
