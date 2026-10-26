// Framework-free check for buildReport in music-handlers.js. Run directly:
//   node application/server/tests/music/report.check.mjs
import assert from 'node:assert/strict';
import { buildReport } from '../../src/handlers/music-handlers.js';

const item = (title, artist, at, vid = title) => ({
    snippet: {
        title,
        videoOwnerChannelTitle: artist,
        publishedAt: at,
        resourceId: { videoId: vid },
    },
});
const r = buildReport(
    [
        item('A', 'Kygo - Topic', '2026-10-20T10:00:00Z'),
        item('B', 'Kygo', '2026-10-02T10:00:00Z'),
        item('C', 'VIZE - Topic', '2026-08-15T10:00:00Z'),
        item('Deleted video', '', '2026-08-15T10:00:00Z', 'gone'),
        item('D', 'Old', '2025-01-01T10:00:00Z'),
    ],
    new Date('2026-10-26T12:00:00Z'),
);
assert.equal(r.total, 4);
assert.equal(r.artistCount, 3);
assert.deepEqual(r.artists[0], { name: 'Kygo', n: 2 });
assert.deepEqual(
    r.months.map((m) => m.key),
    ['2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10'],
);
assert.equal(r.months[5].n, 2);
assert.equal(r.months[3].n, 1);
assert.equal(r.items.length, 4);
console.log('music report ok');
