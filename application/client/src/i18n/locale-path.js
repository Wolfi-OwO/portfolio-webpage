// The language is part of the address: German pages live under /de, English keeps the
// unprefixed paths it always had, so no existing link or indexed URL changes. A language
// kept only in localStorage gave every visitor and crawler the same English page at the
// same address, which left the German site invisible to search engines.
export const LOCALES = ['en', 'de'];
export const DEFAULT_LOCALE = 'en';

export function localeFromPath(pathname) {
    return /^\/de(\/|$)/.test(pathname) ? 'de' : 'en';
}

// '/de/career' -> '/career'; '/de' -> '/'
export function stripLocale(pathname) {
    const rest = pathname.replace(/^\/de(?=\/|$)/, '');
    return rest === '' ? '/' : rest;
}

// withLocale('/career', 'de') -> '/de/career'; withLocale('/', 'de') -> '/de'
export function withLocale(path, locale) {
    if (locale !== 'de') return path;
    return path === '/' ? '/de' : `/de${path}`;
}

// Only app paths are prefixed. A hash or query stays attached to the path.
export function localizeTo(to, locale) {
    if (typeof to !== 'string' || !to.startsWith('/') || locale !== 'de') return to;
    const [pathAndQuery, hash] = to.split('#');
    const [path, query] = pathAndQuery.split('?');
    return `${withLocale(path, locale)}${query ? `?${query}` : ''}${hash ? `#${hash}` : ''}`;
}
