// Dependency-free regression check for badgeState()/currentEntry(). No test
// runner: the client has none installed, and availability.js imports nothing,
// so plain `node` can load and assert against it directly.
import assert from 'node:assert/strict';
import { badgeState } from './availability.js';

const now = new Date('2026-09-26T12:00:00Z');

// Empty list -> openToWork (the API-down fallback that keeps the site honest).
assert.equal(badgeState([], now).id, 'availability.badge.openToWork');

// A 'military' block containing now -> openForCommissions, not "not available".
assert.equal(
    badgeState([{ kind: 'military', startDate: '2026-01-01', endDate: '2026-12-31' }], now).id,
    'availability.badge.openForCommissions',
);

// A 'unavailable' block containing now -> the new notAvailable branch.
assert.equal(
    badgeState([{ kind: 'unavailable', startDate: '2026-01-01', endDate: '2026-12-31' }], now).id,
    'availability.badge.notAvailable',
);

// A career-track row overlapping now must be ignored by currentEntry()'s own
// `track !== 'career'` filter and fall through to openToWork.
assert.equal(
    badgeState(
        [{ kind: 'work', track: 'career', startDate: '2026-01-01', endDate: '2026-12-31' }],
        now,
    ).id,
    'availability.badge.openToWork',
);

console.log('OK');
