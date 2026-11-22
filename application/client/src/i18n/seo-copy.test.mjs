import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import de from './messages/de.js';
import { COPY } from '../../../server/src/seo/pages.js';

// The server writes each page's headline and lead into the HTML before the app starts (server/src/seo/pages.js).
// Those words repeat what the pages say; this fails when one side is edited and the other is not.
const plain = (text) =>
    text
        .replace(/<\/?em>/g, '')
        .replace(/\s+/g, ' ')
        .trim();
const read = (file) => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');

// The English text is the defaultMessage next to the message id in the page source.
function english(file, id) {
    const src = read(file);
    const at = src.indexOf(`id="${id}"`);
    assert.ok(at >= 0, `${id} not found in ${file}`);
    const m = /defaultMessage="([^"]*)"/.exec(src.slice(at, at + 400));
    assert.ok(m, `no defaultMessage after ${id} in ${file}`);
    return plain(m[1]);
}

const PAGES = [
    ['home', 'pages/homepage/homepage.jsx', 'homepage.headline', null],
    [
        'services',
        'pages/services-page/services-page.jsx',
        'services.page.headline',
        'services.page.lead',
    ],
    ['projects', 'pages/projects-page/projects-page.jsx', 'projects.headline', null],
    ['career', 'pages/career-page/career-page.jsx', 'career.page.headline', null],
];

for (const [kind, file, h1Id, leadId] of PAGES) {
    test(`${kind}: the headline the server sends is the headline the page shows`, () => {
        assert.equal(COPY[kind].de.h1, plain(de[h1Id]));
        assert.equal(COPY[kind].en.h1, english(file, h1Id));
    });
    if (leadId) {
        test(`${kind}: the lead text matches`, () => {
            assert.equal(COPY[kind].de.lead, plain(de[leadId]));
            assert.equal(COPY[kind].en.lead, english(file, leadId));
        });
    }
}
