import { ServiceModel } from '../models/service.js';
import { ProjectModel } from '../models/project.js';
import { AvailabilityModel } from '../models/availability.js';
import { SERVICES, PROJECTS, CAREER } from '../data/translations.js';
import { logger } from './logger.js';

// Adds the other-language text to records that were written in one language only. A record that already
// has `translations` is left alone, so a later edit through the API is never overwritten; to redo one,
// unset its `translations` and restart. Safe to run on every start: with nothing to add it writes nothing.
async function applyAll(model, entries) {
    let changed = 0;
    for (const { match, locale, fields } of entries) {
        const res = await model.updateMany(
            { ...match, translations: { $exists: false } },
            { $set: { translations: { [locale]: fields } } },
        );
        changed += res.modifiedCount ?? 0;
    }
    return changed;
}

async function backfillTranslations() {
    try {
        const services = await applyAll(ServiceModel, SERVICES);
        const projects = await applyAll(ProjectModel, PROJECTS);
        const career = await applyAll(AvailabilityModel, CAREER);
        if (services + projects + career > 0) {
            logger.info(
                `DB - Added translations: ${services} services, ${projects} projects, ${career} career entries.`,
            );
        }
    } catch (err) {
        logger.error('DB - Could not add translations: ', err);
    }
}

export { backfillTranslations };
