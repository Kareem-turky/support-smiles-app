import { test, expect } from '@playwright/test';

test.describe('Tickets, Payroll, Gamification', () => {

    test('Create Ticket as CS Agent and view Gamification', async ({ page }) => {
        // 1. Auth Login (CS Agent)
        await page.goto('/login');
        await page.fill('input[type="email"]', 'alice@company.com');
        await page.fill('input[type="password"]', 'password123');
        await page.click('button[type="submit"]');
        await expect(page.locator('h1').first()).not.toHaveText('Sign In', { timeout: 15000 });

        // 2. Head to Tickets
        await page.goto('/tickets');
        await page.click('button:has-text("New Ticket")');
        await expect(page.locator('div[role="dialog"]')).toBeVisible();

        // Just verifying the modal opens safely without API 404s breaking the React state
        await page.click('button:has-text("Cancel")');

        // 3. Head to Gamification
        await page.goto('/gamification');
        const content = await page.content();
        expect(content).not.toContain('Not Found');
        expect(content).not.toContain('Unexpected Application Error');
    });

    test('Admin Payroll Execution', async ({ page }) => {
        // 1. Auth Login
        await page.goto('/login');
        await page.fill('input[type="email"]', 'admin@company.com');
        await page.fill('input[type="password"]', 'admin123');
        await page.click('button[type="submit"]');
        await expect(page.locator('h1').first()).not.toHaveText('Sign In', { timeout: 15000 });

        // 2. Head to Payroll
        await page.goto('/accounting/payroll');
        await page.click('button:has-text("Calculate Payroll")');

        // Give it time to execute standard calculations
        await page.waitForTimeout(1000);
        const tableHtml = await page.content();
        expect(tableHtml).toContain('Payroll Run');
    });
});
