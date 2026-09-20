// Framework-free check for severityFor() in status-checker.js (pure function,
// no Mongo harness needed; not named *.test.js so mocha's glob skips it).
// Run directly:
//
//   node application/server/tests/status/severity.check.mjs
import assert from 'node:assert/strict';
import { severityFor } from '../../src/utils/status-checker.js';

// Band edges: inclusive upper bound, next band starts just above it.
assert.equal(severityFor(0), 'operational');
assert.equal(severityFor(0.005), 'operational');
assert.equal(severityFor(0.0051), 'minor');
assert.equal(severityFor(0.05), 'minor');
assert.equal(severityFor(0.0501), 'major');
assert.equal(severityFor(0.2), 'major');
assert.equal(severityFor(0.2001), 'critical');

// Real shapes from the 2026-09-20 measurement.
assert.equal(severityFor(1 / 1440), 'operational', 'one failed check must not paint the day');
assert.equal(severityFor(21 / 1440), 'minor');
assert.equal(severityFor(0.09), 'major', '2.2 h down must not look like a blip');

console.log('severity.check.mjs: all assertions passed');
