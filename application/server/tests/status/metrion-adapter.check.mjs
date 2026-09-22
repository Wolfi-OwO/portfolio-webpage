// Framework-free checks for the STATUS_SOURCE=metrion path in
// metrion-adapter.js. Mongo-free — every fixture mocks the shape Metrion's
// `GET /uptime` public endpoint returns (mona's
// applications/ingest/src/services/public-status-service.ts). Run directly:
//
//   node application/server/tests/status/metrion-adapter.check.mjs
//
// Exits non-zero (via assert throwing) on any failure.
import assert from 'node:assert/strict';
import {
    buildEntry,
    mapMetrionHistory,
    buildMetrionStatuses,
    resetMetrionAdapterState,
} from '../../src/utils/metrion-adapter.js';
import { resetMetrionCache } from '../../src/utils/metrion-source.js';

const NOW = Date.parse('2026-09-22T12:00:00.000Z');
const monitor = (overrides = {}) => ({
    _id: 'm1',
    name: 'Network Visualizer',
    url: 'https://netviz.woofi-developments.at/',
    group: null,
    metrionKey: 'netviz',
    ...overrides,
});

// ── Staleness guard: a feed 5 minutes silent renders pending, not operational ──
{
    const fiveMinAgo = new Date(NOW - 5 * 60 * 1000).toISOString();
    const apps = new Map([
        [
            'netviz',
            {
                key: 'netviz',
                displayName: 'Network Visualizer',
                uptime: { h24: 100, d7: 100, d30: 100 },
                latencyMs: 42,
                lastSampleAt: fiveMinAgo,
                history: [],
            },
        ],
    ]);

    const entry = buildEntry(monitor(), apps, NOW);

    assert.equal(
        entry.status,
        'pending',
        'a lastSampleAt older than the 240s staleness cutoff must never read as operational',
    );
}

// ── A fresh sample (well under the cutoff) is trusted normally ────────────
{
    const tenSecAgo = new Date(NOW - 10 * 1000).toISOString();
    const apps = new Map([
        [
            'netviz',
            {
                key: 'netviz',
                displayName: 'Network Visualizer',
                uptime: { h24: 100, d7: 100, d30: 100 },
                latencyMs: 42,
                lastSampleAt: tenSecAgo,
                history: [],
            },
        ],
    ]);

    const entry = buildEntry(monitor(), apps, NOW);

    assert.equal(entry.status, 'operational');
}

// ── A monitor whose metrionKey has no entry in the response renders pending ──
{
    const apps = new Map(); // netviz absent entirely

    const entry = buildEntry(monitor(), apps, NOW);

    assert.equal(entry.status, 'pending', 'a missing Metrion key must render pending, not absent');
    assert.equal(entry._id, 'm1', 'the monitor must still get an entry, just an empty one');
}

// ── A monitor with no metrionKey configured at all also renders pending ───
{
    const apps = new Map([
        [
            'netviz',
            {
                key: 'netviz',
                uptime: {},
                latencyMs: 1,
                lastSampleAt: new Date(NOW).toISOString(),
                history: [],
            },
        ],
    ]);

    const entry = buildEntry(monitor({ metrionKey: undefined }), apps, NOW);

    assert.equal(entry.status, 'pending');
}

// ── mapMetrionHistory feeds severityFor the right downRatio shape ─────────
{
    const history = [
        { day: '2026-09-01T00:00:00.000Z', upPct: 100, samples: 1440 }, // operational
        { day: '2026-09-02T00:00:00.000Z', upPct: 94, samples: 1440 }, // 6% down -> major
        { day: '2026-09-03T00:00:00.000Z', upPct: 0, samples: 10 }, // fully down -> critical
    ];

    const mapped = mapMetrionHistory(history);

    assert.equal(mapped[0].severity, 'operational');
    assert.equal(
        mapped[1].severity,
        'major',
        '6% down must land in the major band, same as severityFor(0.06)',
    );
    assert.equal(mapped[2].severity, 'critical');
}

// ── Days before firstSampleAt (samples: 0, upPct: null) render as no-data ──
// Never 100%: Metrion's public-status-service.ts fills exactly this shape for
// a day with no bucket, whether it's a hole in the middle of the span or
// before the application's first sample.
{
    const history = [
        { day: '2026-06-01T00:00:00.000Z', upPct: null, samples: 0 },
        { day: '2026-06-02T00:00:00.000Z', upPct: null, samples: 0 },
    ];

    const mapped = mapMetrionHistory(history);

    for (const day of mapped) {
        assert.equal(day.severity, 'no-data');
        assert.equal(day.downPct, null);
        assert.notEqual(day.severity, 'operational', 'must never be fabricated as a healthy 100%');
    }
}

// ── Task 15: a Metrion outage retains the last good report, marked stale ──
{
    resetMetrionAdapterState();
    resetMetrionCache();

    const originalFetch = globalThis.fetch;
    const originalUrl = process.env.METRION_STATUS_URL;
    process.env.METRION_STATUS_URL = 'https://metrion.invalid/api/v1/public/projects/x/uptime';

    const goodApp = {
        key: 'netviz',
        displayName: 'Network Visualizer',
        uptime: { h24: 100, d7: 100, d30: 100 },
        latencyMs: 42,
        // buildMetrionStatuses ages this against the real clock (Date.now()),
        // unlike the buildEntry-direct checks above which pin `now`.
        lastSampleAt: new Date().toISOString(),
        history: [],
    };

    try {
        // First call: Metrion answers normally.
        globalThis.fetch = async () => ({
            ok: true,
            json: async () => ({ applications: [goodApp] }),
        });
        resetMetrionCache();
        const good = await buildMetrionStatuses([monitor()]);
        assert.equal(good.stale, false);
        assert.equal(good.entries[0].status, 'operational');

        // Second call: Metrion is unreachable. The retained report — not a
        // freshly-built all-pending one — must come back, flagged stale.
        globalThis.fetch = async () => {
            throw new Error('simulated network failure');
        };
        resetMetrionCache();
        const stale = await buildMetrionStatuses([monitor()]);

        assert.equal(stale.stale, true);
        assert.ok(stale.staleSince, 'staleSince must be set to the last successful fetch');
        assert.equal(
            stale.entries[0].status,
            'operational',
            'a retained good report must not be replaced by a fresh all-pending one',
        );
    } finally {
        globalThis.fetch = originalFetch;
        if (originalUrl === undefined) delete process.env.METRION_STATUS_URL;
        else process.env.METRION_STATUS_URL = originalUrl;
        resetMetrionCache();
        resetMetrionAdapterState();
    }
}

// ── Task 15: no prior success at all falls back to all-pending, not a throw ──
{
    resetMetrionAdapterState();
    resetMetrionCache();

    const originalFetch = globalThis.fetch;
    const originalUrl = process.env.METRION_STATUS_URL;
    process.env.METRION_STATUS_URL = 'https://metrion.invalid/api/v1/public/projects/x/uptime';
    globalThis.fetch = async () => {
        throw new Error('simulated network failure');
    };

    try {
        const result = await buildMetrionStatuses([monitor()]);
        assert.equal(result.stale, true);
        assert.equal(
            result.staleSince,
            null,
            'nothing was ever fetched successfully, so no since-when',
        );
        assert.equal(result.entries[0].status, 'pending');
    } finally {
        globalThis.fetch = originalFetch;
        if (originalUrl === undefined) delete process.env.METRION_STATUS_URL;
        else process.env.METRION_STATUS_URL = originalUrl;
        resetMetrionCache();
        resetMetrionAdapterState();
    }
}

console.log('metrion-adapter.check.mjs: all assertions passed');
