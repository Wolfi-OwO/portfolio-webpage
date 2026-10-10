import { expect, test } from '@playwright/test';

// Every page on every phone profile: nothing may be wider than the screen, the menu must work,
// the footer must stay compact and the technology strip must keep moving.
const PAGES = [
    '/',
    '/projects',
    '/career',
    '/services',
    '/personal',
    '/contact',
    '/privacy-policy',
    '/impressum',
];

test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
        localStorage.setItem('theme', 'dark');
        sessionStorage.setItem('boot-seen', '1');
    });
});

for (const path of PAGES) {
    test(`no horizontal overflow on ${path}`, async ({ page }) => {
        await page.goto(path, { waitUntil: 'networkidle' });
        const { inner, doc } = await page.evaluate(() => ({
            inner: innerWidth,
            doc: document.documentElement.scrollWidth,
        }));
        expect(doc, `document is ${doc}px wide in a ${inner}px viewport`).toBeLessThanOrEqual(
            inner,
        );
    });
}

test('slide-in menu opens, navigates and closes', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    const burger = page.getByRole('button', { name: 'Menu' });
    await expect(burger).toBeVisible();
    await burger.click();
    const menu = page.locator('#mobile-menu');
    await expect(menu).toBeInViewport();
    await menu.getByRole('link', { name: 'Services' }).click();
    await expect(page).toHaveURL(/\/services$/);
    await expect(menu).not.toBeInViewport();
});

test('menu closes on Escape', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Menu' }).click();
    await expect(page.locator('#mobile-menu')).toBeInViewport();
    await page.keyboard.press('Escape');
    await expect(page.locator('#mobile-menu')).not.toBeInViewport();
});

test('header links are replaced by the burger below md', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await expect(page.locator('header nav a', { hasText: 'Projects' })).toBeHidden();
});

test('footer is compact: links and copyright fit in two short rows', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    const h = await page.locator('footer').evaluate((el) => el.getBoundingClientRect().height);
    expect(h).toBeLessThan(140);
});

test('technology strip is a single line and moves', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    const track = page.locator('.marquee-track');
    await track.scrollIntoViewIfNeeded();
    const x0 = await track.evaluate((el) => el.getBoundingClientRect().x);
    await page.waitForTimeout(1200);
    const x1 = await track.evaluate((el) => el.getBoundingClientRect().x);
    expect(x1).toBeGreaterThan(x0);
    const rows = await page
        .locator('.marquee .marquee-set')
        .first()
        .evaluate((el) => new Set([...el.children].map((c) => c.getBoundingClientRect().top)).size);
    expect(rows).toBe(1);
});

test('hero portrait stays round and fits the screen', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    const box = await page.locator('.portrait').boundingBox();
    expect(Math.abs(box.width - box.height)).toBeLessThan(2);
    expect(box.width).toBeLessThanOrEqual(page.viewportSize().width);
});

test('reload keeps the saved dark colours from the first frame', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.reload({ waitUntil: 'commit' });
    const bg = await page.evaluate(() =>
        getComputedStyle(document.documentElement).getPropertyValue('--bg').trim(),
    );
    expect(bg).toMatch(/^#0/);
});
