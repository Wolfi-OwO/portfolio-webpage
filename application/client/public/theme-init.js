// Runs before first paint. External on purpose: the site's CSP is script-src 'self' with no
// 'unsafe-inline', so an inline version of this script was blocked and every reload flashed white.
(function () {
    try {
        var theme = localStorage.getItem('theme') || 'system';
        var systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        var isDark = theme === 'dark' || (theme === 'system' && systemDark);
        document.documentElement.classList.toggle('dark', isDark);
        // The saved look (Cobalt + fine-tune) is only computed once the bundle runs, so
        // its resolved colours are cached per mode and painted here, before the first
        // frame. Without this the page flashed the old base colours on every reload.
        var tokens = JSON.parse(localStorage.getItem('look.tokens') || '{}')[
            isDark ? 'dark' : 'light'
        ];
        for (var k in tokens) document.documentElement.style.setProperty(k, tokens[k]);
        if (tokens) document.documentElement.style.backgroundColor = tokens['--bg'];
    } catch (e) {
        // Storage blocked (private browsing, disabled cookies, etc.) — fall
        // back to system preference so the page still themes correctly.
        document.documentElement.classList.toggle(
            'dark',
            window.matchMedia('(prefers-color-scheme: dark)').matches,
        );
    }
})();
