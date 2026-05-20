import { setupDatabaseConnection } from './database.js';
import { logger } from '../utils/logger.js';
import { promises as fsp } from 'fs';
import mongoose from 'mongoose';
import { ProjectModel } from '../models/project.js';
import { TechnologyModel } from '../models/technology.js';

const MONGODB_CONNECTION_STRING =
    process.env.MONGODB_CONNECTION_STRING || 'mongodb://127.0.0.1/team_a';

fillDatabase();

// Shared cache for already created/found technologies
const allTechnologies = [];

async function fillDatabase() {
    await setupDatabaseConnection(MONGODB_CONNECTION_STRING, true);

    logger.info('Starting filling database with demo data...');

    await logResults('Projects', fillProjectsData);

    logger.info('Finished filling database!');

    await mongoose.disconnect();
}

async function logResults(name, fillFunction) {
    const { successCnt, errorCnt, errorObjects } = await fillFunction();

    logger.info(
        `${name} - Successfully imported: ${successCnt}, Errors: ${errorCnt}`,
    );

    if (errorObjects.length > 0) {
        logger.info(`Error details for ${name}:`, errorObjects);
    }
}

async function fillProjectsData() {
    const allProjects = JSON.parse(
        await fsp.readFile('./database/data/projects.json', 'utf-8'),
    );

    const preparedProjects = [];

    for (const project of allProjects) {
        const technologyIds = [];

        for (const technology of project.technologies) {
            // 1. Check local cache first
            let existingTechnology = allTechnologies.find(
                t => t.tech === technology.tech,
            );

            // 2. Check database if not in cache
            if (!existingTechnology) {
                existingTechnology = await TechnologyModel.findOne({
                    tech: technology.tech,
                });
            }

            // 3. Create if still not existing
            if (!existingTechnology) {
                existingTechnology = await TechnologyModel.create(technology);

                allTechnologies.push(existingTechnology);
            }

            technologyIds.push(existingTechnology._id);
        }

        // Replace technology objects with ids
        preparedProjects.push({
            ...project,
            technologies: technologyIds,
        });
    }

    const { successCnt, errorCnt, errorObjects } = await processDocuments(
        preparedProjects,
        ProjectModel.create.bind(ProjectModel),
    );

    return {
        successCnt,
        errorCnt,
        errorObjects,
    };
}

async function processDocuments(documents, createFunction) {
    const allCreationJobs = documents.map(doc => createFunction(doc));

    const results = await Promise.allSettled(allCreationJobs);

    const errorObjects = results
        .map((job, index) =>
            job.status === 'rejected'
                ? {
                      reason: job.reason,
                      object: documents[index],
                  }
                : null,
        )
        .filter(Boolean);

    return {
        successCnt: results.filter(job => job.status === 'fulfilled').length,
        errorCnt: errorObjects.length,
        errorObjects,
    };
}
