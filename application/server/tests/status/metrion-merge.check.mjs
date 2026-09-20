// Framework-free counter-check for the Mongo/Metrion merge in
// status-checker.js. Same reasoning as worst-status.check.mjs: mergeWithMetrion
// and buildMetrionMonitorStatus are pure functions (no Mongo I/O), and
// fetchMetrionApplications only needs a stubbed global fetch — none of it
// needs mocha's Mongo-backed test harness. Run directly:
//
//   node application/server/tests/status/metrion-merge.check.mjs
//
// Exits non-zero (via assert throwing) on any failure.
import assert from 'node:assert/strict';
import { mergeWithMetrion, buildMetrionMonitorStatus } from '../../src/utils/status-checker.js';
import { fetchMetrionApplications, resetMetrionCache } from '../../src/utils/metrion-source.js';

// ── A key present in both sources produces exactly one entry, from Mongo ──
{
    const monitors = [
        {
            name: 'Network Visualizer',
            group: 'Network Visualizer',
            containerApp: { name: 'netviz' },
        },
    ];
    const mongoStatuses = [{ _id: 'mongo-1', name: 'Network Visualizer', status: 'operational' }];
    const metrionApps = [
        {
            key: 'netviz',
            displayName: 'Network Visualizer (uptime)',
            uptime: { h24: 100, d7: 100, d30: 100 },
            latencyMs: 42,
            lastSampleAt: new Date().toISOString(),
            history: [],
        },
    ];

    const merged = mergeWithMetrion(monitors, mongoStatuses, metrionApps);

    assert.equal(merged.length, 1, 'a key covered by Mongo must not also appear from Metrion');
    assert.equal(merged[0].source, 'mongo', 'the surviving entry must be the Mongo one');
}

// ── A Mongo monitor matches Metrion's key via its URL's first hostname label ──
{
    const monitors = [
        { name: 'Network Visualizer', group: null, url: 'https://netviz.woofi-developments.at/' },
        { name: 'No URL at all', group: null },
        { name: 'Garbage URL', group: null, url: 'not a url' },
    ];
    const mongoStatuses = monitors.map((m, i) => ({ _id: `m${i}`, name: m.name }));
    const app = (key) => ({
        key,
        displayName: key,
        uptime: { h24: 100, d7: 100, d30: 100 },
        latencyMs: 1,
        lastSampleAt: new Date().toISOString(),
        history: [],
    });

    const merged = mergeWithMetrion(monitors, mongoStatuses, [app('netviz'), app('preussen-bot')]);

    assert.equal(
        merged.some((e) => e._id === 'metrion:netviz'),
        false,
        'netviz must be suppressed by the Mongo monitor at netviz.woofi-developments.at',
    );
    assert.equal(
        merged.some((e) => e._id === 'metrion:preussen-bot'),
        true,
        'a Metrion key with no matching monitor is still appended',
    );
    assert.equal(merged.length, 4, 'three Mongo entries plus preussen-bot');
}

// ── An unreachable Metrion yields the Mongo-only report ────────────────────
{
    const monitors = [{ name: 'Solid', group: null }];
    const mongoStatuses = [{ _id: 'mongo-2', name: 'Solid', status: 'operational' }];

    const originalFetch = globalThis.fetch;
    const originalUrl = process.env.METRION_STATUS_URL;
    globalThis.fetch = async () => {
        throw new Error('simulated network failure');
    };
    process.env.METRION_STATUS_URL = 'https://metrion.invalid/api/v1/public/projects/x/uptime';
    resetMetrionCache();

    let metrionApps;
    try {
        metrionApps = await fetchMetrionApplications();
    } finally {
        globalThis.fetch = originalFetch;
        if (originalUrl === undefined) delete process.env.METRION_STATUS_URL;
        else process.env.METRION_STATUS_URL = originalUrl;
        resetMetrionCache();
    }

    assert.deepEqual(
        metrionApps,
        [],
        'a fetch failure must yield no Metrion applications, not throw',
    );

    const merged = mergeWithMetrion(monitors, mongoStatuses, metrionApps);
    assert.equal(merged.length, 1);
    assert.equal(merged[0].source, 'mongo');
}

// ── A Metrion app with no samples reports pending, not 100% uptime ────────
{
    const neverSampled = {
        key: 'fuwwy-platform',
        displayName: 'Fuwwy Platform (uptime)',
        uptime: { h24: null, d7: null, d30: null },
        latencyMs: null,
        lastSampleAt: null,
        history: Array.from({ length: 90 }, (_, i) => ({
            day: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
            upPct: null,
            samples: 0,
        })),
    };

    const entry = buildMetrionMonitorStatus(neverSampled);

    assert.equal(entry.status, 'pending', 'no samples ever must read as pending, not operational');
    assert.strictEqual(entry.uptime.h24, null, 'uptime must stay null, never fabricated as 100');
    assert.strictEqual(entry.uptime.d30, null);
}

// ── A malformed-but-200 body degrades to a partial list, never throws ─────
// Reproduces the three shapes the security review found crash the merge
// downstream (status-checker.js's `[...history].reverse()` /
// `mapMetrionHistory` assume `.map`/iterability with no guard): a null
// application entry, `history` as a string, and `history` as a plain object.
{
    const monitors = [];
    const mongoStatuses = [];

    const cases = [
        { name: 'applications: [null]', body: { applications: [null] } },
        {
            name: 'history is a string',
            body: { applications: [{ key: 'bad-history-string', history: 'not-an-array' }] },
        },
        {
            name: 'history is an object',
            body: { applications: [{ key: 'bad-history-object', history: { day: 1 } }] },
        },
    ];

    const originalFetch = globalThis.fetch;
    const originalUrl = process.env.METRION_STATUS_URL;
    process.env.METRION_STATUS_URL = 'https://metrion.invalid/api/v1/public/projects/x/uptime';

    for (const { name, body } of cases) {
        globalThis.fetch = async () => ({ ok: true, json: async () => body });
        resetMetrionCache();

        let metrionApps;
        try {
            metrionApps = await fetchMetrionApplications();
        } catch (err) {
            throw new Error(`${name}: fetchMetrionApplications threw: ${err.message}`);
        }

        assert.deepEqual(metrionApps, [], `${name}: malformed entry must be dropped, not kept`);

        let merged;
        try {
            merged = mergeWithMetrion(monitors, mongoStatuses, metrionApps);
        } catch (err) {
            throw new Error(`${name}: mergeWithMetrion threw: ${err.message}`);
        }
        assert.deepEqual(merged, [], `${name}: must degrade to an empty (Mongo-only) result`);
    }

    globalThis.fetch = originalFetch;
    if (originalUrl === undefined) delete process.env.METRION_STATUS_URL;
    else process.env.METRION_STATUS_URL = originalUrl;
    resetMetrionCache();
}

// ── 50 concurrent callers on a cold cache produce exactly 1 upstream fetch ─
{
    let fetchCount = 0;
    const originalFetch = globalThis.fetch;
    const originalUrl = process.env.METRION_STATUS_URL;
    globalThis.fetch = async () => {
        fetchCount += 1;
        // Yield so concurrent callers actually overlap instead of the event
        // loop serializing them one microtask apart.
        await new Promise((resolve) => setTimeout(resolve, 20));
        return { ok: true, json: async () => ({ applications: [] }) };
    };
    process.env.METRION_STATUS_URL = 'https://metrion.invalid/api/v1/public/projects/x/uptime';
    resetMetrionCache();

    try {
        await Promise.all(Array.from({ length: 50 }, () => fetchMetrionApplications()));
    } finally {
        globalThis.fetch = originalFetch;
        if (originalUrl === undefined) delete process.env.METRION_STATUS_URL;
        else process.env.METRION_STATUS_URL = originalUrl;
        resetMetrionCache();
    }

    assert.equal(
        fetchCount,
        1,
        '50 concurrent cold-cache callers must de-dupe to 1 upstream fetch',
    );
}

// ── A failing upstream gets cached, not retried on every next call ────────
{
    let fetchCount = 0;
    const originalFetch = globalThis.fetch;
    const originalUrl = process.env.METRION_STATUS_URL;
    globalThis.fetch = async () => {
        fetchCount += 1;
        throw new Error('simulated network failure');
    };
    process.env.METRION_STATUS_URL = 'https://metrion.invalid/api/v1/public/projects/x/uptime';
    resetMetrionCache();

    try {
        const first = await fetchMetrionApplications();
        const second = await fetchMetrionApplications();
        assert.deepEqual(first, []);
        assert.deepEqual(second, []);
        assert.equal(fetchCount, 1, 'a cached failure must not trigger a second upstream fetch');
    } finally {
        globalThis.fetch = originalFetch;
        if (originalUrl === undefined) delete process.env.METRION_STATUS_URL;
        else process.env.METRION_STATUS_URL = originalUrl;
        resetMetrionCache();
    }
}

console.log('metrion-merge.check.mjs: all assertions passed');
