const puppeteer = require("puppeteer-extra");
const puppeteerCore = require("puppeteer-core");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

puppeteer.puppeteer = puppeteerCore;
puppeteer.use(StealthPlugin());

async function testChrome() {
    try {
        console.log('🔍 Testing Chrome availability...');
        
        // Try to find Chrome on Windows
        const possiblePaths = [
            'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
            'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
            process.env.CHROME_PATH,
            process.env.PUPPETEER_EXECUTABLE_PATH
        ];
        
        console.log('Possible Chrome paths:');
        possiblePaths.forEach(path => {
            if (path) console.log(`  - ${path}`);
        });
        
        // Try to launch with default settings
        console.log('\n🚀 Attempting to launch Chrome...');
        const browser = await puppeteer.launch({ 
            headless: "new",
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu',
                '--window-size=1920x1080'
            ]
        });
        
        console.log('✅ Chrome launched successfully!');
        
        const page = await browser.newPage();
        await page.goto('https://www.google.com');
        console.log('✅ Successfully navigated to Google');
        
        await browser.close();
        console.log('✅ Browser closed successfully');
        
    } catch (error) {
        console.error('❌ Error launching Chrome:', error.message);
        console.log('\n💡 Solutions:');
        console.log('1. Install Google Chrome');
        console.log('2. Set CHROME_PATH environment variable to Chrome executable');
        console.log('3. Set PUPPETEER_EXECUTABLE_PATH environment variable');
    }
}

testChrome(); 