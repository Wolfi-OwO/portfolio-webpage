import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { ServiceModel } from '../models/service.js';
import { ProjectModel } from '../models/project.js';
import { TechnologyModel } from '../models/technology.js';
import { AvailabilityModel } from '../models/availability.js';
import { logger } from '../utils/logger.js';
import {
    parsePublicPath,
    localize,
    jsonLdScript,
    businessJsonLd,
    renderBody,
    applyToTemplate,
} from './render.js';

// The same few records feed every page and both languages, so they are read once a minute, not once per
// request: crawlers and visitors together would otherwise turn every page view into four queries.
const DATA_TTL_MS = 60_000;
let cached = { at: 0, value: null };
let template = null;

async function loadData() {
    if (cached.value && Date.now() - cached.at < DATA_TTL_MS) return cached.value;
    const [services, projects, technologies, career] = await Promise.all([
        ServiceModel.find({ published: { $ne: false } })
            .sort({ order: 1 })
            .lean(),
        ProjectModel.find().lean(),
        TechnologyModel.find().lean(),
        AvailabilityModel.find({ track: 'career', published: true }).lean(),
    ]);
    const value = {
        services,
        projects,
        career,
        techNames: Object.fromEntries(technologies.map((t) => [String(t._id), t.tech])),
    };
    cached = { at: Date.now(), value };
    return value;
}

// Sends the index.html for a public page with its own title, description, canonical, hreflang links and
// text filled in. Returns false when the path is not one of those pages or anything fails, so the caller
// falls back to the plain file and the page still works, just without the pre-filled text.
async function servePublicPage(req, res, clientDist) {
    const page = parsePublicPath(req.path);
    if (!page) return false;
    try {
        template ??= await readFile(path.join(clientDist, 'index.html'), 'utf8');
        const data = await loadData();
        const { locale, route } = page;
        const localized = {
            services: data.services.map((s) => localize(s, locale)),
            projects: data.projects.map((p) => localize(p, locale)),
            career: data.career.map((e) => localize(e, locale)),
            techNames: data.techNames,
        };
        const extraHead =
            route === '/' || route === '/services'
                ? jsonLdScript(
                      businessJsonLd(route === '/services' ? localized.services : [], locale),
                  )
                : '';
        const html = applyToTemplate(template, {
            route,
            locale,
            snapshot: renderBody(route, locale, localized),
            extraHead,
        });
        // Same policy as the plain index.html: revalidate every time, so a deploy shows at once.
        res.set('Cache-Control', 'no-cache');
        res.status(200).type('html').send(html);
        return true;
    } catch (err) {
        logger.error('SEO - Could not prerender, serving the plain page: ', err);
        return false;
    }
}

export { servePublicPage };
