/* ***************** IMPORT packages *********************** */
import httpServer from '../src/server.js';
import assert from 'assert';
import request from 'supertest';
import mongoose from 'mongoose';

/* ***************** DECLARE testfunctions *********************** */
// Regression coverage for behavior Express 5 (router 2.2.0) already provides
// for free — measured directly rather than assumed, see the task brief. No
// route adds any HEAD/OPTIONS handling of its own; these just pin down that
// the framework default keeps working across changes to the routers.
describe('HTTP method defaults (Express 5 built-ins)', function () {
    beforeEach(async () => {
        await httpServer.dropCurrentDatabase(process.env.MONGODB_CONNECTION_STRING);
    });

    it('HEAD /api/projects answers 200 with an empty body', async function () {
        const res = await request(httpServer).head('/api/projects');
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.text, undefined);
    });

    it('OPTIONS /api/projects lists GET, HEAD, POST', async function () {
        const res = await request(httpServer).options('/api/projects');
        assert.strictEqual(res.status, 200);
        for (const method of ['GET', 'HEAD', 'POST']) {
            assert.ok(res.headers['allow'].includes(method), `Allow should include ${method}`);
        }
    });

    it('OPTIONS /api/projects/:id lists GET, HEAD, PUT, DELETE', async function () {
        const id = new mongoose.Types.ObjectId();
        const res = await request(httpServer).options(`/api/projects/${id}`);
        assert.strictEqual(res.status, 200);
        for (const method of ['GET', 'HEAD', 'PUT', 'DELETE']) {
            assert.ok(res.headers['allow'].includes(method), `Allow should include ${method}`);
        }
    });

    it('OPTIONS /auth/login lists POST', async function () {
        const res = await request(httpServer).options('/auth/login');
        assert.strictEqual(res.status, 200);
        assert.ok(res.headers['allow'].includes('POST'));
    });

    it('OPTIONS /api/monitors lists GET, HEAD, POST', async function () {
        const res = await request(httpServer).options('/api/monitors');
        assert.strictEqual(res.status, 200);
        for (const method of ['GET', 'HEAD', 'POST']) {
            assert.ok(res.headers['allow'].includes(method), `Allow should include ${method}`);
        }
    });

    it('OPTIONS /api/does-not-exist answers 404 as JSON', async function () {
        const res = await request(httpServer).options('/api/does-not-exist');
        assert.strictEqual(res.status, 404);
        assert.match(res.headers['content-type'], /application\/json/);
    });

    it('HEAD /api/monitors without a token answers 401', async function () {
        const res = await request(httpServer).head('/api/monitors');
        assert.strictEqual(res.status, 401);
    });
});
