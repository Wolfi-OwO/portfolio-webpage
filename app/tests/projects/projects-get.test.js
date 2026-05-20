/* ***************** IMPORT packages *********************** */
import httpServer from '../../server.js';
import assert from 'assert';
import request from 'supertest';
import {
    exampleProject,
    anotherExampleProject,
    thirdExampleProject,
    createProject,
} from './common.js';

/* ***************** DECLARE testfunctions *********************** */
describe('GET /api/projects', function () {
    beforeEach(async () => {
        await httpServer.dropCurrentDatabase(process.env.MONGODB_CONNECTION_STRING);
    });

    it('should get all projects with no queryparameters', async function () {
        const res = await request(httpServer)
            .get(`/api/projects/`)
            .expect('Content-Type', /json/)
            .expect(200);

        assert.equal(res.body.length, 0, 'The body length must be zero.');
    });

    it('should get all three projects', async function () {
        const machineLearningVisualizerProject = await createProject(exampleProject);
        const alpinfexProject = await createProject(anotherExampleProject);
        const portfolioWebpageProject = await createProject(thirdExampleProject);

        const res = await request(httpServer)
            .get(`/api/projects/`)
            .expect('Content-Type', /json/)
            .expect(200);

        assert.equal(res.body.length, 3, 'The body length must be three.');
    });

    it('should get the first two projects', async function () {
        const machineLearningVisualizerProject = await createProject(exampleProject);
        const alpinfexProject = await createProject(anotherExampleProject);
        const portfolioWebpageProject = await createProject(thirdExampleProject);

        const res = await request(httpServer)
            .get(`/api/projects?offset=1&limit=2`)
            .expect('Content-Type', /json/)
            .expect(200);

        const firstProject = res.body[0];
        const secondProject = res.body[1];

        assert.equal(res.body.length, 2, 'The body length must be three.');
        assert.equal(
            firstProject.title,
            alpinfexProject.title,
            'The title of the first project must match the given one.',
        );
        assert.equal(
            firstProject.description,
            alpinfexProject.description,
            'The description of the first project must match the given one.',
        );
        assert.equal(
            secondProject.title,
            portfolioWebpageProject.title,
            'The title of the second project must match the given one.',
        );
        assert.equal(
            secondProject.description,
            portfolioWebpageProject.description,
            'The description of the second project must match the given one.',
        );
    });

    it('should get the last two projects', async function () {
        const machineLearningVisualizerProject = await createProject(exampleProject);
        const alpinfexProject = await createProject(anotherExampleProject);
        const portfolioWebpageProject = await createProject(thirdExampleProject);

        const res = await request(httpServer)
            .get(`/api/projects?limit=2`)
            .expect('Content-Type', /json/)
            .expect(200);

        const firstProject = res.body[0];
        const secondProject = res.body[1];

        assert.equal(res.body.length, 2, 'The body length must be three.');
        assert.equal(
            firstProject.title,
            machineLearningVisualizerProject.title,
            'The title of the second project must match the given one.',
        );
        assert.equal(
            firstProject.description,
            machineLearningVisualizerProject.description,
            'The description of the second project must match the given one.',
        );
        assert.equal(
            secondProject.title,
            alpinfexProject.title,
            'The title of the first project must match the given one.',
        );
        assert.equal(
            secondProject.description,
            alpinfexProject.description,
            'The description of the first project must match the given one.',
        );
    });
});
