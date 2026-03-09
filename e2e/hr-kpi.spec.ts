import { test, expect } from '@playwright/test';

test.describe('HR & KPI Role Scoping @kpi', () => {

    test('CS Manager can only see CS Employees in Team KPIs', async ({ page }) => {
        // 1. Auth Login
        await page.goto('/login');
        await page.fill('input[type="email"]', 'mike@company.com'); // CS_MANAGER
        await page.fill('input[type="password"]', 'password123');
        await page.click('button[type="submit"]');
        await expect(page.locator('h1').first()).not.toHaveText('Sign In', { timeout: 15000 });

        // 2. Head to Team KPIs
        await page.goto('/team-kpi');
        await expect(page.locator('h1').first()).toHaveText('Team Performance');

        // 3. Open Add Target Modal
        await page.click('button:has-text("Add Target")');
        await expect(page.locator('div[role="dialog"]')).toBeVisible();

        // 4. Click the ComboBox for Employee Selection
        await page.click('button[role="combobox"]');
        await page.waitForTimeout(500); // Wait for API fetch

        // 5. Assert WH Worker is NOT visible, but Alice Agent is
        const popoverContent = await page.textContent('div[role="listbox"], div[role="presentation"]');
        expect(popoverContent).not.toContain('William Worker');
        expect(popoverContent).toContain('Alice Agent');
        expect(popoverContent).toContain('Bob Agent');
    });

    test('WH Manager can only see WH Employees in Team KPIs', async ({ page }) => {
        // 1. Auth Login
        await page.goto('/login');
        await page.fill('input[type="email"]', 'wayne@company.com'); // WH_MANAGER
        await page.fill('input[type="password"]', 'password123');
        await page.click('button[type="submit"]');
        await expect(page.locator('h1').first()).not.toHaveText('Sign In', { timeout: 15000 });

        // 2. Head to Team KPIs
        await page.goto('/team-kpi');

        // 3. Open Add Target Modal
        await page.click('button:has-text("Add Target")');
        await expect(page.locator('div[role="dialog"]')).toBeVisible();

        // 4. Click the ComboBox
        await page.click('button[role="combobox"]');
        await page.waitForTimeout(500);

        // 5. Assert Alice Agent is NOT visible, but William Worker is
        const popoverContent = await page.textContent('div[role="listbox"], div[role="presentation"]');
        expect(popoverContent).not.toContain('Alice Agent');
        expect(popoverContent).toContain('William Worker');
    });

    test('Accounting flows', async ({ page }) => {
        // 1. Auth Login
        await page.goto('/login');
        await page.fill('input[type="email"]', 'sarah@company.com'); // ACC_MANAGER
        await page.fill('input[type="password"]', 'password123');
        await page.click('button[type="submit"]');
        await expect(page.locator('h1').first()).not.toHaveText('Sign In', { timeout: 15000 });

        // Go to Vendors
        await page.goto('/accounting/vendors');
        await page.click('button:has-text("Add Vendor")');
        const modalInputs = page.locator('div[role="dialog"] input');
        await modalInputs.nth(0).fill('QA Test Vendor');
        await modalInputs.nth(1).fill('1235557890');
        await page.click('button[type="submit"]:has-text("Save")');

        // The toast might show up
        await page.waitForTimeout(1000);
        const content = await page.content();
        expect(content).toContain('QA Test Vendor');
    });
});
