import { test, expect } from '@playwright/test';

test.describe('Manager KPI Regression', () => {
  test('Manager can login, create a target, and see it in the list', async ({ page }) => {
    // 1. Login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'dina@fulfly.net');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // 2. Navigate to Team Performance
    // Wait for either dashboard content or a specific link
    await page.waitForSelector('text=Dashboard', { timeout: 10000 });
    
    // Some sidebars might have "Team" or "Team Performance"
    const teamLink = page.locator('a[href="/team-kpi"]');
    await teamLink.click();
    await page.waitForURL('/team-kpi');

    // 3. Create Target
    await page.click('button:has-text("Add Target")');
    
    // Select Employee (Mike Agent was created in previous steps)
    // The combobox might be complex, let's try direct clicks
    await page.click('button:has-text("Select Employee...")');
    await page.fill('input[placeholder*="Search employee"]', 'Mike Agent');
    await page.click('div[role="option"]:has-text("Mike Agent")');

    // Select Metric
    await page.click('button:has-text("Select a preset metric")');
    await page.click('div[role="option"]:has-text("QUALITY")');

    // Fill Target Value
    // targetForm.targetValue is in an input. 
    // Since there are multiple inputs, we use placeholder or label association
    await page.getByLabel('Target Value').fill('15');
    await page.getByLabel('Weight (%)').fill('20');

    // Save
    await page.click('button:has-text("Save")');

    // 4. Verify Visibility
    // Success toast should appear
    // Success toast should appear (use first() if there are multiple DOM nodes for accessibility)
    await expect(page.locator('text=Target created.').first()).toBeVisible();

    // The target should appear in the table
    // Fetch all rows and look for Mike Agent
    const targetRow = page.locator('tr').filter({ hasText: 'Mike Agent' }).filter({ hasText: 'QUALITY' });
    await expect(targetRow.first()).toBeVisible();
    await expect(targetRow.first()).toContainText('15');
  });
});
