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
