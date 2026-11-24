/* ***************** IMPORT packages *********************** */
import assert from 'assert';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {
    parsePublicPath,
    applyToTemplate,
    renderBody,
    jsonLdScript,
    localize,
} from '../src/seo/render.js';
import { PUBLIC_ROUTES, META } from '../src/seo/pages.js';

/* ***************** DECLARE testfunctions *********************** */
// The real source template, so a change to client/index.html that breaks a replacement fails here
// instead of silently sending the home page's tags on every route.
const template = readFileSync(
    path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'client', 'index.html'),
    'utf8',
);

describe('parsePublicPath', function () {
    it('reads language and route from the address', function () {
        assert.deepStrictEqual(parsePublicPath('/'), { locale: 'en', route: '/' });
        assert.deepStrictEqual(parsePublicPath('/de'), { locale: 'de', route: '/' });
        assert.deepStrictEqual(parsePublicPath('/de/services/'), {
            locale: 'de',
            route: '/services',
        });
        assert.deepStrictEqual(parsePublicPath('/career'), { locale: 'en', route: '/career' });
    });
    it('does not treat private or unknown paths as public pages', function () {
        for (const p of [
            '/secret',
            '/de/secret',
            '/admin/login',
            '/de/admin/login',
            '/nope',
            '/de/nope',
        ]) {
            assert.strictEqual(parsePublicPath(p), null, p);
        }
    });
    it('has German and English text for every public route', function () {
        for (const route of PUBLIC_ROUTES) {
            assert.ok(META[route].en.title && META[route].de.title, route);
            assert.ok(META[route].en.description && META[route].de.description, route);
        }
    });
});

describe('applyToTemplate', function () {
    it('gives a German page its own title, description, canonical and language', function () {
        const html = applyToTemplate(template, { route: '/services', locale: 'de' });
        assert.match(html, /<html lang="de"/);
        assert.match(
            html,
            /<title>Website erstellen lassen: Leistungen und Preise - Woofi Developments<\/title>/,
        );
        assert.match(
            html,
            /rel="canonical"\s+href="https:\/\/www\.woofi-developments\.at\/de\/services"/,
        );
        assert.match(
            html,
            /property="og:url"[^>]*content="https:\/\/www\.woofi-developments\.at\/de\/services"/,
        );
        assert.match(html, /name="description"[^>]*content="Websites, Webanwendungen/);
        assert.match(html, /name="twitter:title"[^>]*content="Website erstellen lassen/);
    });
    it('lists both languages as alternates', function () {
        const html = applyToTemplate(template, { route: '/career', locale: 'en' });
        assert.match(html, /hreflang="en" href="https:\/\/www\.woofi-developments\.at\/career"/);
        assert.match(
            html,
            /hreflang="de" href="https:\/\/www\.woofi-developments\.at\/de\/career"/,
        );
        assert.match(
            html,
            /hreflang="x-default" href="https:\/\/www\.woofi-developments\.at\/career"/,
        );
    });
    it('puts the snapshot inside #root, once', function () {
        const html = applyToTemplate(template, {
            route: '/',
            locale: 'en',
            snapshot: '<h1>Hi</h1>',
        });
        assert.strictEqual((html.match(/<h1>Hi<\/h1>/g) ?? []).length, 1);
        assert.match(html, /<div id="root"><div data-prerender[^>]*><h1>Hi<\/h1><\/div><\/div>/);
    });
});

describe('renderBody', function () {
    const services = [
        {
            title: 'Website',
            description: 'Eine schnelle <b>Website</b>',
            deliverables: ['Design', 'Deployment'],
            priceFrom: 600,
            hourlyRate: 30,
            duration: '1–3 Wochen',
        },
    ];
    it('writes services with prices in the page language and escapes the text', function () {
        const de = renderBody('/services', 'de', { services });
        assert.match(de, /<h1>Leistungen<\/h1>/);
        assert.match(de, /ab 600\s€/);
        assert.match(de, /&lt;b&gt;Website&lt;\/b&gt;/);
        assert.ok(!de.includes('<b>'));
        const en = renderBody('/services', 'en', { services });
        assert.match(en, /starting at €600/);
    });
    it('has no body for pages whose text lives only in the app', function () {
        assert.strictEqual(renderBody('/impressum', 'de', {}), '');
    });
    it('features three projects on the home page', function () {
        const projects = ['Metrion', 'NetViz', 'Nutrilens', 'Burrow'].map((title) => ({
            title,
            description: `${title} text`,
        }));
        const html = renderBody('/', 'en', { projects });
        assert.match(html, /Metrion text/);
        assert.ok(!html.includes('Burrow text'));
    });
});

describe('jsonLdScript and localize', function () {
    it('cannot be closed early by a "<" in the data', function () {
        const script = jsonLdScript({ name: '</script><script>alert(1)</script>' });
        assert.strictEqual((script.match(/<\/script>/g) ?? []).length, 1);
    });
    it('applies a translation and keeps the other fields', function () {
        const item = {
            title: 'Webanwendung',
            priceFrom: 1200,
            translations: { en: { title: 'Web application' } },
        };
        assert.strictEqual(localize(item, 'en').title, 'Web application');
        assert.strictEqual(localize(item, 'en').priceFrom, 1200);
        assert.strictEqual(localize(item, 'de').title, 'Webanwendung');
    });
});

describe('case studies', function () {
    it('are public pages in both languages, each with its own title', function () {
        for (const slug of ['burrow', 'netviz', 'metrion']) {
            const route = `/case-studies/${slug}`;
            assert.ok(PUBLIC_ROUTES.includes(route));
            assert.deepStrictEqual(parsePublicPath(`/de${route}`), { locale: 'de', route });
            assert.ok(META[route].en.title.includes('Case Study'));
            assert.ok(META[route].de.title.includes('Fallstudie'));
        }
    });

    it('write the problem and every decision into the page text, in the right language', function () {
        const en = renderBody('/case-studies/burrow', 'en', {});
        assert.ok(en.includes('<h1>Burrow: '));
        assert.ok(en.includes('The problem'));
        assert.strictEqual((en.match(/<h3>/g) ?? []).length, 5);
        const de = renderBody('/case-studies/netviz', 'de', {});
        assert.ok(de.includes('Das Problem'));
        assert.ok(de.includes('Server-Sent Events'));
    });

    it('list all three on the index', function () {
        const html = renderBody('/case-studies', 'en', {});
        for (const name of ['Burrow', 'NetViz', 'Metrion']) assert.ok(html.includes(name));
    });
});
