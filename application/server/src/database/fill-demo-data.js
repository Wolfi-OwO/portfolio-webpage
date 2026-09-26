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

// Every filler this script can run, in the order the plain (no-flag) run has
// always used. `name` is what `--only=` matches against; `label` is what
// logResults() has always printed — kept separate so filtering can't change
// the log output of the default run.
//
// Usage: `node src/database/fill-demo-data.js` fills everything (and, as
// before, drops the database first). `node src/database/fill-demo-data.js
// --only=career` (comma-separated for more than one, e.g.
// `--only=career,availability`) fills only the named collection(s) and does
// NOT drop the database — that is the whole point of `--only`: seeding one
// collection (e.g. onto production, after a deploy) without touching
// anything else that's already live there (uptime history, projects, …).
const FILLERS = [
    { name: 'projects', label: 'Projects', fn: () => fillProjectsData() },
    { name: 'monitors', label: 'Monitors', fn: () => fillMonitorsData() },
    { name: 'services', label: 'Services', fn: () => fillServicesData() },
    { name: 'availability', label: 'Availability', fn: () => fillAvailabilityData() },
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
    { name: 'career', label: 'Career', fn: () => fillCareerData() },
];

fillDatabase();

// Shared cache for already created/found technologies
const allTechnologies = [];

function parseOnlyFlag(argv) {
    const flag = argv.find((arg) => arg.startsWith('--only='));

    if (!flag) {
        return null;
    }

    return flag
        .slice('--only='.length)
        .split(',')
        .map((name) => name.trim())
        .filter(Boolean);
}

async function fillDatabase() {
    const only = parseOnlyFlag(process.argv.slice(2));

    if (only) {
        const validNames = FILLERS.map((filler) => filler.name);
        const unknown = only.filter((name) => !validNames.includes(name));

        if (unknown.length > 0) {
            logger.error(
                `Unknown --only value(s): ${unknown.join(', ')}. Valid values: ${validNames.join(', ')}`,
            );
            process.exit(1);
        }
    }

    const fillersToRun = only ? FILLERS.filter((filler) => only.includes(filler.name)) : FILLERS;

    // Only the full, unfiltered run recreates the database. A `--only` run
    // exists specifically to touch one collection without disturbing the
    // rest, so it must never drop the database out from under them.
    await setupDatabaseConnection(MONGODB_CONNECTION_STRING, !only);

    logger.info(
        only
            ? `Starting filling database with demo data (only: ${only.join(', ')})...`
            : 'Starting filling database with demo data...',
    );

    for (const { label, fn } of fillersToRun) {
        await logResults(label, fn);
    }

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

// None of these fillers used to check for existing data before inserting, so
// running any of them a second time (e.g. re-running the full script, or a
// future `--only` run against a collection that's already seeded) silently
// duplicated every row. `--only` now makes running a single filler in
// isolation a normal, repeatable operation, so each one guards itself with
// the same count-first pattern rather than relying on the caller to know.
function skippedResult() {
    return { successCnt: 0, errorCnt: 0, errorObjects: [] };
}

async function fillProjectsData() {
    const existingCount = await ProjectModel.countDocuments();

    if (existingCount > 0) {
        logger.info(`Projects - Already seeded (${existingCount} found), skipping.`);
        return skippedResult();
    }

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
    const existingCount = await ServiceModel.countDocuments();

    if (existingCount > 0) {
        logger.info(`Services - Already seeded (${existingCount} found), skipping.`);
        return skippedResult();
    }

    const allServices = JSON.parse(
        await fsp.readFile(path.join(DATA_DIR, 'services.json'), 'utf-8'),
    );

    return processDocuments(allServices, ServiceModel.create.bind(ServiceModel));
}

async function fillAvailabilityData() {
    // Scoped to track: 'availability' — the Availability collection also
    // holds career-track rows, and seeding one track must never be blocked
    // (or think itself already done) because of rows the other track wrote.
    const existingCount = await AvailabilityModel.countDocuments({ track: 'availability' });

    if (existingCount > 0) {
        logger.info(`Availability - Already seeded (${existingCount} found), skipping.`);
        return skippedResult();
    }

    const allEntries = JSON.parse(
        await fsp.readFile(path.join(DATA_DIR, 'availability.json'), 'utf-8'),
    );

    return processDocuments(allEntries, AvailabilityModel.create.bind(AvailabilityModel));
}

async function fillCareerData() {
    const existingCount = await AvailabilityModel.countDocuments({ track: 'career' });

    if (existingCount > 0) {
        logger.info(`Career - Already seeded (${existingCount} found), skipping.`);
        return skippedResult();
    }

    const allEntries = JSON.parse(await fsp.readFile(path.join(DATA_DIR, 'career.json'), 'utf-8'));

    return processDocuments(allEntries, AvailabilityModel.create.bind(AvailabilityModel));
}

async function fillMonitorsData() {
    const existingCount = await MonitorModel.countDocuments();

    if (existingCount > 0) {
        logger.info(`Monitors - Already seeded (${existingCount} found), skipping.`);
        return skippedResult();
    }

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
