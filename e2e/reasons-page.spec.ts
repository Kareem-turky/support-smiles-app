import { test, expect } from '@playwright/test';

test.describe('Reasons Page E2E', () => {
    test('reasons page renders without 404 for Admin', async ({ page }) => {
        // 1) Login admin
        await page.goto('/login');
        await page.fill('input[type="email"]', 'admin@company.com');
        await page.fill('input[type="password"]', 'admin123');
        await page.click('button:has-text("Sign In")');
        await page.waitForURL('**/dashboard**', { timeout: 15000 }).catch(() => null);
        await expect(page.locator('h1').first()).not.toHaveText('Sign In', { timeout: 15000 });

        // 2) Go directly to reasons page
        await page.goto('/admin/ticket-reasons');

        // 3) Expect page header visible + no 404 text
        await expect(page.locator('h2', { hasText: 'Ticket Reasons' })).toBeVisible({ timeout: 10000 });
        await expect(page.locator('text="Oops! Page not found"')).not.toBeVisible();
    });
});
