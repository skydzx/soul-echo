
import { test } from '@playwright/test';
import { expect } from '@playwright/test';

test('TestSoulEcho_2026-02-04', async ({ page, context }) => {
  
    // Navigate to URL
    await page.goto('http://localhost:5173');

    // Click element
    await page.click('a[href="/login"]');

    // Take screenshot
    await page.screenshot({ path: 'login_page.png' });

    // Navigate to URL
    await page.goto('http://localhost:5173/create');

    // Take screenshot
    await page.screenshot({ path: 'redirect_to_login.png' });
});