// Framework-free checks for the range-mode path (STATUS_SOURCE=metrion +
// ?from=&to=): buildMetrionRangeStatuses() in metrion-adapter.js and
// fetchMetrionUptimeRange() in metrion-source.js. Mongo-free — every fixture
// mocks the shape Metrion's `GET /uptime/range` public endpoint returns
// (mona's applications/ingest/src/services/public-uptime-range-service.ts).
// Run directly:
//
//   node application/server/tests/status/metrion-range.check.mjs
//
// Exits non-zero (via assert throwing) on any failure.
import assert from 'node:assert/strict';
import {
    buildMetrionRangeStatuses,
    resetMetrionAdapterState,
} from '../../src/utils/metrion-adapter.js';
import { resetMetrionCache, resetMetrionRangeCache } from '../../src/utils/metrion-source.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const NOW = Date.now();
const FROM_MS = NOW - 7 * DAY_MS;
const TO_MS = NOW;

const monitor = (overrides = {}) => ({
    _id: 'm1',
    name: 'Network Visualizer',
    url: 'https://netviz.woofi-developments.at/',
    group: null,
    metrionKey: 'netviz',
    ...overrides,
});

const STATUS_URL = 'https://metrion.invalid/api/v1/public/projects/x/uptime';

function withMockedMetrion(handler, fn) {
    return async () => {
        const originalFetch = globalThis.fetch;
        const originalUrl = process.env.METRION_STATUS_URL;
        process.env.METRION_STATUS_URL = STATUS_URL;
        resetMetrionAdapterState();
        resetMetrionCache();
        resetMetrionRangeCache();
        globalThis.fetch = handler;
        try {
            await fn();
        } finally {
            globalThis.fetch = originalFetch;
            if (originalUrl === undefined) delete process.env.METRION_STATUS_URL;
            else process.env.METRION_STATUS_URL = originalUrl;
            resetMetrionAdapterState();
            resetMetrionCache();
            resetMetrionRangeCache();
        }
    };
}

// ── Calls the /range endpoint (not the plain one) with the requested window ──
await withMockedMetrion(
    async (url) => {
        const u = new URL(url);
        if (u.pathname.endsWith('/uptime')) {
            return { ok: true, json: async () => ({ applications: [] }) };
        }
        assert.equal(u.pathname, '/api/v1/public/projects/x/uptime/range');
        assert.equal(u.searchParams.get('from'), new Date(FROM_MS).toISOString());
        assert.equal(u.searchParams.get('to'), new Date(TO_MS).toISOString());
        return {
            ok: true,
            json: async () => ({
                applications: [],
                range: {
                    from: new Date(FROM_MS).toISOString(),
                    to: new Date(TO_MS).toISOString(),
                    granularity: '1d',
                    bucketCount: 7,
                },
            }),
        };
    },
    async () => {
        const result = await buildMetrionRangeStatuses([monitor()], FROM_MS, TO_MS);
        assert.equal(result.range.granularity, '1d');
        assert.equal(result.range.bucketCount, 7);
    },
)();

// ── Shapes a full range response: bars, uptimePct, latency, incidents ────────
await withMockedMetrion(
    async (url) => {
        const u = new URL(url);
        if (u.pathname.endsWith('/uptime')) {
            return {
                ok: true,
                json: async () => ({
                    applications: [
                        {
                            key: 'netviz',
                            uptime: { h24: 100, d7: 99.5, d30: 99.8 },
                            latencyMs: 42,
                            lastSampleAt: new Date(NOW - 1000).toISOString(),
                            history: [],
                        },
                    ],
                }),
            };
        }
        return {
            ok: true,
            json: async () => ({
                applications: [
                    {
                        key: 'netviz',
                        displayName: 'Network Visualizer',
                        firstSampleAt: new Date(FROM_MS).toISOString(),
                        lastSampleAt: new Date(TO_MS).toISOString(),
                        uptimePct: 97.3,
                        latency: { p50: 120, p95: 480, approximate: false },
                        idlePct: null,
                        buckets: [
                            {
                                t: new Date(FROM_MS - 24 * 60 * 60 * 1000).toISOString(),
                                upPct: null,
                                samples: 0,
                            }, // before first sample
                            { t: new Date(FROM_MS).toISOString(), upPct: 94, samples: 1440 },
                            {
                                t: new Date(FROM_MS + 24 * 60 * 60 * 1000).toISOString(),
                                upPct: 100,
                                samples: 1440,
                            },
                        ],
                        incidents: [
                            {
                                startedAt: new Date(FROM_MS + 3600_000).toISOString(),
                                endedAt: new Date(FROM_MS + 3900_000).toISOString(),
                                durationSeconds: 300,
                                downSamples: 5,
                            },
                        ],
                        truncated: false,
                        totalIncidents: 1,
                    },
                ],
                range: {
                    from: new Date(FROM_MS - 24 * 60 * 60 * 1000).toISOString(),
                    to: new Date(FROM_MS + 2 * 24 * 60 * 60 * 1000).toISOString(),
                    granularity: '1d',
                    bucketCount: 3,
                },
            }),
        };
    },
    async () => {
        const result = await buildMetrionRangeStatuses([monitor()], FROM_MS, TO_MS);
        const entry = result.entries[0];

        // Live tiles come from the plain endpoint, unaffected by the range.
        assert.equal(entry.status, 'operational');
        assert.equal(entry.uptime.h24, 100);
        assert.equal(entry.uptime.d7, 99.5);

        // Range-specific fields come from the range endpoint.
        assert.equal(entry.uptime.range, 97.3);
        assert.deepEqual(entry.latency, { p50: 120, p95: 480 });
        assert.equal(entry.totalIncidents, 1);
        assert.equal(entry.incidents[0].downSamples, 5);
        assert.equal(entry.truncated, false);

        assert.equal(entry.history.length, 3);
        assert.equal(
            entry.history[0].severity,
            'no-data',
            'a bucket before firstSampleAt must be no-data',
        );
        assert.equal(entry.history[0].downPct, null);
        assert.equal(entry.history[1].severity, 'major', '6% down must land in the major band');
        assert.equal(entry.history[2].severity, 'operational');

        assert.equal(result.rangeUnavailable, false);
    },
)();

// ── A monitor whose key is absent from the range response gets an honest empty range ──
await withMockedMetrion(
    async (url) => {
        const u = new URL(url);
        if (u.pathname.endsWith('/uptime')) {
            return {
                ok: true,
                json: async () => ({
                    applications: [
                        {
                            key: 'netviz',
                            uptime: { h24: 100, d7: 100, d30: 100 },
                            latencyMs: 10,
                            lastSampleAt: new Date(NOW - 1000).toISOString(),
                            history: [],
                        },
                    ],
                }),
            };
        }
        return {
            ok: true,
            json: async () => ({
                applications: [],
                range: {
                    from: new Date(FROM_MS).toISOString(),
                    to: new Date(TO_MS).toISOString(),
                    granularity: '1d',
                    bucketCount: 7,
                },
            }),
        };
    },
    async () => {
        const result = await buildMetrionRangeStatuses([monitor()], FROM_MS, TO_MS);
        const entry = result.entries[0];

        assert.equal(entry.status, 'operational', 'live tile is unaffected by a missing range key');
        assert.deepEqual(entry.history, []);
        assert.equal(entry.uptime.range, null);
        assert.deepEqual(entry.incidents, []);
        assert.equal(entry.totalIncidents, 0);
    },
)();

// ── A failed range fetch: honest empty range, but live tiles still work ──────
await withMockedMetrion(
    async (url) => {
        const u = new URL(url);
        if (u.pathname.endsWith('/uptime')) {
            return {
                ok: true,
                json: async () => ({
                    applications: [
                        {
                            key: 'netviz',
                            uptime: { h24: 100, d7: 100, d30: 100 },
                            latencyMs: 10,
                            lastSampleAt: new Date(NOW - 1000).toISOString(),
                            history: [],
                        },
                    ],
                }),
            };
        }
        throw new Error('simulated range endpoint failure');
    },
    async () => {
        const result = await buildMetrionRangeStatuses([monitor()], FROM_MS, TO_MS);
        const entry = result.entries[0];

        assert.equal(result.rangeUnavailable, true);
        assert.equal(
            entry.status,
            'operational',
            'a failed RANGE fetch must not affect the live tile',
        );
        assert.deepEqual(entry.history, []);
        assert.deepEqual(entry.incidents, []);
    },
)();

// ── Task: downsampling caps history at 91 bars regardless of bucket count ──
function bucketsFixture(count, spanMs) {
    return Array.from({ length: count }, (_, i) => ({
        t: new Date(FROM_MS + Math.floor((i * spanMs) / count)).toISOString(),
        upPct: 100,
        samples: 10,
    }));
}

function rangeHandler(buckets, from, to, bucketCount) {
    return async (url) => {
        const u = new URL(url);
        if (u.pathname.endsWith('/uptime')) {
            return { ok: true, json: async () => ({ applications: [] }) };
        }
        return {
            ok: true,
            json: async () => ({
                applications: [
                    {
                        key: 'netviz',
                        uptimePct: 99,
                        latency: { p50: 10, p95: 20, approximate: false },
                        idlePct: null,
                        buckets,
                        incidents: [],
                        truncated: false,
                        totalIncidents: 0,
                    },
                ],
                range: {
                    from: new Date(from).toISOString(),
                    to: new Date(to).toISOString(),
                    granularity: '1m',
                    bucketCount,
                },
            }),
        };
    };
}

// 24h: 501 buckets, the exact bug that rendered 0px bars.
await withMockedMetrion(
    rangeHandler(bucketsFixture(501, DAY_MS), FROM_MS, TO_MS, 501),
    async () => {
        const result = await buildMetrionRangeStatuses([monitor()], FROM_MS, TO_MS);
        assert.ok(
            result.entries[0].history.length <= 91,
            `expected <=91 history entries, got ${result.entries[0].history.length}`,
        );
        // range.bucketCount describes Metrion's own grid and must stay untouched.
        assert.equal(result.range.bucketCount, 501);
    },
)();

// 1y preset: 366 buckets, the same bug measured at 0.25px.
await withMockedMetrion(
    rangeHandler(bucketsFixture(366, DAY_MS), FROM_MS, TO_MS, 366),
    async () => {
        const result = await buildMetrionRangeStatuses([monitor()], FROM_MS, TO_MS);
        assert.ok(
            result.entries[0].history.length <= 91,
            `expected <=91 history entries, got ${result.entries[0].history.length}`,
        );
    },
)();

// 7d: already under the cap, must pass through byte-identical (groupSize===1).
await withMockedMetrion(rangeHandler(bucketsFixture(8, DAY_MS), FROM_MS, TO_MS, 8), async () => {
    const result = await buildMetrionRangeStatuses([monitor()], FROM_MS, TO_MS);
    assert.equal(result.entries[0].history.length, 8);
})();

// ── Task: range uptime/latency are rounded, matching the Mongo path's output ──
await withMockedMetrion(
    async (url) => {
        const u = new URL(url);
        if (u.pathname.endsWith('/uptime')) {
            return { ok: true, json: async () => ({ applications: [] }) };
        }
        return {
            ok: true,
            json: async () => ({
                applications: [
                    {
                        key: 'netviz',
                        uptimePct: 99.97835263556662,
                        latency: { p50: 42.4, p95: 1048.75, approximate: false },
                        idlePct: null,
                        buckets: [],
                        incidents: [],
                        truncated: false,
                        totalIncidents: 0,
                    },
                ],
                range: {
                    from: new Date(FROM_MS).toISOString(),
                    to: new Date(TO_MS).toISOString(),
                    granularity: '1d',
                    bucketCount: 0,
                },
            }),
        };
    },
    async () => {
        const result = await buildMetrionRangeStatuses([monitor()], FROM_MS, TO_MS);
        const entry = result.entries[0];
        assert.equal(entry.uptime.range, 100, '99.978... rounds to 100.0 at 1 decimal');
        assert.deepEqual(entry.latency, { p50: 42, p95: 1049 });
    },
)();

console.log('metrion-range.check.mjs: all assertions passed');
