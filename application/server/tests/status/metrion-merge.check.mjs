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

console.log('metrion-merge.check.mjs: all assertions passed');
