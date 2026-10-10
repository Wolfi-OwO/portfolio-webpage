// Turns routes of the running client (npm run dev, port 5173, demo data) into static mockup pages with the colour picker.
// usage: node mockups/_tools/snapshot.mjs
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
const { chromium } = createRequire(new URL('../../application/client/package.json', import.meta.url))('playwright');
const OUT = new URL('../', import.meta.url).pathname;
const PAGES = [['home-v7', '/'], ['career-v7-a', '/career'], ['projects-v7', '/projects'], ['services-v7', '/services'], ['personal-v7', '/personal']];
const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || undefined });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await ctx.addInitScript(() => { localStorage.setItem('theme', 'dark'); sessionStorage.setItem('boot-seen', '1'); });
const page = await ctx.newPage();
for (const [name, url] of PAGES) {
  await page.goto('http://127.0.0.1:5173' + url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const r = await page.evaluate(() => {
    document.querySelectorAll('script,.toast').forEach((e) => e.remove());
    const css = [...document.querySelectorAll('style')].map((s) => s.textContent).join('\n').replace(/\/\*# sourceMappingURL[^*]*\*\//g, '');
    // The app shell is a viewport-tall column with a scrolling <main> from lg up. A static copy must scroll as a normal page.
    const main = document.querySelector('main');
    main.style.overflow = 'visible';
    for (let el = main.parentElement; el && el !== document.documentElement; el = el.parentElement) { el.style.height = 'auto'; el.style.minHeight = '100dvh'; el.style.overflow = 'visible'; }
    document.documentElement.style.height = 'auto'; document.body.style.height = 'auto'; document.body.style.overflow = 'auto';
    return { css, cls: document.documentElement.className, style: document.documentElement.getAttribute('style') || '', body: document.body.innerHTML };
  });
  const fix = (s) => s.replace(/(src|href)="\/(logos|shots|assets|profile-image\.jpg|favicon\.svg)/g, '$1="_shared/$2').replace(/url\(\/(logos|shots|assets)\//g, 'url(_shared/$1/');
  const html = `<!doctype html><html lang="en" data-palette="cobalt" data-theme="dark" data-contrast="low" class="${r.cls}" style='${r.style.replace(/'/g, '&#39;')}'><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Mockup · ${name}</title><style>${fix(r.css)}</style></head><body>${fix(r.body)}<script src="_shared/appearance.js"></script></body></html>`;
  writeFileSync(OUT + name + '.html', html);
  console.log(name, html.length);
}
await browser.close();
