/* ***************** IMPORT packages *********************** */
import httpServer from '../src/server.js';
import assert from 'assert';
import request from 'supertest';

/* ***************** DECLARE testfunctions *********************** */
// The public read-only endpoints are cached for a minute and served stale while they refresh, but an answer to a
// signed-in admin must never be shared: the admin pages need to see their own edit at once.
describe('Cache-Control on the public API', function () {
    it('lets a GET without credentials be cached briefly and served stale while it refreshes', async function () {
        const res = await request(httpServer).get('/api/info');
        assert.strictEqual(res.status, 200);
        assert.strictEqual(
            res.headers['cache-control'],
            'public, max-age=60, stale-while-revalidate=600',
        );
        assert.match(res.headers.vary, /Authorization/i);
    });

    it('makes an answer to a request with a bearer token private and always revalidated', async function () {
        const res = await request(httpServer)
            .get('/api/info')
            .set('Authorization', 'Bearer not-checked-here');
        assert.strictEqual(res.headers['cache-control'], 'private, no-cache');
    });

    it('does not give a missing API path the public cache policy', async function () {
        const res = await request(httpServer).get('/api/gibt-es-nicht');
        assert.strictEqual(res.status, 404);
        assert.doesNotMatch(res.headers['cache-control'] ?? '', /max-age=60/);
    });
});
