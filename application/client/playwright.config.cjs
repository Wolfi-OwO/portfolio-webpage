const { defineConfig, devices } = require('@playwright/test');

// Phone e2e: the app and API must already be running (npm run dev in client and server, with demo data).
// PW_CHROMIUM can point at an existing Chromium binary instead of the one Playwright downloads.
const executablePath = process.env.PW_CHROMIUM || undefined;
const names = [
    'iPhone 17 Pro Max',
    'iPhone 17',
    'iPhone 16e',
    'iPhone 15 Pro',
    'iPhone 13 Mini',
    'iPhone X',
    'iPhone SE',
    'iPhone 8 Plus',
    'Pixel 9 Pro XL',
    'Pixel 7',
    'Pixel 5',
    'Galaxy S24',
    'Galaxy S9+',
    'Galaxy Z Fold 7 Cover',
    'Pixel 10 Pro',
];

module.exports = defineConfig({
    testDir: './e2e',
    timeout: 30000,
    retries: 0,
    reporter: [['list']],
    use: { baseURL: process.env.E2E_BASE_URL || 'http://127.0.0.1:5173' },
    projects: names.map((name) => {
        // iOS descriptors default to WebKit; the same viewport, pixel ratio, touch and user agent run on Chromium.
        const { defaultBrowserType: _ignored, ...device } = devices[name];
        return { name, use: { ...device, launchOptions: { executablePath } } };
    }),
});
