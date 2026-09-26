import { setupDatabaseConnection } from './database.js';
import { logger } from '../utils/logger.js';
import { promises as fsp } from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { ProjectModel } from '../models/project.js';
import { TechnologyModel } from '../models/technology.js';
import { MonitorModel } from '../models/monitor.js';
import { ServiceModel } from '../models/service.js';
import { AvailabilityModel } from '../models/availability.js';

// dirname-relative (not cwd-relative) so this works regardless of where `npm run
// fill-demo-data` is invoked from.
const DATA_DIR = path.join(import.meta.dirname, 'data');

const MONGODB_CONNECTION_STRING =
    process.env.MONGODB_CONNECTION_STRING || 'mongodb://127.0.0.1/portfolio-app';

fillDatabase();

// Shared cache for already created/found technologies
const allTechnologies = [];

async function fillDatabase() {
    await setupDatabaseConnection(MONGODB_CONNECTION_STRING, true);

    logger.info('Starting filling database with demo data...');

    await logResults('Projects', fillProjectsData);
    await logResults('Monitors', fillMonitorsData);
    await logResults('Services', fillServicesData);
    await logResults('Availability', fillAvailabilityData);
    // career.json's entries all carry track: 'career' (see availability.js's schema
    // comment for why career history and availability rows can't share one list on
    // the client). Entry #1 (the current Infineon role) describes the same real
    // job as availability.json's current "Praktikum" entry — that's intentional,
    // not a duplicate: availability drives the hero badge/rail, career drives the
    // history list, and neither should be deleted on the other's account.
    //
    // These entries are written in German, like availability.json's seed already
    // is, even though DEFAULT_LOCALE is 'en' — the real Austrian job/school titles
    // ("Softwareingenieur:in", "Reife- und Diplomprüfung") are only accurate in
    // German, and this schema has no per-entry i18n mechanism today. That's an
    // existing limitation this data inherits, not a new regression.
    await logResults('Career', fillCareerData);

    logger.info('Finished filling database!');

    await mongoose.disconnect();
}

async function logResults(name, fillFunction) {
    const { successCnt, errorCnt, errorObjects } = await fillFunction();

    logger.info(`${name} - Successfully imported: ${successCnt}, Errors: ${errorCnt}`);

    if (errorObjects.length > 0) {
        logger.info(`Error details for ${name}:`, errorObjects);
    }
}

async function fillProjectsData() {
    const allProjects = JSON.parse(
        await fsp.readFile(path.join(DATA_DIR, 'projects.json'), 'utf-8'),
    );

    const preparedProjects = [];

    for (const project of allProjects) {
        const technologyIds = [];

        for (const technology of project.technologies) {
            // 1. Check local cache first
            let existingTechnology = allTechnologies.find((t) => t.tech === technology.tech);

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

async function fillServicesData() {
    const allServices = JSON.parse(
        await fsp.readFile(path.join(DATA_DIR, 'services.json'), 'utf-8'),
    );

    return processDocuments(allServices, ServiceModel.create.bind(ServiceModel));
}

async function fillAvailabilityData() {
    const allEntries = JSON.parse(
        await fsp.readFile(path.join(DATA_DIR, 'availability.json'), 'utf-8'),
    );

    return processDocuments(allEntries, AvailabilityModel.create.bind(AvailabilityModel));
}

async function fillCareerData() {
    const allEntries = JSON.parse(await fsp.readFile(path.join(DATA_DIR, 'career.json'), 'utf-8'));

    return processDocuments(allEntries, AvailabilityModel.create.bind(AvailabilityModel));
}

async function fillMonitorsData() {
    const allMonitors = JSON.parse(
        await fsp.readFile(path.join(DATA_DIR, 'monitors.json'), 'utf-8'),
    );

    return processDocuments(allMonitors, MonitorModel.create.bind(MonitorModel));
}

async function processDocuments(documents, createFunction) {
    const allCreationJobs = documents.map((doc) => createFunction(doc));

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
        successCnt: results.filter((job) => job.status === 'fulfilled').length,
        errorCnt: errorObjects.length,
        errorObjects,
    };
}
