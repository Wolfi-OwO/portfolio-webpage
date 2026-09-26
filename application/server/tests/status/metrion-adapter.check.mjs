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
    fetchIdleLatencyOverlay,
    resetMetrionAdapterState,
} from '../../src/utils/metrion-adapter.js';
import { resetMetrionCache, resetMetrionRangeCache } from '../../src/utils/metrion-source.js';

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

// ── Task: uptime is rounded to 1 decimal in the output, matching status-checker's round1 ──
{
    const apps = new Map([
        [
            'netviz',
            {
                key: 'netviz',
                uptime: { h24: 99.97835263556662, d7: 100, d30: 99.97835263556662 },
                latencyMs: 42,
                lastSampleAt: new Date(NOW).toISOString(),
                history: [],
            },
        ],
    ]);

    const entry = buildEntry(monitor(), apps, NOW);

    assert.equal(entry.uptime.h24, 100, '99.978... rounds to 100.0 at 1 decimal');
    assert.equal(entry.uptime.d30, 100);
}

// ── Task: the degraded threshold reads the RAW h24, not the rounded one ──
// 89.96 rounds to 90.0 (round1), which would read as NOT degraded (90 is not
// <90) if rounding ran before the comparison. The raw 89.96 IS <90, so this
// must still come back degraded — proving rounding is output-shaping only.
{
    const apps = new Map([
        [
            'netviz',
            {
                key: 'netviz',
                uptime: { h24: 89.96, d7: 100, d30: 100 },
                latencyMs: 42,
                lastSampleAt: new Date(NOW).toISOString(),
                history: [],
            },
        ],
    ]);

    const entry = buildEntry(monitor(), apps, NOW);

    assert.equal(
        entry.status,
        'degraded',
        'the degraded threshold must compare the raw h24 (89.96 < 90), not the rounded 90.0',
    );
    assert.equal(entry.uptime.h24, 90, 'the OUTPUT value is still rounded to 90.0');
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

// ── Task 16b: buildEntry itself stays exactly as byte-identical as before ──
// (c85813d's own invariant) — idlePct is not a key at all here, and latency
// is still null. The overlay (tested below) is layered on top by
// getStatusReport, never inside buildEntry/buildMetrionStatuses.
{
    const apps = new Map([
        [
            'netviz',
            {
                key: 'netviz',
                uptime: { h24: 100, d7: 100, d30: 100 },
                latencyMs: 42,
                lastSampleAt: new Date(NOW).toISOString(),
                history: [],
            },
        ],
    ]);

    const entry = buildEntry(monitor(), apps, NOW);

    assert.equal(entry.latency, null);
    assert.ok(
        !Object.prototype.hasOwnProperty.call(entry, 'idlePct'),
        "buildEntry must not gain an idlePct key — that is the overlay layer's job, not this one",
    );
    for (const rangeOnlyField of ['incidents', 'truncated', 'totalIncidents']) {
        assert.ok(
            !Object.prototype.hasOwnProperty.call(entry, rangeOnlyField),
            `buildEntry must never carry the range-only field "${rangeOnlyField}"`,
        );
    }
    assert.equal(
        entry.uptime.range,
        undefined,
        'uptime.range is a range-view-only field and must not appear on the default view',
    );
}

// ── Task 16b: fetchIdleLatencyOverlay maps EXACTLY { idlePct, latency }, ──
// nothing else — this is the bounded relaxation of the byte-identical rule:
// only these two fields are now allowed to differ from "always null/absent"
// on the default view.
await (async () => {
    const originalFetch = globalThis.fetch;
    const originalUrl = process.env.METRION_STATUS_URL;
    process.env.METRION_STATUS_URL = 'https://metrion.invalid/api/v1/public/projects/x/uptime';
    resetMetrionCache();
    resetMetrionRangeCache();

    try {
        globalThis.fetch = async () => ({
            ok: true,
            json: async () => ({
                applications: [
                    {
                        key: 'netviz',
                        idlePct: 37.5,
                        latency: { p50: 120, p95: 480, approximate: false },
                        buckets: [],
                        incidents: [],
                    },
                ],
                range: { from: '', to: '', granularity: '5m', bucketCount: 288 },
            }),
        });

        const overlay = await fetchIdleLatencyOverlay([monitor()], NOW);
        const netviz = overlay.get('m1');

        assert.deepEqual(
            Object.keys(netviz).sort(),
            ['idlePct', 'latency'],
            'the overlay must carry exactly idlePct and latency, never history/incidents/uptime.range',
        );
        assert.equal(netviz.idlePct, 37.5);
        assert.deepEqual(netviz.latency, { p50: 120, p95: 480 });
    } finally {
        globalThis.fetch = originalFetch;
        if (originalUrl === undefined) delete process.env.METRION_STATUS_URL;
        else process.env.METRION_STATUS_URL = originalUrl;
        resetMetrionCache();
        resetMetrionRangeCache();
    }
})();

// ── Task 16b: a monitor absent from the overlay window still gets the same ──
// null/null the default view rendered before this feature existed.
await (async () => {
    const originalFetch = globalThis.fetch;
    const originalUrl = process.env.METRION_STATUS_URL;
    process.env.METRION_STATUS_URL = 'https://metrion.invalid/api/v1/public/projects/x/uptime';
    resetMetrionCache();
    resetMetrionRangeCache();

    try {
        globalThis.fetch = async () => ({
            ok: true,
            json: async () => ({ applications: [], range: null }),
        });

        const overlay = await fetchIdleLatencyOverlay([monitor()], NOW);
        const netviz = overlay.get('m1');

        assert.equal(netviz.idlePct, null);
        assert.equal(netviz.latency, null);
    } finally {
        globalThis.fetch = originalFetch;
        if (originalUrl === undefined) delete process.env.METRION_STATUS_URL;
        else process.env.METRION_STATUS_URL = originalUrl;
        resetMetrionCache();
        resetMetrionRangeCache();
    }
})();

// ── Task 16b: the overlay must NEVER throw or leave the default view stale ──
// on a Metrion range outage — it degrades to the pre-Task-16b null/null,
// same as a monitor missing from the window above. fetchMetrionUptimeRange
// already guarantees this (see metrion-source.js); this proves the guarantee
// actually reaches fetchIdleLatencyOverlay's own return shape too.
await (async () => {
    const originalFetch = globalThis.fetch;
    const originalUrl = process.env.METRION_STATUS_URL;
    process.env.METRION_STATUS_URL = 'https://metrion.invalid/api/v1/public/projects/x/uptime';
    resetMetrionCache();
    resetMetrionRangeCache();

    try {
        globalThis.fetch = async () => {
            throw new Error('simulated range endpoint failure');
        };

        const overlay = await fetchIdleLatencyOverlay([monitor()], NOW);
        const netviz = overlay.get('m1');

        assert.equal(netviz.idlePct, null);
        assert.equal(netviz.latency, null);
    } finally {
        globalThis.fetch = originalFetch;
        if (originalUrl === undefined) delete process.env.METRION_STATUS_URL;
        else process.env.METRION_STATUS_URL = originalUrl;
        resetMetrionCache();
        resetMetrionRangeCache();
    }
})();

// ── Task 16b: repeated calls within the same 60s window share the overlay's ──
// range-fetch cache key (minute-floored `toMs`), so only ONE outbound fetch
// happens per minute regardless of how many report rebuilds land inside it —
// the report cache in status-handlers.js rebuilds every 10s, so without this
// the range endpoint would be hit up to 6x more often than necessary.
await (async () => {
    const originalFetch = globalThis.fetch;
    const originalUrl = process.env.METRION_STATUS_URL;
    process.env.METRION_STATUS_URL = 'https://metrion.invalid/api/v1/public/projects/x/uptime';
    resetMetrionCache();
    resetMetrionRangeCache();

    let fetchCount = 0;
    try {
        globalThis.fetch = async () => {
            fetchCount++;
            return { ok: true, json: async () => ({ applications: [], range: null }) };
        };

        const bucketStart = Math.floor(NOW / (60 * 1000)) * 60 * 1000;
        // Three calls scattered across the same 60s window (start, +10s, +59s).
        await fetchIdleLatencyOverlay([monitor()], bucketStart);
        await fetchIdleLatencyOverlay([monitor()], bucketStart + 10_000);
        await fetchIdleLatencyOverlay([monitor()], bucketStart + 59_000);

        assert.equal(
            fetchCount,
            1,
            'three overlay calls inside one 60s window must hit the range endpoint exactly once',
        );
    } finally {
        globalThis.fetch = originalFetch;
        if (originalUrl === undefined) delete process.env.METRION_STATUS_URL;
        else process.env.METRION_STATUS_URL = originalUrl;
        resetMetrionCache();
        resetMetrionRangeCache();
    }
})();

console.log('metrion-adapter.check.mjs: all assertions passed');
