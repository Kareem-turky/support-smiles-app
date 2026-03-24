import { test, expect } from '@playwright/test';

const USERS = [
    { role: 'Admin', email: 'admin@company.com', password: 'admin123' },
    { role: 'Accounting', email: 'sarah@company.com', password: 'password123' },
    { role: 'HR', email: 'helen@company.com', password: 'password123' },
    { role: 'CS_MANAGER', email: 'mike@company.com', password: 'password123' },
    { role: 'WH_MANAGER', email: 'wayne@company.com', password: 'password123' },
];

for (const user of USERS) {
    test(`Login and Navigation SMOKE for ${user.role} @smoke`, async ({ page }) => {
        // 1. Auth Login
        await page.goto('/login');
        await page.fill('input[type="email"]', user.email);
        await page.fill('input[type="password"]', user.password);
        await page.click('button[type="submit"]');

        // 2. Dashboard load wait
        await expect(page.locator('h1').first()).not.toHaveText('Sign In', { timeout: 15000 });

        // Check missing routes / 404s
        const text = await page.content();
        expect(text).not.toContain('404 Not Found');

        // 3. Navigate all visible sidebar links quickly
        const links = await page.locator('a[href^="/"]').all();
        const hrefs = new Set<string>();

        for (const link of links) {
            const href = await link.getAttribute('href');
            if (href && href !== '/login' && href !== '#') {
                hrefs.add(href);
            }
        }

        for (const href of hrefs) {
            await page.goto(href);
            await page.waitForLoadState('networkidle');
            const pageText = await page.content();
            if (pageText.includes('Unexpected Application Error')) {
                console.error(`Crash on ${href} for role ${user.role}`);
                throw new Error(`Crash on ${href} for role ${user.role}`);
            }
            expect(pageText).not.toContain('Not Found');
        }
    });
}
