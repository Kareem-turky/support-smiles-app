import { test, expect } from '@playwright/test';

// Use standard auth flow as in other tests
test.describe('Granular Permissions System', () => {

  test('Admin user should have access to permissions management', async ({ page, request }) => {
    // 1. Login as Admin
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@supportsmiles.com');
    await page.fill('input[type="password"]', 'admin123'); // Adjust to your actual seed password
    await page.click('button[type="submit"]');

    // 2. Wait for dashboard and navigation
    await page.waitForURL('/');

    // 3. Admin should see Permissions link
    const permissionsLink = page.getByRole('link', { name: /permissions/i });
    await expect(permissionsLink).toBeVisible();

    // 4. Navigate to Permissions Page
    await permissionsLink.click();
    await page.waitForURL('/admin/permissions');
    
    // 5. Verify page loaded correctly
    await expect(page.locator('h2', { hasText: 'Permissions Management' })).toBeVisible();
    await expect(page.locator('text=Users')).toBeVisible();
  });

});
