/* ***************** IMPORT packages *********************** */
import httpServer from '../../src/server.js';
import assert from 'assert';
import request from 'supertest';

/* ***************** DECLARE testfunctions *********************** */
describe('GET /api/info', function () {
    it('answers the shape every app of the stack answers, without signing in', async function () {
        const res = await request(httpServer).get('/api/info').expect(200);
        assert.equal(res.body.name, 'portfolio-webpage');
        for (const key of ['version', 'revision', 'buildDate', 'repositoryUrl'])
            assert.equal(typeof res.body[key], 'string', key);
    });
});
