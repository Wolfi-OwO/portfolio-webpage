/* ***************** IMPORT packages *********************** */
import assert from 'assert';
import express from 'express';
import request from 'supertest';
import { createContactRouter } from '../../src/routes/contact-route.js';
import { errorHandler } from '../../src/middlewares/error-handlers.js';

/* ***************** DECLARE testfunctions *********************** */
// A throwaway app with a stub handler: the limiter is the unit under test, so no database is needed.
function buildApp() {
    const app = express();
    app.set('trust proxy', 1);
    app.use(express.json());
    app.use(
        '/api/contact',
        createContactRouter({ create: (_req, res) => res.status(201).json({ status: 201 }) }),
    );
    app.use(errorHandler);
    return app;
}

describe('POST /api/contact rate limit', function () {
    it('lets 10 requests through and answers the 11th with 429 in the auth route shape', async function () {
        const app = buildApp();

        for (let i = 1; i <= 10; i++) {
            const res = await request(app).post('/api/contact').send({});
            assert.strictEqual(res.status, 201, `request ${i}`);
        }

        const res = await request(app).post('/api/contact').send({});
        assert.strictEqual(res.status, 429);
        assert.deepStrictEqual(res.body, {
            status: 429,
            message: 'Too many messages. Please try again later.',
        });
    });

    it('counts per address: another client is not limited by the first one', async function () {
        const app = buildApp();
        for (let i = 0; i < 11; i++) {
            await request(app).post('/api/contact').set('X-Forwarded-For', '203.0.113.1').send({});
        }
        const other = await request(app)
            .post('/api/contact')
            .set('X-Forwarded-For', '203.0.113.2')
            .send({});
        assert.strictEqual(other.status, 201);
    });

    it('keeps GET and DELETE behind the admin token', async function () {
        const app = buildApp();
        assert.strictEqual((await request(app).get('/api/contact')).status, 401);
        assert.strictEqual((await request(app).delete('/api/contact/abc')).status, 401);
    });
});
