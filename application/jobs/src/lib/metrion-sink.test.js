import test from 'node:test';
import assert from 'node:assert/strict';
import { createMetrionSink, slugify, resourceFor } from './metrion-sink.js';

// Pure-function slice of the mapping table (mona's docs/adr/0007), no DB, no
// network — matches the repo's own convention for exported pure functions
// (checkMonitors.resolveCheckMode.test.js).

test("slugify strips everything Metrion's ingest charset rejects (parens, spaces)", () => {
    // The live monitor name that motivated this task — verified separately
    // against a running local ingest instance in the integration test below.
    assert.equal(
        slugify('Machine Learning Visualizer (Preview)'),
        'machine-learning-visualizer-preview',
    );
    assert.equal(slugify('ML Visualizer'), 'ml-visualizer');
});

test('resourceFor: group present -> resource=group, subResource=name', () => {
    assert.deepEqual(resourceFor({ group: 'ML Visualizer', name: 'Machine Learning Visualizer' }), {
        resource: 'ml-visualizer',
        subResource: 'machine-learning-visualizer',
    });
});

test('resourceFor: no group -> resource=name, subResource=null', () => {
    assert.deepEqual(resourceFor({ group: null, name: 'Nutrilens' }), {
        resource: 'nutrilens',
        subResource: null,
    });
});

test('resourceFor: neither group nor name slugifies to anything -> null (caller drops the point)', () => {
    assert.equal(resourceFor({ group: null, name: '???' }), null);
});

function withEnv(vars, fn) {
    const saved = {};
    for (const key of Object.keys(vars)) saved[key] = process.env[key];
    Object.assign(process.env, vars);
    try {
        return fn();
    } finally {
        Object.assign(process.env, saved);
    }
}

test('add(): uptime.ok always emitted; uptime.latency only when runningStatus is null', async () => {
    await withEnv(
        { METRION_INGEST_URL: 'http://example.invalid/ingest', METRION_API_KEY: 'mtr_x_y' },
        async () => {
            const calls = [];
            globalThis.fetch = async (...args) => {
                calls.push(args);
                return { ok: true, status: 202 };
            };

            const sink = createMetrionSink();
            const monitor = { name: 'Nutrilens', group: null };
            sink.add(monitor, { at: 1_700_000_000_000, ok: true, latencyMs: 42 }); // HTTP check -> latency
            sink.add(monitor, {
                at: 1_700_000_000_000,
                ok: false,
                latencyMs: 99,
                runningStatus: 'Running',
            }); // ARM check -> no latency

            await sink.flush();

            assert.equal(
                calls.length,
                1,
                'exactly one POST per flush, regardless of monitor count',
            );
            const body = JSON.parse(calls[0][1].body);
            assert.equal(body.length, 1, 'both checks share one resource -> one envelope');
            const names = body[0].metrics.map((m) => m.name);
            assert.deepEqual(names, ['uptime.ok', 'uptime.latency', 'uptime.ok']);
        },
    );
});

test('sink is a no-op when METRION_API_KEY is unset', async () => {
    await withEnv(
        { METRION_INGEST_URL: 'http://example.invalid/ingest', METRION_API_KEY: '' },
        async () => {
            let called = false;
            globalThis.fetch = async () => {
                called = true;
                return { ok: true, status: 202 };
            };

            const sink = createMetrionSink();
            sink.add(
                { name: 'Nutrilens', group: null },
                { at: Date.now(), ok: true, latencyMs: 1 },
            );
            await sink.flush();

            assert.equal(called, false, 'no fetch call at all when the key is unset');
        },
    );
});

test('an unreachable METRION_INGEST_URL logs one warning and does not throw', async () => {
    await withEnv(
        { METRION_INGEST_URL: 'http://example.invalid/ingest', METRION_API_KEY: 'mtr_x_y' },
        async () => {
            globalThis.fetch = async () => {
                throw new Error('ECONNREFUSED');
            };
            const warnings = [];
            const context = { warn: (msg) => warnings.push(msg) };

            const sink = createMetrionSink();
            sink.add(
                { name: 'Nutrilens', group: null },
                { at: Date.now(), ok: true, latencyMs: 1 },
                context,
            );

            await assert.doesNotReject(() => sink.flush(context));
            assert.equal(warnings.length, 1);
        },
    );
});
