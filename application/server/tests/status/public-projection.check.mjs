// Mongo-free check for the anonymous projection in status-checker.js. Run:
//   node application/server/tests/status/public-projection.check.mjs
import assert from 'node:assert/strict';
import { publicError, projectInfra } from '../../src/utils/status-checker.js';

const arm = {
    ok: false,
    runningStatus: 'Failed',
    error: 'Revision dsai-containerapp--0000004 is Failed (health: Unhealthy)',
};
assert.equal(publicError(arm), 'Container app revision is not healthy');
// The SDK catch branch sets runningStatus too and may carry resource ids.
assert.equal(
    publicError({ ok: false, runningStatus: 'Unknown', error: '/subscriptions/x (BOOM)' }),
    'Container app revision is not healthy',
);
assert.equal(
    publicError({ ok: false, error: 'fetch failed (ECONNRESET)' }),
    'Request failed (ECONNRESET)',
);
assert.equal(publicError({ ok: false, error: 'HTTP 503' }), 'Request failed');
assert.equal(publicError({ ok: true }), undefined);
assert.equal(publicError(null), undefined);

const monitor = { containerApp: { resourceGroup: 'dsai-5bhif-app', name: 'dsai-containerapp' } };
const pub = projectInfra(monitor, arm, false);
assert.deepEqual(pub.containerApp, { scaleToZero: true });
assert.equal(pub.runningStatus, null);
assert.ok(!JSON.stringify(pub).includes('dsai'));
assert.equal(
    projectInfra(monitor, { ok: true, runningStatus: 'ScaledToZero' }, false).runningStatus,
    'ScaledToZero',
);
assert.equal(projectInfra({}, arm, false).containerApp, null);

const full = projectInfra(monitor, arm, true);
assert.equal(full.containerApp, monitor.containerApp);
assert.equal(full.lastError, arm.error);
assert.equal(full.runningStatus, 'Failed');
console.log('public-projection: ok');
