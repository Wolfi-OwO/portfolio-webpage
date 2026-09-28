/* ***************** IMPORT packages *********************** */
import httpServer from '../src/server.js';
import assert from 'assert';
import request from 'supertest';
import { adminToken } from './tokens.js';
import { TechnologyModel } from '../src/models/technology.js';
import { MonitorModel } from '../src/models/monitor.js';

const auth = { Authorization: `Bearer ${adminToken}` };

describe('HATEOAS', function () {
    beforeEach(async () => {
        await httpServer.dropCurrentDatabase(process.env.MONGODB_CONNECTION_STRING);
    });

    it('GET /api lists every resource link', async function () {
        const res = await request(httpServer).get('/api').expect(200);
        const links = res.body._links;

        for (const name of [
            'self',
            'info',
            'projects',
            'technologies',
            'services',
            'availability',
            'activity',
            'status',
            'monitors',
            'login',
            'unlock',
        ]) {
            assert.ok(links[name]?.href, `_links.${name} should be present`);
        }
    });

    it('GET /api/projects returns count + items, each with a matching self link', async function () {
        const created = await request(httpServer)
            .post('/api/projects')
            .set(auth)
            .send({
                title: 'Portfolio Website',
                description: 'A developer portfolio.',
                repositoryUrl: 'https://github.com/Wolfi-OwO/portfolio-webpage',
            })
            .expect(201);

        const res = await request(httpServer).get('/api/projects').expect(200);

        assert.strictEqual(res.body.count, 1);
        assert.strictEqual(res.body.items.length, 1);
        assert.strictEqual(res.body.items[0]._links.self.href, `/api/projects/${created.body._id}`);
    });

    it('GET /api/technologies/:id has _links.update.method === PUT', async function () {
        const tech = await TechnologyModel.create({ tech: 'React', color: 'blue' });

        const res = await request(httpServer).get(`/api/technologies/${tech._id}`).expect(200);

        assert.strictEqual(res.body._links.update.method, 'PUT');
    });

    it('a monitor item has no self key', async function () {
        await MonitorModel.create({ name: 'Site', url: 'https://a.test', metrionKey: 'a' });

        const res = await request(httpServer).get('/api/monitors').set(auth).expect(200);

        assert.ok(!('self' in res.body.items[0]._links));
        assert.ok(res.body.items[0]._links.update);
        assert.ok(res.body.items[0]._links.delete);
    });

    it('POST /auth/login response includes _links.logout', async function () {
        const res = await request(httpServer)
            .post('/auth/login')
            .send({ username: process.env.ADMIN_USER, password: process.env.ADMIN_PASSWORD })
            .expect(200);

        assert.strictEqual(res.body._links.logout.href, '/auth/logout');
        assert.strictEqual(res.body._links.logout.method, 'POST');
    });
});
