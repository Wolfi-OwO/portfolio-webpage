/* ***************** IMPORT packages *********************** */
import httpServer from '../../src/server.js';
import assert from 'assert';
import request from 'supertest';
import { MonitorModel } from '../../src/models/monitor.js';
import { MonitorCheckModel } from '../../src/models/monitor-check.js';
import {
    clearStatusCache,
    statusCacheSize,
    getServiceStatus,
} from '../../src/handlers/status-handlers.js';
import { adminToken } from '../tokens.js';

/* ***************** CONFIG and CONSTS ********************* */
const DAY = 24 * 60 * 60 * 1000;

// The monitor-checker Function writes more samples per day than its nominal
// once-a-minute schedule implies (Azure replays missed timer ticks), so a day
// holds ~1700 samples, not 1440. Seed at that real density to guard the bug this
// suite exists for: an uptime formula that divided by the schedule-implied count
// clamped every ratio to 100%, hiding real failures.
const PER_DAY = 1700;

// failStart shifts which samples fail: with failStart: 1 the newest check
// (i === 0) passes while every later one still fails on schedule — needed by the
// 'degraded' test, where the LATEST sample must be healthy for the classifier to
// reach the rolled-up 24h failure rate at all.
async function seedChecks(monitorId, { days, failEvery, failStart = 0 }) {
    const now = Date.now();
    const spacing = DAY / PER_DAY;
    const docs = [];
    for (let i = 0; i < days * PER_DAY; i++) {
        const ok = !(failEvery && i >= failStart && i % failEvery === 0);
        docs.push({
            monitor: monitorId,
            at: now - i * spacing,
            ok,
            latencyMs: 100,
            error: ok ? undefined : 'seeded failure',
        });
    }
    await MonitorCheckModel.insertMany(docs);
}

/* ***************** DECLARE testfunctions *********************** */
describe('GET /api/status', function () {
    beforeEach(async () => {
        clearStatusCache(); // the 10 s report cache would leak state between tests
        await httpServer.dropCurrentDatabase(process.env.MONGODB_CONNECTION_STRING);
    });

    it('reports uptime below 100% when checks failed, at the real sample density', async function () {
        // ~1% of checks fail. The old formula reported a clamped 100%.
        const monitor = await MonitorModel.create({ name: 'Flaky', url: 'https://flaky.test' });
        await seedChecks(monitor._id, { days: 6, failEvery: 100 });

        const res = await request(httpServer).get('/api/status').expect(200);
        const flaky = res.body.ungrouped.find((m) => m.name === 'Flaky');

        assert.ok(flaky, 'monitor should be in the report');
        assert.ok(
            flaky.uptime.d30 < 99.5 && flaky.uptime.d30 > 98.5,
            `expected ~99% uptime, got ${flaky.uptime.d30}%`,
        );
        assert.ok(
            flaky.uptime.h24 < 100,
            `24h uptime should reflect failures, got ${flaky.uptime.h24}%`,
        );
    });

    it('reports 100% for a monitor with no failed checks', async function () {
        const monitor = await MonitorModel.create({ name: 'Solid', url: 'https://solid.test' });
        await seedChecks(monitor._id, { days: 6, failEvery: 0 });

        const res = await request(httpServer).get('/api/status').expect(200);
        const solid = res.body.ungrouped.find((m) => m.name === 'Solid');

        assert.equal(solid.uptime.d30, 100);
        assert.equal(solid.uptime.h24, 100);
    });

    it('reports null uptime (not 100%) for a monitor with no samples yet', async function () {
        await MonitorModel.create({ name: 'Brand New', url: 'https://new.test' });

        const res = await request(httpServer).get('/api/status').expect(200);
        const fresh = res.body.ungrouped.find((m) => m.name === 'Brand New');

        assert.strictEqual(fresh.uptime.d30, null);
        assert.strictEqual(fresh.uptime.h24, null);
        assert.equal(fresh.status, 'pending');
    });

    it("derives a full day of downtime from that day's down ratio", async function () {
        const monitor = await MonitorModel.create({ name: 'Downtime', url: 'https://dt.test' });
        await seedChecks(monitor._id, { days: 3, failEvery: 20 }); // 5% down

        const res = await request(httpServer).get('/api/status').expect(200);
        const dt = res.body.ungrouped.find((m) => m.name === 'Downtime');
        const fullDay = dt.history.filter((d) => d.totalChecks > 0).at(-2);

        // ~5% of a 24h day ≈ 72 min, independent of the assumed check cadence.
        const expectedMs = (fullDay.downPct / 100) * DAY;
        assert.ok(
            Math.abs(fullDay.downMs - expectedMs) < 60 * 1000,
            `downMs ${fullDay.downMs} should track the day's down ratio (~${expectedMs})`,
        );
    });

    it("reports 'idle' for a healthy scaled-to-zero container app", async function () {
        const monitor = await MonitorModel.create({
            name: 'Snoozing',
            url: 'https://snooze.test',
            containerApp: { resourceGroup: 'rg', name: 'snooze', scaleToZero: true },
        });
        // ScaledToZero is a healthy ARM state and must not read as an outage.
        await MonitorCheckModel.create({
            monitor: monitor._id,
            at: Date.now(),
            ok: true,
            latencyMs: 20,
            runningStatus: 'ScaledToZero',
        });

        const res = await request(httpServer).get('/api/status').expect(200);
        const snoozing = res.body.ungrouped.find((m) => m.name === 'Snoozing');

        assert.equal(snoozing.status, 'idle');
        assert.equal(snoozing.uptime.h24, 100);
    });

    it('rolls the overall status up to operational when idle mixes with operational monitors', async function () {
        // Mirrors the real fleet: ml-visualizer is a deliberate, permanent
        // scale-to-zero app and is idle almost all the time. Before the
        // idle-as-healthy rollup change, one idle monitor pinned `overall` to
        // `idle` forever even with every other monitor operational — see
        // STATUS_ORDER's comment in status-checker.js.
        const solid = await MonitorModel.create({ name: 'Solid', url: 'https://solid.test' });
        await seedChecks(solid._id, { days: 1, failEvery: 0 });

        const snoozing = await MonitorModel.create({
            name: 'Snoozing',
            url: 'https://snooze.test',
            containerApp: { resourceGroup: 'rg', name: 'snooze', scaleToZero: true },
        });
        await MonitorCheckModel.create({
            monitor: snoozing._id,
            at: Date.now(),
            ok: true,
            latencyMs: 20,
            runningStatus: 'ScaledToZero',
        });

        const res = await request(httpServer).get('/api/status').expect(200);

        assert.equal(res.body.status, 'operational');
        // The per-monitor distinction must still be visible, only the summary
        // treats idle as healthy.
        const snoozingEntry = res.body.ungrouped.find((m) => m.name === 'Snoozing');
        assert.equal(snoozingEntry.status, 'idle');
    });

    it('keeps the overall status down when one monitor is down, even alongside idle/operational ones', async function () {
        const solid = await MonitorModel.create({ name: 'Solid2', url: 'https://solid2.test' });
        await seedChecks(solid._id, { days: 1, failEvery: 0 });

        const snoozing = await MonitorModel.create({
            name: 'Snoozing2',
            url: 'https://snooze2.test',
            containerApp: { resourceGroup: 'rg', name: 'snooze2', scaleToZero: true },
        });
        await MonitorCheckModel.create({
            monitor: snoozing._id,
            at: Date.now(),
            ok: true,
            latencyMs: 20,
            runningStatus: 'ScaledToZero',
        });

        const broken = await MonitorModel.create({ name: 'Broken', url: 'https://broken.test' });
        await MonitorCheckModel.create({
            monitor: broken._id,
            at: Date.now(),
            ok: false,
            latencyMs: 20,
            error: 'connection refused',
        });

        const res = await request(httpServer).get('/api/status').expect(200);

        assert.equal(res.body.status, 'down');
    });

    it("reports 'degraded' when the latest check passes but >10% of the last 24h failed", async function () {
        const monitor = await MonitorModel.create({ name: 'Wobbly', url: 'https://wobbly.test' });
        // Latest sample healthy (failStart: 1), then one in every nine fails (~11%).
        await seedChecks(monitor._id, { days: 6, failEvery: 9, failStart: 1 });

        const res = await request(httpServer).get('/api/status').expect(200);
        const wobbly = res.body.ungrouped.find((m) => m.name === 'Wobbly');

        assert.equal(wobbly.status, 'degraded');
        assert.ok(
            wobbly.uptime.h24 < 100,
            `degraded but flawless 24h uptime? ${wobbly.uptime.h24}%`,
        );
    });

    describe('anonymous vs admin projection', function () {
        async function seedFailedArm(error) {
            const monitor = await MonitorModel.create({
                name: 'Arm',
                url: 'https://arm.test',
                containerApp: { resourceGroup: 'dsai-5bhif-app', name: 'dsai-containerapp' },
            });
            await MonitorCheckModel.create({
                monitor: monitor._id,
                at: Date.now(),
                ok: false,
                latencyMs: 0,
                error,
                runningStatus: 'Failed',
            });
        }

        it('hides infrastructure names and raw errors from anonymous callers', async function () {
            await seedFailedArm(
                'Revision dsai-containerapp--0000004 is Failed (health: Unhealthy)',
            );

            const res = await request(httpServer).get('/api/status').expect(200);
            const arm = res.body.ungrouped.find((m) => m.name === 'Arm');

            assert.equal(arm.lastError, 'Container app revision is not healthy');
            assert.equal(arm.runningStatus, null);
            assert.deepEqual(arm.containerApp, { scaleToZero: true });
            assert.ok(!JSON.stringify(res.body).includes('dsai-containerapp'));
            assert.ok(!JSON.stringify(res.body).includes('dsai-5bhif-app'));
            assert.equal(res.headers.vary, 'Authorization');
        });

        it('gives an admin token the full detail', async function () {
            const raw = 'Revision dsai-containerapp--0000004 is Failed (health: Unhealthy)';
            await seedFailedArm(raw);

            const res = await request(httpServer)
                .get('/api/status')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);
            const arm = res.body.ungrouped.find((m) => m.name === 'Arm');

            assert.equal(arm.lastError, raw);
            assert.equal(arm.runningStatus, 'Failed');
            assert.equal(arm.containerApp.name, 'dsai-containerapp');
            assert.equal(arm.containerApp.resourceGroup, 'dsai-5bhif-app');
        });

        it('serves an invalid token the anonymous projection instead of a 401', async function () {
            await seedFailedArm('boom');
            const res = await request(httpServer)
                .get('/api/status')
                .set('Authorization', 'Bearer not-a-token')
                .expect(200);
            assert.ok(!JSON.stringify(res.body).includes('dsai-containerapp'));
        });

        it('requires an admin token for GET /api/monitors', async function () {
            await request(httpServer).get('/api/monitors').expect(401);
            await request(httpServer)
                .get('/api/monitors')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);
        });

        it('keys the rate limiter on the last proxy hop, not a client-forged X-Forwarded-For', async function () {
            // supertest connects from ::ffff:127.0.0.1; with trust proxy = 1 the
            // rightmost entry is the address Caddy appended.
            const app = (await import('express')).default();
            app.set('trust proxy', 1);
            app.get('/ip', (req, res) => res.send(req.ip));
            const res = await request(app).get('/ip').set('X-Forwarded-For', '1.2.3.4, 5.6.7.8');
            assert.equal(res.text, '5.6.7.8');
        });
    });

    describe('date range (?from=&to=)', function () {
        it('answers 400, in the standard error shape, when from is after to', async function () {
            const res = await request(httpServer)
                .get('/api/status')
                .query({ from: '2026-09-10T00:00:00.000Z', to: '2026-09-01T00:00:00.000Z' })
                .expect(400);
            assert.equal(res.body.status, 400);
            assert.ok(res.body.message);
        });

        it('answers 400 for a garbage date', async function () {
            const res = await request(httpServer)
                .get('/api/status')
                .query({ from: 'not-a-date', to: '2026-09-01T00:00:00.000Z' })
                .expect(400);
            assert.equal(res.body.status, 400);
        });

        it('answers 400 when only one of from/to is given', async function () {
            await request(httpServer)
                .get('/api/status')
                .query({ from: '2026-09-01T00:00:00.000Z' })
                .expect(400);
        });

        it('answers 400 for a from before the year 2000', async function () {
            await request(httpServer)
                .get('/api/status')
                .query({ from: '1999-01-01T00:00:00.000Z', to: '2026-09-01T00:00:00.000Z' })
                .expect(400);
        });

        it('answers 400 for a to far in the future', async function () {
            await request(httpServer)
                .get('/api/status')
                .query({ from: '2026-09-01T00:00:00.000Z', to: '2099-01-01T00:00:00.000Z' })
                .expect(400);
        });

        it('returns the default view flagged rangeUnsupported on source=mongo (the live default)', async function () {
            const monitor = await MonitorModel.create({
                name: 'Ranged',
                url: 'https://ranged.test',
            });
            await seedChecks(monitor._id, { days: 1, failEvery: 0 });

            const res = await request(httpServer)
                .get('/api/status')
                .query({ from: '2026-09-01T00:00:00.000Z', to: '2026-09-10T00:00:00.000Z' })
                .expect(200);

            assert.equal(res.body.rangeUnsupported, true);
            const ranged = res.body.ungrouped.find((m) => m.name === 'Ranged');
            assert.equal(
                ranged.uptime.d30,
                100,
                'the mongo path still answers its normal default-view shape',
            );
        });

        it('bounds the report cache to CACHE_MAX_ENTRIES distinct ranges', async function () {
            this.timeout(30000);
            await MonitorModel.create({ name: 'Bounded', url: 'https://bounded.test' });

            // Calls the handler directly, bypassing the route's rate limiter
            // (60/min) — this asserts on the CACHE's eviction policy, not on
            // request throughput, and 270 requests through the real rate
            // limit would just prove the limiter works, which is already
            // covered elsewhere.
            for (let i = 0; i < 270; i++) {
                const from = new Date(Date.UTC(2020, 0, 1) + i * 1000).toISOString();
                const to = new Date(Date.UTC(2020, 0, 2) + i * 1000).toISOString();
                const req = { query: { from, to }, header: () => undefined };
                const res = { set: () => {}, json: () => {} };
                await getServiceStatus(req, res, (err) => {
                    if (err) throw err;
                });
            }

            assert.ok(
                statusCacheSize() <= 256,
                `cache grew to ${statusCacheSize()} entries, expected <= 256`,
            );
        });
    });
});
