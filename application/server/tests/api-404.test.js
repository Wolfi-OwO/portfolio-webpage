/* ***************** IMPORT packages *********************** */
import httpServer from '../src/server.js';
import assert from 'assert';
import request from 'supertest';

/* ***************** DECLARE testfunctions *********************** */
// Regression test for a measured bug: an unmatched /api/ path used to fall
// through to Express's built-in 404, which answers `text/html` — wrong for
// a JSON API, and it would also get swallowed by the SPA-fallback 200 an
// unmatched non-API path gets. See the app.use('/api', ...) guard in
// server.js this exercises.
describe('GET /api/<unknown>', function () {
    it('answers 404 as JSON, not the SPA HTML shell', async function () {
        const res = await request(httpServer).get('/api/gibt-es-nicht');
        assert.strictEqual(res.status, 404);
        assert.match(res.headers['content-type'], /application\/json/);
        assert.strictEqual(res.body.status, 404);
    });
});

describe('GET /livez, /readyz', function () {
    it('/livez answers ok without touching the database', async function () {
        const res = await request(httpServer).get('/livez');
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.body.status, 'ok');
    });

    it('/readyz mirrors /api/ready (same handler, canonical alias)', async function () {
        const [ready, readyz] = await Promise.all([
            request(httpServer).get('/api/ready'),
            request(httpServer).get('/readyz'),
        ]);
        assert.strictEqual(readyz.status, ready.status);
        assert.deepStrictEqual(readyz.body, ready.body);
    });
});

// The private pages must carry a noindex header, and the public ones must not.
describe('X-Robots-Tag on private pages', function () {
    for (const path of ['/secret', '/admin/login', '/de/secret', '/de/admin/login', '/api/gibt-es-nicht']) {
        it(`${path} is marked noindex`, async function () {
            const res = await request(httpServer).get(path);
            assert.match(res.headers['x-robots-tag'] ?? '', /noindex/);
        });
    }
    it('a public page is not marked noindex', async function () {
        const res = await request(httpServer).get('/career');
        assert.strictEqual(res.headers['x-robots-tag'], undefined);
    });
    it('the German public page is not marked noindex either', async function () {
        const res = await request(httpServer).get('/de/career');
        assert.strictEqual(res.headers['x-robots-tag'], undefined);
    });
});

// The German site mirrors the English routes under /de; the server must answer 200 for a real
// page there and 404 for one that does not exist, same as for the English paths.
describe('German routes under /de', function () {
    for (const path of ['/de', '/de/services', '/de/career', '/de/impressum']) {
        it(`${path} is a known page`, async function () {
            const res = await request(httpServer).get(path);
            assert.strictEqual(res.status, 200);
        });
    }
    it('an unknown German path is a 404', async function () {
        const res = await request(httpServer).get('/de/gibt-es-nicht');
        assert.strictEqual(res.status, 404);
    });
});
