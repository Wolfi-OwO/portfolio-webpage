/* ***************** IMPORT packages *********************** */
import request from 'supertest';
import httpServer from '../../server.js';

/* ***************** SETUP demo data *********************** */
const exampleProject = {
    title: 'Machine Learning Visualizer',
    description:
        'A tutoring site, helping students master basic machine learning algorithms.',
    livedemo: 'https://ml-visualizer.at/',
    technologies: [
        {
            tech: 'Python',
            color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300',
        },
        {
            tech: 'Streamlit',
            color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300',
        },
    ],
};

const anotherExampleProject = {
    title: 'Alpinfex',
    description:
        'A blog website for enthusiastic mountaineers who want to share their experiences with others.',
    technologies: [
        [
            {
                tech: 'React',
                color: 'bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-300',
            },
            {
                tech: 'NodeJs',
                color: 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300',
            },
            {
                tech: 'Express',
                color: 'bg-neutral-200 text-neutral-800 dark:bg-neutral-700/30 dark:text-neutral-200',
            },
            {
                tech: 'TailwindCSS',
                color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-500/20 dark:text-cyan-300',
            },
        ],
    ],
};

const thirdExampleProject = {
    title: 'Portfolio Webpage',
    description:
        'A full-stack portfolio web application built to present projects, skills, and experience using React, Node.js, Express, and TailwindCSS.',
    technologies: [
        [
            {
                tech: 'React',
                color: 'bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-300',
            },
            {
                tech: 'NodeJs',
                color: 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300',
            },
            {
                tech: 'Express',
                color: 'bg-neutral-200 text-neutral-800 dark:bg-neutral-700/30 dark:text-neutral-200',
            },
            {
                tech: 'TailwindCSS',
                color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-500/20 dark:text-cyan-300',
            },
        ],
    ],
};

const invalidProject = {};

/* ***************** DECLARE common functions *********************** */
async function getAllProjects() {
    const res = await request(httpServer)
        .get('/api/projects')
        .expect('Content-Type', /json/)
        .expect(200);

    return res.body;
}

async function getProjectById(projectId) {
    const res = await request(httpServer)
        .get(`/api/projects/${projectId}`)
        .expect('Content-Type', /json/)
        .expect(200);

    return res.body;
}

async function createProject(project) {
    const res = await request(httpServer)
        .post(`/api/projects`)
        .set('Content-Type', 'application/json')
        .send(project)
        .expect('Content-Type', /json/)
        .expect(200);

    return res.body;
}

export {
    exampleProject,
    anotherExampleProject,
    thirdExampleProject,
    invalidProject,
    getAllProjects,
    getProjectById,
    createProject,
};
