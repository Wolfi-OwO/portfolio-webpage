import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { AvailabilityModel } from '../models/availability.js';
import { AttachmentModel } from '../models/attachment.js';
import { logger } from './logger.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const THESIS = path.join(
    here,
    '..',
    '..',
    '..',
    'client',
    'dist',
    'documents',
    'Kofler-Phillip_Diplomarbeit.pdf',
);
const NAME = 'Diplomarbeit (PDF, Deutsch)';

// The thesis belongs to the HTL Villach diploma entry as an ordinary attachment, so it is listed and opened like any
// other. The PDF ships inside the client build; this copies it into the database once. An entry that already has
// attachments is left alone, so whatever the admin keeps or removes afterwards is never undone on a restart.
async function seedThesisAttachment() {
    try {
        const entry = await AvailabilityModel.findOne({
            organisation: 'HTL Villach',
            title: /^Reife- und Diplomprüfung/,
        }).select('_id');
        if (!entry) return;
        if (await AttachmentModel.exists({ entry: entry._id })) return;
        const data = await fs.readFile(THESIS);
        await AttachmentModel.create({
            entry: entry._id,
            name: NAME,
            mime: 'application/pdf',
            size: data.length,
            data,
        });
        logger.info('DB - Attached the diploma thesis to the HTL Villach entry.');
    } catch (err) {
        logger.error('DB - Could not attach the diploma thesis: ', err);
    }
}

export { seedThesisAttachment };
