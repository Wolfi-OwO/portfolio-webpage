/* ***************** IMPORT packages *********************** */
import httpServer from '../../src/server.js';
import assert from 'assert';
import request from 'supertest';
import { MonitorModel } from '../../src/models/monitor.js';
import { MonitorCheckModel } from '../../src/models/monitor-check.js';

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

    it("reports 'degraded' when the latest check passes but >10% of the last 24h failed", async function () {
        const monitor = await MonitorModel.create({ name: 'Wobbly', url: 'https://wobbly.test' });
        // Latest sample healthy (failStart: 1), then one in every nine fails (~11%).
        await seedChecks(monitor._id, { days: 6, failEvery: 9, failStart: 1 });

        const res = await request(httpServer).get('/api/status').expect(200);
        const wobbly = res.body.ungrouped.find((m) => m.name === 'Wobbly');

        assert.equal(wobbly.status, 'degraded');
        assert.ok(wobbly.uptime.h24 < 100, `degraded but flawless 24h uptime? ${wobbly.uptime.h24}%`);
    });
});
