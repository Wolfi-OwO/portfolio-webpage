import { useEffect } from 'react';

import { canonicalUrl } from '../utils/canonical.js';

const SITE_NAME = 'Woofi Developments';

// Client-side routing means index.html's static <title>/description would
// otherwise apply to every route; this keeps each page's title and meta
// description accurate for search results and browser tabs.
export function usePageMeta(title, description) {
    useEffect(() => {
        document.title = title ? `${title} - ${SITE_NAME}` : SITE_NAME;

        const canonical = document.querySelector('link[rel="canonical"]');
        if (canonical) canonical.setAttribute('href', canonicalUrl(window.location.pathname));

        if (description) {
            const meta = document.querySelector('meta[name="description"]');
            if (meta) meta.setAttribute('content', description);
        }
    }, [title, description]);
}
