const { chromium } = require('playwright');
(async () => {
    try {
        const browser = await chromium.launch();
        const page = await browser.newPage();
        page.on('console', msg => console.log('BROWSER_CONSOLE:', msg.text()));
        page.on('pageerror', err => console.log('BROWSER_ERROR:', err.message));
        
        await page.goto('http://localhost:5173/login');
        await page.fill('input[type=email]', 'admin@bahrayyan.com');
        await page.fill('input[type=password]', '@Hugo123');
        await page.click('button[type=submit]');
        await page.waitForTimeout(4000);
        await browser.close();
    } catch(err) {
        console.error(err);
    }
})();
