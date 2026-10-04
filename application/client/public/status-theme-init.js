// External because the CSP has no 'unsafe-inline' for scripts; follows the system theme (this page has no toggle).
document.documentElement.classList.toggle(
    'dark',
    window.matchMedia('(prefers-color-scheme: dark)').matches,
);
