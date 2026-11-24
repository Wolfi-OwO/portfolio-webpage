/* ***************** IMPORT packages *********************** */
import httpServer from '../../src/server.js';
import assert from 'assert';
import request from 'supertest';
import { adminToken } from '../tokens.js';

/* ***************** SETUP demo data *********************** */
const PDF = Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\n%%EOF\n');
const entry = {
    title: 'HTL Villach',
    startDate: '2022-09-01',
    kind: 'education',
    track: 'career',
    published: true,
};

const createEntry = async (body = entry) =>
    (
        await request(httpServer)
            .post('/api/availability')
            .set('Authorization', `Bearer ${adminToken}`)
            .send(body)
            .expect(201)
    ).body;

const upload = (
    id,
    { type = 'application/pdf', name = 'thesis.pdf', body = PDF, token = adminToken } = {},
) => {
    const r = request(httpServer)
        .post(`/api/availability/${id}/attachments`)
        .set('Content-Type', type)
        .set('X-File-Name', encodeURIComponent(name));
    if (token) r.set('Authorization', `Bearer ${token}`);
    return r.send(body);
};

/* ***************** DECLARE testfunctions *********************** */
describe('attachments on career entries', function () {
    beforeEach(async () => {
        await httpServer.dropCurrentDatabase(process.env.MONGODB_CONNECTION_STRING);
    });

    it('lets the admin attach a PDF, lists it on the entry and serves it to anyone', async function () {
        const e = await createEntry();
        const created = await upload(e._id).expect(201);
        assert.equal(created.body.name, 'thesis.pdf');
        assert.equal(created.body.size, PDF.length);
        assert.ok(!('data' in created.body));

        const list = await request(httpServer).get('/api/availability?track=career').expect(200);
        assert.deepStrictEqual(
            list.body.items[0].attachments.map((a) => a.name),
            ['thesis.pdf'],
        );

        const file = await request(httpServer)
            .get(`/api/attachments/${created.body.id}`)
            .expect(200);
        assert.match(file.headers['content-type'], /application\/pdf/);
        assert.match(file.headers['content-disposition'], /^inline; filename\*=UTF-8''thesis\.pdf/);
        assert.equal(file.headers['x-content-type-options'], 'nosniff');
        assert.ok(Buffer.compare(file.body, PDF) === 0);
    });

    it('refuses an upload without the admin token', async function () {
        const e = await createEntry();
        await upload(e._id, { token: null }).expect(401);
    });

    it('refuses a file whose content is not its declared type', async function () {
        const e = await createEntry();
        const res = await upload(e._id, { body: Buffer.from('<script>alert(1)</script>') }).expect(
            400,
        );
        assert.match(res.body.message, /does not match/);
    });

    it('refuses a type that is not on the list', async function () {
        const e = await createEntry();
        await upload(e._id, { type: 'text/html', body: Buffer.from('<p>x</p>') }).expect(400);
    });

    it('serves Office files only as downloads', async function () {
        const e = await createEntry();
        const docx = Buffer.concat([Buffer.from([0x50, 0x4b, 0x03, 0x04]), Buffer.alloc(20)]);
        const created = await upload(e._id, {
            type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            name: 'cv.docx',
            body: docx,
        }).expect(201);
        const file = await request(httpServer)
            .get(`/api/attachments/${created.body.id}`)
            .expect(200);
        assert.match(file.headers['content-disposition'], /^attachment;/);
    });

    it('strips paths and quotes from the file name', async function () {
        const e = await createEntry();
        const res = await upload(e._id, { name: '../../etc/pass"wd.pdf' }).expect(201);
        assert.ok(!/[\\/"]/.test(res.body.name));
    });

    it('hides the files of a draft entry from everyone but the admin', async function () {
        const e = await createEntry({ ...entry, published: false });
        const created = await upload(e._id).expect(201);
        await request(httpServer).get(`/api/attachments/${created.body.id}`).expect(404);
        await request(httpServer)
            .get(`/api/attachments/${created.body.id}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(200);
    });

    it('lets only the admin delete a file, and deleting the entry removes its files', async function () {
        const e = await createEntry();
        const a = await upload(e._id).expect(201);
        await request(httpServer).delete(`/api/attachments/${a.body.id}`).expect(401);
        await request(httpServer)
            .delete(`/api/attachments/${a.body.id}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(204);
        await request(httpServer).get(`/api/attachments/${a.body.id}`).expect(404);

        const b = await upload(e._id).expect(201);
        await request(httpServer)
            .delete(`/api/availability/${e._id}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(204);
        await request(httpServer).get(`/api/attachments/${b.body.id}`).expect(404);
    });

    it('holds at most eight attachments per entry', async function () {
        const e = await createEntry();
        for (let i = 0; i < 8; i++) await upload(e._id, { name: `f${i}.pdf` }).expect(201);
        await upload(e._id, { name: 'ninth.pdf' }).expect(400);
    });
});
