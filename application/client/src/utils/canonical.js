// The site is a client-routed SPA: index.html is served for every path and
// carries a canonical pointing at the homepage. Left alone, that tells Google
// that /career, /services and every other route are duplicates of "/", which
// is why they sat at "Discovered/Crawled - currently not indexed" in Search
// Console. Each route has to declare itself as its own canonical.
export const SITE_ORIGIN = 'https://www.woofi-developments.at';

export function canonicalUrl(pathname) {
    const path = typeof pathname === 'string' && pathname.startsWith('/') ? pathname : '/';
    // One URL per page: "/career/" and "/career" must not be two canonicals.
    const trimmed = path.length > 1 ? path.replace(/\/+$/, '') : path;
    return `${SITE_ORIGIN}${trimmed || '/'}`;
}
