import { test, expect } from '@playwright/test';

test.describe('Vendor Visibility E2E', () => {
    test('creates a vendor and it becomes visible immediately', async ({ page }) => {
        // 1) Login admin
        await page.goto('/login');
        await page.fill('input[type="email"]', 'admin@company.com');
        await page.fill('input[type="password"]', 'admin123');
        await page.click('button:has-text("Sign In")');
        await expect(page.locator('h1').first()).not.toHaveText('Sign In', { timeout: 15000 });

        // 2) Go to Vendors page
        await page.goto('/accounting/vendors');
        await expect(page.locator('h1', { hasText: 'Vendors' })).toBeVisible();

        // 3) Create vendor
        const uniqueName = `E2E-VENDOR-${Date.now()}`;
        await page.click('button:has-text("Add Vendor")');

        await expect(page.locator('div[role="dialog"]')).toBeVisible();

        const inputs = page.locator('div[role="dialog"] input');
        await inputs.nth(0).fill(uniqueName);
        await inputs.nth(1).fill('01000000000');

        await page.click('div[role="dialog"] button:has-text("Save")');
        await expect(page.locator('div[role="dialog"]')).not.toBeVisible();

        // 4) Expect vendor row visible
        await expect(page.locator('td', { hasText: uniqueName }).first()).toBeVisible({ timeout: 5000 });
    });
});
