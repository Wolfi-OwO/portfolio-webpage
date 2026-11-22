import { useEffect } from 'react';

import { canonicalUrl } from '../utils/canonical.js';
import { stripLocale, withLocale } from '../i18n/locale-path.js';

const SITE_NAME = 'Woofi Developments';

// Pages that exist in both languages. Each says where its twin is, so Google shows the German
// page to German searchers and the English page to everyone else instead of treating them as
// duplicates of each other. Private routes are left out on purpose.
const TRANSLATED = new Set([
    '/',
    '/projects',
    '/career',
    '/services',
    '/contact',
    '/privacy-policy',
    '/impressum',
]);

function setAlternates(pathname) {
    document.querySelectorAll('link[rel="alternate"][data-hreflang]').forEach((n) => n.remove());
    const base = stripLocale(pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname);
    if (!TRANSLATED.has(base)) return;
    const links = [
        ['en', canonicalUrl(base)],
        ['de', canonicalUrl(withLocale(base, 'de'))],
        ['x-default', canonicalUrl(base)],
    ];
    for (const [lang, href] of links) {
        const link = document.createElement('link');
        link.rel = 'alternate';
        link.hreflang = lang;
        link.href = href;
        link.dataset.hreflang = lang;
        document.head.appendChild(link);
    }
}

// Client-side routing means index.html's static <title>/description would
// otherwise apply to every route; this keeps each page's title and meta
// description accurate for search results and browser tabs.
export function usePageMeta(title, description) {
    useEffect(() => {
        document.title = title ? `${title} - ${SITE_NAME}` : SITE_NAME;

        const canonical = document.querySelector('link[rel="canonical"]');
        if (canonical) canonical.setAttribute('href', canonicalUrl(window.location.pathname));
        setAlternates(window.location.pathname);

        if (description) {
            const meta = document.querySelector('meta[name="description"]');
            if (meta) meta.setAttribute('content', description);
        }
    }, [title, description]);
}
