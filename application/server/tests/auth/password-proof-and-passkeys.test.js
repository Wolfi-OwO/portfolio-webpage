import httpServer from '../../src/server.js';
import assert from 'assert';
import request from 'supertest';
import { AdminCredential } from '../../src/models/admin-credential.js';
import { adminToken } from '../tokens.js';

const TYPED = 'test-admin-password';
const proof = (tag) => 'pw1$' + tag.padEnd(43, 'x');

describe('admin password proof', function () {
    beforeEach(async () => {
        await AdminCredential.deleteMany({});
    });

    it('refuses a proof before one is stored and says the page should retry with the typed password', async function () {
        const res = await request(httpServer)
            .post('/auth/login')
            .send({ username: 'admin', password: proof('a') })
            .expect(401);
        assert.equal(res.body.legacyLogin, true);
    });

    it('stores the proof on the retry, and then signs in with the proof alone', async function () {
        await request(httpServer)
            .post('/auth/login')
            .send({ username: 'admin', password: proof('a'), legacyPassword: TYPED })
            .expect(200);
        await request(httpServer)
            .post('/auth/login')
            .send({ username: 'admin', password: proof('a') })
            .expect(200);
        const wrong = await request(httpServer)
            .post('/auth/login')
            .send({ username: 'admin', password: proof('b') })
            .expect(401);
        assert.equal(wrong.body.legacyLogin, false);
    });

    it('refuses the retry when the typed password is wrong, and stores nothing', async function () {
        await request(httpServer)
            .post('/auth/login')
            .send({ username: 'admin', password: proof('a'), legacyPassword: 'nope' })
            .expect(401);
        assert.equal(await AdminCredential.countDocuments(), 0);
    });

    it('still signs in a page that sends the typed password', async function () {
        await request(httpServer)
            .post('/auth/login')
            .send({ username: 'admin', password: TYPED })
            .expect(200);
    });

    it('unlocks the secret page with a proof after the retry', async function () {
        await request(httpServer)
            .post('/auth/unlock')
            .send({ password: proof('a'), legacyPassword: TYPED })
            .expect(200);
        await request(httpServer)
            .post('/auth/unlock')
            .send({ password: proof('a') })
            .expect(200);
    });
});

describe('admin passkeys', function () {
    it('hands out sign-in options without signing in', async function () {
        const res = await request(httpServer).post('/auth/passkey/options').send({}).expect(200);
        assert.match(res.body.options.challenge, /\S{20,}/);
        assert.match(res.body.ceremonyId, /^[0-9a-f]{24}$/);
    });

    it('keeps registration and the list behind the admin token', async function () {
        await request(httpServer).post('/auth/passkeys/register/options').send({}).expect(401);
        await request(httpServer).get('/auth/passkeys').expect(401);
        const list = await request(httpServer)
            .get('/auth/passkeys')
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(200);
        assert.deepEqual(list.body.passkeys, []);
        const opts = await request(httpServer)
            .post('/auth/passkeys/register/options')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({})
            .expect(200);
        assert.equal(opts.body.options.rp.name, 'Woofi Developments');
    });

    it('rejects a made-up answer, and a ceremony works only once', async function () {
        const { body } = await request(httpServer).post('/auth/passkey/options').send({});
        const response = { id: 'AAAA', rawId: 'AAAA', type: 'public-key', response: {} };
        for (let i = 0; i < 2; i++) {
            await request(httpServer)
                .post('/auth/passkey/login')
                .send({ ceremonyId: body.ceremonyId, response })
                .expect(401);
        }
    });
});
