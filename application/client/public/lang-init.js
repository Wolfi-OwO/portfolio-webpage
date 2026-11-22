// Runs before first paint, so a German-speaking visitor lands on /de without ever seeing the English page.
// External because the site's CSP is script-src 'self' (see theme-init.js).
//
// Rules, kept deliberately narrow:
// - Only an English public page is ever redirected, and only towards /de. Nothing on /de is redirected, so a
//   German link stays German for everyone, and a crawler can always reach every page in both languages.
// - An explicit choice made with the language switcher (saved as `locale`) wins over the browser setting.
// - Only the first language the browser lists counts: someone who lists English first wants English.
// - Search engines render with an English browser language, so they are never sent anywhere.
(function () {
    try {
        var path = location.pathname.replace(/\/+$/, '') || '/';
        if (/^\/de(\/|$)/.test(path)) return;
        var pages = [
            '/',
            '/projects',
            '/career',
            '/services',
            '/contact',
            '/privacy-policy',
            '/impressum',
        ];
        if (pages.indexOf(path) === -1) return;

        var saved = null;
        try {
            saved = localStorage.getItem('locale');
        } catch (e) {
            // storage can be blocked; fall back to the browser setting
        }
        var wantsGerman;
        if (saved === 'de' || saved === 'en') {
            wantsGerman = saved === 'de';
        } else {
            var langs =
                navigator.languages && navigator.languages.length
                    ? navigator.languages
                    : [navigator.language];
            wantsGerman = /^de(-|$)/i.test(langs[0] || '');
        }
        if (!wantsGerman) return;

        location.replace((path === '/' ? '/de' : '/de' + path) + location.search + location.hash);
    } catch (e) {
        // a failed redirect must never stop the page from loading
    }
})();
