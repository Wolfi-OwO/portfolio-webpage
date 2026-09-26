import test from 'node:test';
import assert from 'node:assert/strict';
import { createMetrionSink } from './metrion-sink.js';

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
            const monitor = { name: 'Nutrilens', group: null, metrionKey: 'nutrilens' };
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
            assert.deepEqual(names, ['uptime.ok', 'uptime.latency', 'uptime.ok', 'uptime.idle']);
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
                { name: 'Nutrilens', group: null, metrionKey: 'nutrilens' },
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
                { name: 'Nutrilens', group: null, metrionKey: 'nutrilens' },
                { at: Date.now(), ok: true, latencyMs: 1 },
                context,
            );

            await assert.doesNotReject(() => sink.flush(context));
            assert.equal(warnings.length, 1);
        },
    );
});

function captureBody(fn) {
    return withEnv(
        { METRION_INGEST_URL: 'http://example.invalid/ingest', METRION_API_KEY: 'mtr_x_y' },
        async () => {
            const calls = [];
            globalThis.fetch = async (...args) => {
                calls.push(args);
                return { ok: true, status: 202 };
            };
            const sink = createMetrionSink();
            const warnings = [];
            fn(sink, { warn: (m) => warnings.push(m) });
            await sink.flush();
            return { body: calls.length ? JSON.parse(calls[0][1].body) : null, warnings };
        },
    );
}

test('an HTTP monitor is addressed by metrionKey: one envelope, no subResource, two points', async () => {
    const { body } = await captureBody((sink) =>
        sink.add(
            { name: 'Network Visualizer', group: 'Network Visualizer', metrionKey: 'netviz' },
            { at: Date.now(), ok: true, latencyMs: 12 },
        ),
    );
    assert.equal(body.length, 1);
    assert.equal(body[0].resource, 'netviz');
    assert.equal('subResource' in body[0], false);
    assert.deepEqual(
        body[0].metrics.map((m) => [m.name, m.value, m.unit, m.intervalSeconds]),
        [
            ['uptime.ok', 1, 'boolean', 60],
            ['uptime.latency', 12, 'ms', 60],
        ],
    );
});

test('a ScaledToZero ARM check emits ok=1 and idle=1 but no latency', async () => {
    const { body } = await captureBody((sink) =>
        sink.add(
            { name: 'ML', metrionKey: 'ml-visualizer' },
            { at: Date.now(), ok: true, latencyMs: 300, runningStatus: 'ScaledToZero' },
        ),
    );
    assert.deepEqual(
        body[0].metrics.map((m) => [m.name, m.value]),
        [
            ['uptime.ok', 1],
            ['uptime.idle', 1],
        ],
    );
});

test('a monitor without metrionKey is skipped with a warning and nothing is sent', async () => {
    const { body, warnings } = await captureBody((sink, context) =>
        sink.add({ name: 'Legacy' }, { at: Date.now(), ok: true, latencyMs: 1 }, context),
    );
    assert.equal(body, null);
    assert.equal(warnings.length, 1);
});
