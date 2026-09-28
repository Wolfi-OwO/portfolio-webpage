/* ***************** IMPORT packages *********************** */
import httpServer from '../../src/server.js';
import assert from 'assert';
import request from 'supertest';
import { adminToken } from '../tokens.js';
import { exampleProject, invalidProject } from './common.js';

/* ***************** DECLARE testfunctions *********************** */
describe('POST /api/projects', function () {
    beforeEach(async () => {
        await httpServer.dropCurrentDatabase(process.env.MONGODB_CONNECTION_STRING);
    });

    it('creates a project, answering 201 with a Location header pointing at it', async function () {
        const res = await request(httpServer)
            .post('/api/projects')
            .set('Authorization', `Bearer ${adminToken}`)
            .send(exampleProject)
            .expect('Content-Type', /json/)
            .expect(201);

        assert.equal(res.headers['location'], `/api/projects/${res.body._id}`);
        assert.equal(res.body.title, exampleProject.title);
    });

    it('answers 400 for an invalid project body', async function () {
        await request(httpServer)
            .post('/api/projects')
            .set('Authorization', `Bearer ${adminToken}`)
            .send(invalidProject)
            .expect(400);
    });

    it('requires an admin token', async function () {
        await request(httpServer).post('/api/projects').send(exampleProject).expect(401);
    });
});
