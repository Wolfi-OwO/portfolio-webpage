import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import mongoose from 'mongoose';
import { Pool } from 'pg';

/**
 * Integration proof for the Metrion dual-write (mona's docs/adr/0007-uptime-monitoring-as-metrics.md),
 * run against REAL local services, not mocks — see task 26's acceptance criteria.
 * Needs, beforehand:
 *   - A MongoDB reachable at MONGODB_CONNECTION_STRING (defaults to the local
 *     dev mongo already used on this machine, an isolated test database name
 *     so it can't touch real data).
 *   - mona's local ingest running against its own docker-compose.dev.yml
 *     Postgres (`npm run build && node applications/ingest/dist/main.js`
 *     from the mona repo root, port 8090 by default).
 *   - A project + project-wide API key seeded directly into that Postgres,
 *     the same pattern mona's own applications/ingest/tests/ingest.test.ts
 *     uses (INSERT a projects row, then an api_keys row with a key_prefix
 *     and a sha256 key_hash) — pass the bearer secret as METRION_TEST_API_KEY.
 * Skips itself (not a failure) when METRION_TEST_API_KEY isn't set, so a
 * plain `npm test` with none of the above running still passes.
 */

process.env.AZURE_SUBSCRIPTION_ID ??= '00000000-0000-0000-0000-000000000000';
process.env.MONGODB_CONNECTION_STRING ??=
    'mongodb://127.0.0.1:27017/portfolio-jobs-metrion-integration-test';

const INGEST_URL = process.env.METRION_TEST_INGEST_URL ?? 'http://127.0.0.1:8090/api/v1/ingest';
const API_KEY = process.env.METRION_TEST_API_KEY;
const DATABASE_URL =
    process.env.METRION_TEST_DATABASE_URL ?? 'postgres://metrion:metrion@localhost:5432/metrion';

const { runCheckCycle, checkMonitor, ensureConnected, MonitorModel, MonitorCheckModel } =
    await import('./checkMonitors.js');

// Needs no services: fetch and the Mongo write are stubbed, so it runs in a plain `npm test`.
test('checkMonitor: first probe fails, second succeeds -> exactly one ok document and one sink.add', async () => {
    const realFetch = globalThis.fetch;
    const realCreate = MonitorCheckModel.create;
    const created = [];
    const added = [];
    let calls = 0;
    globalThis.fetch = async () => {
        calls += 1;
        if (calls === 1) throw new TypeError('fetch failed');
        return { status: 200 };
    };
    MonitorCheckModel.create = async (doc) => created.push(doc);
    try {
        await checkMonitor(
            { _id: 'm1', url: 'http://x.invalid/' },
            { add: (...a) => added.push(a) },
            {},
            0,
        );
    } finally {
        globalThis.fetch = realFetch;
        MonitorCheckModel.create = realCreate;
    }
    assert.equal(calls, 2);
    assert.equal(created.length, 1);
    assert.equal(created[0].ok, true);
    assert.equal(added.length, 1);
});

test('checkMonitor: both probes fail -> one not-ok document carrying the second error', async () => {
    const realFetch = globalThis.fetch;
    const realCreate = MonitorCheckModel.create;
    const created = [];
    let calls = 0;
    globalThis.fetch = async () => {
        calls += 1;
        throw new TypeError(`fetch failed ${calls}`);
    };
    MonitorCheckModel.create = async (doc) => created.push(doc);
    try {
        await checkMonitor({ _id: 'm1', url: 'http://x.invalid/' }, { add() {} }, {}, 0);
    } finally {
        globalThis.fetch = realFetch;
        MonitorCheckModel.create = realCreate;
    }
    assert.equal(calls, 2, 'exactly one retry, no loop');
    assert.equal(created.length, 1);
    assert.equal(created[0].ok, false);
    assert.equal(created[0].error, 'fetch failed 2');
});

if (!API_KEY) {
    test('dual-write against a real local Metrion instance', { skip: true }, () => {
        // Set METRION_TEST_API_KEY (see this file's header) to run this suite
        // against a real local Metrion ingest + Postgres.
    });
} else {
    let fixtureServer;
    let fixtureUrl;
    let closedPortUrl;
    let pool;
    let projectId;
    let okMonitor;
    let downMonitor;
    let skipMonitor;

    before(async () => {
        await ensureConnected();

        fixtureServer = http.createServer((_req, res) => res.writeHead(200).end('ok'));
        await new Promise((resolve) => fixtureServer.listen(0, '127.0.0.1', resolve));
        fixtureUrl = `http://127.0.0.1:${fixtureServer.address().port}/`;

        // A port nothing listens on: open then immediately close it, so the
        // fetch inside pingUrl() gets a real, fast ECONNREFUSED rather than a
        // guessed port number that might collide with something else local.
        const probe = http.createServer();
        await new Promise((resolve) => probe.listen(0, '127.0.0.1', resolve));
        closedPortUrl = `http://127.0.0.1:${probe.address().port}/`;
        await new Promise((resolve) => probe.close(resolve));

        pool = new Pool({ connectionString: DATABASE_URL });
        const prefix = /^mtr_([^_]+)_/.exec(API_KEY)?.[1];
        const { rows } = await pool.query('SELECT project_id FROM api_keys WHERE key_prefix = $1', [
            prefix,
        ]);
        projectId = rows[0]?.project_id;
        assert.ok(projectId, `no api_keys row for prefix "${prefix}" — seed one first`);

        // The exact live monitor name/group this task exists for (see the
        // task brief) — proves the slug it produces is actually accepted by
        // ingest's IDENTIFIER charset, not assumed.
        okMonitor = await MonitorModel.create({
            name: 'Machine Learning Visualizer (Preview)',
            url: fixtureUrl,
            group: 'ML Visualizer',
        });
        downMonitor = await MonitorModel.create({
            name: 'Task26 Integration Down Monitor',
            url: closedPortUrl,
        });
        skipMonitor = await MonitorModel.create({ name: 'Task26 Integration Skip Monitor' });
    });

    after(async () => {
        const monitorIds = [okMonitor._id, downMonitor._id, skipMonitor._id];
        await MonitorCheckModel.deleteMany({ monitor: { $in: monitorIds } });
        await MonitorModel.deleteMany({ _id: { $in: monitorIds } });
        await pool.query(
            "DELETE FROM metrics WHERE project_id = $1 AND resource IN ('ml-visualizer', 'task26-integration-down-monitor')",
            [projectId],
        );
        await pool.end();
        // pingUrl()'s fetch keeps its socket open (keep-alive); close() alone
        // waits for that idle connection to end on its own timeout, which
        // hung this hook for the full node:test process timeout.
        fixtureServer.closeAllConnections();
        await new Promise((resolve) => fixtureServer.close(resolve));
        await mongoose.disconnect();
    });

    test('a cycle with Metrion reachable: MonitorCheck rows for every checked monitor, none for skip, avg(uptime.ok) matches the pass ratio', async () => {
        process.env.METRION_INGEST_URL = INGEST_URL;
        process.env.METRION_API_KEY = API_KEY;

        await runCheckCycle({ log: () => {}, warn: () => {} });

        const checks = await MonitorCheckModel.find({
            monitor: { $in: [okMonitor._id, downMonitor._id] },
        }).lean();
        assert.equal(checks.length, 2, 'both checked monitors got a MonitorCheck row');
        assert.equal(
            await MonitorCheckModel.countDocuments({ monitor: skipMonitor._id }),
            0,
            'skip-mode monitor writes no MonitorCheck row',
        );

        const passRatio = checks.filter((c) => c.ok).length / checks.length;

        // Postgres write happens asynchronously relative to the test process
        // only in the sense of network latency, not a queue — flush() is
        // awaited inside runCheckCycle, so the row is durably committed by
        // the time runCheckCycle resolves.
        const { rows } = await pool.query(
            `SELECT resource, sub_resource, name, avg(value) AS avg_value, count(*)
               FROM metrics
              WHERE project_id = $1 AND name = 'uptime.ok'
                AND resource IN ('ml-visualizer', 'task26-integration-down-monitor')
              GROUP BY 1, 2, 3`,
            [projectId],
        );
        assert.equal(rows.length, 2, 'one uptime.ok row group per monitor');

        const mlRow = rows.find((r) => r.resource === 'ml-visualizer');
        assert.equal(mlRow.sub_resource, 'machine-learning-visualizer-preview');
        assert.equal(Number(mlRow.avg_value), 1, 'the fixture server always answers 200');

        const downRow = rows.find((r) => r.resource === 'task26-integration-down-monitor');
        assert.equal(downRow.sub_resource, null);
        assert.equal(Number(downRow.avg_value), 0, 'the closed port never answers');

        const overallAvg =
            rows.reduce((sum, r) => sum + Number(r.avg_value) * Number(r.count), 0) /
            rows.reduce((sum, r) => sum + Number(r.count), 0);
        assert.equal(
            overallAvg,
            passRatio,
            "avg(uptime.ok) must equal this cycle's Mongo pass ratio",
        );

        // uptime.latency: only the plain HTTP checks emit it (both do here —
        // neither monitor has a runningStatus, see ADR 0007 §4), verified
        // against real ingest rows rather than assumed.
        const { rows: latencyRows } = await pool.query(
            `SELECT resource FROM metrics WHERE project_id = $1 AND name = 'uptime.latency'
                AND resource IN ('ml-visualizer', 'task26-integration-down-monitor')`,
            [projectId],
        );
        assert.equal(latencyRows.length, 2);
    });

    test('a cycle with Metrion unreachable still writes every MonitorCheck row and logs exactly one warning', async () => {
        process.env.METRION_INGEST_URL = closedPortUrl; // nothing listens here
        process.env.METRION_API_KEY = API_KEY;
        const warnings = [];

        const before_ = await MonitorCheckModel.countDocuments({
            monitor: { $in: [okMonitor._id, downMonitor._id] },
        });
        await runCheckCycle({ log: () => {}, warn: (msg) => warnings.push(msg) });
        const after_ = await MonitorCheckModel.countDocuments({
            monitor: { $in: [okMonitor._id, downMonitor._id] },
        });

        assert.equal(
            after_ - before_,
            2,
            'both MonitorCheck rows still written despite Metrion being down',
        );
        assert.equal(
            warnings.length,
            1,
            'exactly one warning for the whole cycle, not one per monitor',
        );
    });

    test('a cycle with METRION_API_KEY unset writes MongoDB only and logs nothing new', async () => {
        process.env.METRION_INGEST_URL = INGEST_URL;
        delete process.env.METRION_API_KEY;
        const warnings = [];

        const before_ = await MonitorCheckModel.countDocuments({
            monitor: { $in: [okMonitor._id, downMonitor._id] },
        });
        await runCheckCycle({ log: () => {}, warn: (msg) => warnings.push(msg) });
        const after_ = await MonitorCheckModel.countDocuments({
            monitor: { $in: [okMonitor._id, downMonitor._id] },
        });

        assert.equal(after_ - before_, 2, 'MongoDB writes are unaffected by the missing key');
        assert.equal(warnings.length, 0, 'no key means no attempt, so no warning either');
    });
}
