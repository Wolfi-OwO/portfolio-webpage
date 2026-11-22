import { SITE_NAME, ORIGIN, PUBLIC_ROUTES, META, COPY } from './pages.js';

// Pure functions, no database and no files: they turn a template, a route and some records into the HTML
// the server sends. seo/serve.js feeds them real data.

const esc = (value) =>
    String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

// '/de/career/' -> { locale: 'de', route: '/career' }. null when the path is not a public page.
function parsePublicPath(pathname) {
    const trimmed = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
    const locale = /^\/de(\/|$)/.test(trimmed) ? 'de' : 'en';
    const stripped = trimmed.replace(/^\/de(?=\/|$)/, '') || '/';
    return PUBLIC_ROUTES.includes(stripped) ? { locale, route: stripped } : null;
}

const urlFor = (route, locale) =>
    `${ORIGIN}${locale === 'de' ? (route === '/' ? '/de' : `/de${route}`) : route}`;

// Same shape as the client's localize(): a record keeps the language it was written in, and
// `translations.<locale>` carries the other one.
const localize = (item, locale) =>
    item?.translations?.[locale] ? { ...item, ...item.translations[locale] } : item;

function pageMeta(route, locale) {
    const { title, description } = META[route][locale];
    return { title: `${title} - ${SITE_NAME}`, description };
}

// JSON-LD sits inside a <script>, so a "<" in the data must not be able to close it.
const jsonLdScript = (data) =>
    `<script type="application/ld+json" data-prerender>${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;

function businessJsonLd(services, locale) {
    const data = {
        '@context': 'https://schema.org',
        '@type': 'ProfessionalService',
        name: SITE_NAME,
        url: ORIGIN,
        inLanguage: locale,
        address: {
            '@type': 'PostalAddress',
            addressLocality: 'Villach',
            addressRegion: 'Kärnten',
            addressCountry: 'AT',
        },
        areaServed: ['Kärnten', 'Österreich'],
    };
    if (services.length > 0) {
        data.hasOfferCatalog = {
            '@type': 'OfferCatalog',
            name: locale === 'de' ? 'Leistungen' : 'Services',
            itemListElement: services.map((s) => ({
                '@type': 'Offer',
                ...(s.priceFrom > 0
                    ? {
                          priceSpecification: {
                              '@type': 'PriceSpecification',
                              minPrice: s.priceFrom,
                              priceCurrency: 'EUR',
                          },
                      }
                    : {}),
                itemOffered: { '@type': 'Service', name: s.title, description: s.description },
            })),
        };
    }
    return data;
}

const money = (n, locale) =>
    new Intl.NumberFormat(locale === 'de' ? 'de' : 'en', {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 0,
    }).format(n);

const list = (items) =>
    items.length ? `<ul>${items.map((i) => `<li>${i}</li>`).join('')}</ul>` : '';

function projectItem(p, techNames) {
    const tech = (p.technologies ?? []).map((id) => techNames[String(id)]).filter(Boolean);
    return (
        `<article><h3>${esc(p.title)}</h3><p>${esc(p.description)}</p>` +
        (tech.length ? `<p>${esc(tech.join(', '))}</p>` : '') +
        '</article>'
    );
}

// The page's text as plain, semantic HTML. The app replaces it as soon as it starts, so a visitor never
// reads it twice; a crawler that does not run scripts, or runs them late, reads it first.
function renderBody(route, locale, data) {
    const { services = [], projects = [], career = [], techNames = {} } = data;
    const kind = {
        '/': 'home',
        '/services': 'services',
        '/projects': 'projects',
        '/career': 'career',
        '/contact': 'contact',
    }[route];
    if (!kind) return '';
    const copy = COPY[kind][locale];

    if (kind === 'home') {
        const featured = ['Metrion', 'NetViz', 'Nutrilens']
            .map((t) => projects.find((p) => p.title === t))
            .filter(Boolean);
        return (
            `<h1>${esc(copy.h1)}</h1><p>${esc(copy.role)}</p><p>${esc(copy.bio)}</p>` +
            `<h2>${esc(copy.selected)}</h2>${featured.map((p) => projectItem(p, techNames)).join('')}`
        );
    }
    if (kind === 'services') {
        const cards = services
            .map(
                (s) =>
                    `<article><h2>${esc(s.title)}</h2><p>${esc(s.description)}</p>` +
                    list((s.deliverables ?? []).map(esc)) +
                    `<p>${esc(s.priceFrom ? `${copy.from} ${money(s.priceFrom, locale)}` : copy.onRequest)}` +
                    `${s.hourlyRate ? `, ${esc(money(s.hourlyRate, locale))} / h` : ''}` +
                    `${s.duration ? `, ${esc(s.duration)}` : ''}</p></article>`,
            )
            .join('');
        return `<h1>${esc(copy.h1)}</h1><p>${esc(copy.lead)}</p>${cards}<p>${esc(copy.note)}</p>`;
    }
    if (kind === 'projects') {
        return `<h1>${esc(copy.h1)}</h1><p>${esc(copy.lead)}</p>${projects.map((p) => projectItem(p, techNames)).join('')}`;
    }
    if (kind === 'career') {
        const entry = (e) =>
            `<article><h3>${esc(e.title)}</h3><p>${esc(e.organisation)}${e.location ? `, ${esc(String(e.location).split(',')[0])}` : ''}</p>` +
            `${e.description ? `<p>${esc(e.description)}</p>` : ''}</article>`;
        const work = career.filter((e) => e.kind !== 'education');
        const school = career.filter((e) => e.kind === 'education');
        return (
            `<h1>${esc(copy.h1)}</h1><p>${esc(copy.lead)}</p>` +
            `<h2>${esc(copy.work)}</h2>${work.map(entry).join('')}` +
            `<h2>${esc(copy.education)}</h2>${school.map(entry).join('')}`
        );
    }
    return `<h1>${esc(copy.h1)}</h1><p>${esc(META[route][locale].description)}</p>`;
}

// Sets a <meta> tag's content whichever way round its attributes are written and however the tag is wrapped.
function setMeta(html, attr, value, content) {
    const re = new RegExp(`(<meta\\s[^>]*?${attr}="${value}"[^>]*?content=")[^"]*(")`);
    return re.test(html) ? html.replace(re, (_m, a, b) => `${a}${esc(content)}${b}`) : html;
}

// Fills the built index.html for one public page. `snapshot` is the page body, `extraHead` more head tags.
function applyToTemplate(template, { route, locale, snapshot = '', extraHead = '' }) {
    const { title, description } = pageMeta(route, locale);
    const canonical = urlFor(route, locale);
    let html = template
        .replace(/<html\s+lang="[^"]*"/, `<html lang="${locale}"`)
        .replace(/<title>[\s\S]*?<\/title>/, () => `<title>${esc(title)}</title>`)
        .replace(
            /(<link\s+rel="canonical"\s+href=")[^"]*(")/,
            (_m, a, b) => `${a}${canonical}${b}`,
        );
    html = setMeta(html, 'name', 'description', description);
    html = setMeta(html, 'property', 'og:url', canonical);
    html = setMeta(html, 'property', 'og:title', title);
    html = setMeta(html, 'property', 'og:description', description);
    html = setMeta(html, 'name', 'twitter:title', title);
    html = setMeta(html, 'name', 'twitter:description', description);

    const alternates = [
        ['en', urlFor(route, 'en')],
        ['de', urlFor(route, 'de')],
        ['x-default', urlFor(route, 'en')],
    ]
        .map(
            ([lang, href]) =>
                `<link rel="alternate" hreflang="${lang}" href="${href}" data-hreflang="${lang}" />`,
        )
        .join('\n        ');
    html = html.replace(
        '</head>',
        () => `        ${alternates}\n        ${extraHead}\n    </head>`,
    );

    // Visually hidden, not display:none: it is the same text the app shows a moment later, kept for
    // readers that never run the app (crawlers, screen readers before it starts) and gone once it mounts.
    const hidden =
        'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%)';
    return html.replace(
        '<div id="root"></div>',
        () => `<div id="root"><div data-prerender style="${hidden}">${snapshot}</div></div>`,
    );
}

export {
    esc,
    parsePublicPath,
    urlFor,
    localize,
    pageMeta,
    jsonLdScript,
    businessJsonLd,
    renderBody,
    applyToTemplate,
};
