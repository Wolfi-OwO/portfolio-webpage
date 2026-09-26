// Dependency-free regression check for incidents-shared.js. No test runner:
// the client has none installed, so plain `node` loads and asserts directly
// (same pattern as ../../utils/availability.test.mjs).
import assert from 'node:assert/strict';
import { collectIncidents, sortByStartedAtDesc, groupByDay } from './incidents-shared.js';

const monitors = [
    {
        name: 'Portfolio',
        group: 'Portfolio',
        incidents: [
            {
                startedAt: '2026-09-20T10:00:00.000Z',
                endedAt: '2026-09-20T10:05:00.000Z',
                durationSeconds: 300,
            },
        ],
    },
    {
        name: 'Nutrilens',
        group: null,
        incidents: [
            { startedAt: '2026-09-22T08:00:00.000Z', endedAt: null, durationSeconds: 0 },
            {
                startedAt: '2026-09-20T09:00:00.000Z',
                endedAt: '2026-09-20T09:02:00.000Z',
                durationSeconds: 120,
            },
        ],
    },
    { name: 'No Incidents' },
];

// collectIncidents: flattens across monitors, tags with monitorName/group,
// skips monitors with no incidents[] at all.
const flat = collectIncidents(monitors);
assert.equal(flat.length, 3);
assert.ok(flat.every((inc) => inc.monitorName));
assert.equal(
    flat.find((inc) => inc.monitorName === 'Nutrilens' && inc.endedAt === null).group,
    null,
);

// sortByStartedAtDesc: newest first, does not mutate the input.
const sorted = sortByStartedAtDesc(flat);
assert.deepEqual(
    sorted.map((inc) => inc.startedAt),
    ['2026-09-22T08:00:00.000Z', '2026-09-20T10:00:00.000Z', '2026-09-20T09:00:00.000Z'],
);
assert.equal(flat[0].startedAt, '2026-09-20T10:00:00.000Z'); // original order untouched

// groupByDay: the two 2026-09-20 incidents land in one group, in input order.
const grouped = groupByDay(sorted);
assert.equal(grouped.length, 2);
assert.equal(grouped[0].incidents.length, 1);
assert.equal(grouped[1].incidents.length, 2);
assert.equal(grouped[1].incidents[0].startedAt, '2026-09-20T10:00:00.000Z');

console.log('OK');
