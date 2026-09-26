import httpServer from '../../src/server.js';
import assert from 'assert';
import request from 'supertest';
import { MonitorModel } from '../../src/models/monitor.js';
import { adminToken } from '../tokens.js';

const auth = { Authorization: `Bearer ${adminToken}` };

describe('monitor metrionKey', function () {
    beforeEach(async () => {
        await httpServer.dropCurrentDatabase(process.env.MONGODB_CONNECTION_STRING);
        // The drop removes indexes; the unique check below depends on this one.
        await MonitorModel.syncIndexes();
    });

    it('rejects a create without metrionKey and persists one with it', async function () {
        await request(httpServer)
            .post('/api/monitors')
            .set(auth)
            .send({ name: 'A', url: 'https://a.test' })
            .expect(400);

        const res = await request(httpServer)
            .post('/api/monitors')
            .set(auth)
            .send({ name: 'A', url: 'https://a.test', metrionKey: 'netviz' })
            .expect(201);
        assert.equal(res.body.metrionKey, 'netviz');
        assert.equal((await MonitorModel.findById(res.body._id)).metrionKey, 'netviz');
    });

    it('rejects a key outside the ingest charset and a duplicate key', async function () {
        await request(httpServer)
            .post('/api/monitors')
            .set(auth)
            .send({ name: 'A', url: 'https://a.test', metrionKey: 'has space' })
            .expect(400);
        await MonitorModel.create({ name: 'A', url: 'https://a.test', metrionKey: 'dup' });
        await request(httpServer)
            .post('/api/monitors')
            .set(auth)
            .send({ name: 'B', url: 'https://b.test', metrionKey: 'dup' })
            .expect(400);
    });

    it('keeps a legacy monitor editable only once it gets a key, and keeps an existing key when omitted', async function () {
        const legacy = await MonitorModel.create({ name: 'Old', url: 'https://old.test' });
        await request(httpServer)
            .put(`/api/monitors/${legacy._id}`)
            .set(auth)
            .send({ name: 'Old', url: 'https://old.test' })
            .expect(400);
        await request(httpServer)
            .put(`/api/monitors/${legacy._id}`)
            .set(auth)
            .send({ name: 'Old', url: 'https://old.test', metrionKey: 'old' })
            .expect(200);
        const res = await request(httpServer)
            .put(`/api/monitors/${legacy._id}`)
            .set(auth)
            .send({ name: 'Old 2', url: 'https://old.test' })
            .expect(200);
        assert.equal(res.body.metrionKey, 'old');
    });

    it('stays admin-only', async function () {
        await request(httpServer)
            .post('/api/monitors')
            .send({ name: 'A', url: 'https://a.test', metrionKey: 'x' })
            .expect(401);
    });
});
