require('dotenv').config();
const puppeteer = require("puppeteer-extra");
const puppeteerCore = require("puppeteer-core");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const fs = require('fs').promises;
const path = require('path');

puppeteer.puppeteer = puppeteerCore;
puppeteer.use(StealthPlugin());

async function testSlugDiscovery() {
    console.log('🔍 Testing slug discovery process...\n');
    
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
    
    const page = await browser.newPage();
    
    try {
        console.log('🌐 Navigating to Motorsport.com F1 results page...');
        await page.goto('https://www.motorsport.com/f1/results/2025/', {
            waitUntil: "networkidle2",
        });
        
        console.log('✅ Page loaded successfully');
        
        // Test the slug extraction logic
        console.log('\n🔍 Extracting slugs from page...');
        const newSlugs = await page.evaluate(() => {
            const links = document.querySelectorAll("a[href*='/results/']");
            console.log(`Found ${links.length} links with '/results/' in href`);
            
            const slugMap = {};
            let processedCount = 0;
            
            links.forEach((link, index) => {
                const href = link.href;
                const match = href.match(/\/results\/\d{4}\/([a-z0-9\-]+)\//i);
                if (match) {
                    const slug = match[1];
                    const baseName = slug.split("-gp")[0];
                    slugMap[baseName] = slug;
                    processedCount++;
                    
                    // Log some examples
                    if (processedCount <= 10) {
                        console.log(`  ${index}: ${href} -> ${baseName}: ${slug}`);
                    }
                }
            });
            
            console.log(`Processed ${processedCount} valid slugs out of ${links.length} links`);
            return slugMap;
        });
        
        console.log('\n📋 Discovered slugs:');
        Object.entries(newSlugs).forEach(([name, slug]) => {
            console.log(`  ${name}: ${slug}`);
        });
        
        // Check specifically for Hungarian GP
        console.log('\n🇭🇺 Hungarian GP check:');
        if (newSlugs.hungarian) {
            console.log(`✅ Hungarian GP slug found: ${newSlugs.hungarian}`);
        } else {
            console.log('❌ Hungarian GP slug NOT found');
            
            // Let's search more specifically
            console.log('\n🔍 Searching more specifically for Hungarian GP...');
            const hungarianSearch = await page.evaluate(() => {
                const allLinks = Array.from(document.querySelectorAll('a'));
                const hungarianLinks = allLinks.filter(link => 
                    link.textContent.toLowerCase().includes('hungarian') ||
                    link.href.toLowerCase().includes('hungarian')
                );
                
                return hungarianLinks.map(link => ({
                    text: link.textContent.trim(),
                    href: link.href
                }));
            });
            
            console.log('Hungarian-related links found:');
            hungarianSearch.forEach((link, index) => {
                console.log(`  ${index + 1}: "${link.text}" -> ${link.href}`);
            });
        }
        
        // Check current slugs file
        console.log('\n📁 Current slugs file content:');
        const SLUGS_FILE = path.join(__dirname, '../src/data/motorsportSlugs.json');
        try {
            const currentData = await fs.readFile(SLUGS_FILE, 'utf8');
            const currentSlugs = JSON.parse(currentData);
            console.log('Current slugs in file:');
            Object.entries(currentSlugs).forEach(([name, slug]) => {
                console.log(`  ${name}: ${slug}`);
            });
        } catch (error) {
            console.log('❌ Could not read current slugs file:', error.message);
        }
        
    } catch (error) {
        console.error('❌ Error during slug discovery test:', error);
    } finally {
        await browser.close();
    }
}

testSlugDiscovery(); 