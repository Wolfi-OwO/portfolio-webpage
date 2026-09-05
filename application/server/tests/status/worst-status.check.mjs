// Framework-free counter-check for the idle-as-healthy rollup change in
// status-checker.js. Deliberately NOT named `*.test.js`: mocha's test glob
// (`tests/**/*.test.js`, see package.json's "test" script) would otherwise
// try to load it too, and worstStatus() is a pure function that needs none
// of that suite's Mongo harness. Run directly:
//
//   node application/server/tests/status/worst-status.check.mjs
//
// Exits non-zero (via assert throwing) on any failure.
import assert from 'node:assert/strict';
import { worstStatus } from '../../src/utils/status-checker.js';

// A single down monitor must still pin the whole rollup to `down` — this is
// the exact mechanism that made a real outage ("Preussen Bot") visible on
// the banner before. The idle-as-healthy change must not weaken it.
assert.equal(
    worstStatus(['operational', 'idle', 'down']),
    'down',
    'a down monitor must still win over idle/operational',
);

// A degraded monitor (still responding, but failing >10% of checks) must
// still surface as `degraded`, not get masked by healthy idle/operational
// siblings.
assert.equal(
    worstStatus(['operational', 'idle', 'degraded']),
    'degraded',
    'a degraded monitor must still win over idle/operational',
);

// `pending` (never checked) is unknown, not healthy — it must not be folded
// into the idle/operational tier and disappear.
assert.equal(
    worstStatus(['operational', 'pending']),
    'pending',
    'pending must not be swallowed by operational',
);
assert.equal(
    worstStatus(['idle', 'pending']),
    'pending',
    'pending must not be swallowed by idle either',
);

// The actual bug this change fixes: a mix of idle (scale-to-zero, healthy)
// and operational monitors, with nothing worse present, must roll up to
// `operational` — this is what keeps the banner green.
assert.equal(
    worstStatus(['idle', 'operational']),
    'operational',
    'idle + operational must roll up to operational',
);

// An all-idle group (e.g. a group made only of scale-to-zero apps) gets the
// same healthy treatment — the argument ("scaled to zero is up, not down")
// doesn't change because every member happens to be resting at once.
assert.equal(
    worstStatus(['idle', 'idle']),
    'operational',
    'an all-idle rollup must still read as operational',
);

console.log('worst-status.check.mjs: all assertions passed');
