import { CASE_STUDY_ROUTES } from './seo/case-studies.js';

// Mirrors the paths defined in client/src/routes.jsx. Keep in sync if a route is added or removed there.
const CLIENT_PAGES = [
    '/projects',
    '/career',
    '/services',
    '/contact',
    '/privacy-policy',
    '/impressum',
    '/admin/login',
    '/admin/passkeys',
    '/secret',
    '/case-studies',
    ...CASE_STUDY_ROUTES,
];
// The German site lives under /de and mirrors every page.
export const KNOWN_CLIENT_ROUTES = new Set([
    '/',
    '/de',
    ...CLIENT_PAGES,
    ...CLIENT_PAGES.map((p) => `/de${p}`),
]);
