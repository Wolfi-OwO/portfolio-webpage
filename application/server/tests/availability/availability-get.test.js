/* ***************** IMPORT packages *********************** */
import httpServer from '../../src/server.js';
import assert from 'assert';
import request from 'supertest';
import { adminToken } from '../tokens.js';

/* ***************** SETUP demo data *********************** */
const draftEntry = {
    title: 'Tentative sabbatical',
    startDate: '2027-01-01',
    kind: 'unavailable',
    published: false,
};

/* ***************** DECLARE testfunctions *********************** */
describe('GET /api/availability/:id draft visibility', function () {
    beforeEach(async () => {
        await httpServer.dropCurrentDatabase(process.env.MONGODB_CONNECTION_STRING);
    });

    it('answers 404 for an anonymous request to a real draft id', async function () {
        const created = await request(httpServer)
            .post('/api/availability')
            .set('Authorization', `Bearer ${adminToken}`)
            .set('Content-Type', 'application/json')
            .send(draftEntry)
            .expect(201);

        const res = await request(httpServer)
            .get(`/api/availability/${created.body._id}`)
            .expect('Content-Type', /json/)
            .expect(404);

        assert.equal(res.body.status, 404);
    });

    it('returns the draft to an authenticated admin', async function () {
        const created = await request(httpServer)
            .post('/api/availability')
            .set('Authorization', `Bearer ${adminToken}`)
            .set('Content-Type', 'application/json')
            .send(draftEntry)
            .expect(201);

        const res = await request(httpServer)
            .get(`/api/availability/${created.body._id}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .expect('Content-Type', /json/)
            .expect(200);

        assert.equal(res.body.title, draftEntry.title);
    });
});
