import { chromium } from 'playwright';

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();

    console.log("Navigating to login...");
    await page.goto('http://localhost:8083/login');

    // Login as Admin
    await page.fill('input[type="email"]', 'admin@company.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(2000);

    console.log("Taking screenshot of dashboard sidebar...");
    await page.screenshot({ path: 'audit_sidebar_admin.png' });

    const sidebarText = await page.innerText('nav');
    console.log("Sidebar Items:");
    console.log(sidebarText);

    // Check if Orders is present
    if (sidebarText.includes('Orders')) {
        console.error("ERROR: Orders tab is still present!");
    } else {
        console.log("SUCCESS: Orders tab is not present.");
    }

    // Check for KPI tabs
    if (sidebarText.includes('My KPIs') && sidebarText.includes('Team KPIs')) {
        console.log("SUCCESS: KPI tabs are present.");
    } else {
        console.error("ERROR: KPI tabs are missing!");
    }

    // Check for Gamification
    if (sidebarText.includes('Gamification')) {
        console.log("SUCCESS: Gamification tab is present.");
    } else {
        console.error("ERROR: Gamification tab is missing!");
    }

    await browser.close();
})();
