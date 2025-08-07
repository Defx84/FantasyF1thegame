require('dotenv').config();
const { discoverMotorsportSlugs, loadSlugsFromFile, saveSlugsToFile } = require('../src/scrapers/motorsportScraper');

async function updateSlugs() {
    try {
        console.log('🔄 Updating slugs file...\n');
        
        // Load existing slugs
        console.log('📚 Loading existing slugs...');
        const existingSlugs = await loadSlugsFromFile();
        console.log(`Found ${Object.keys(existingSlugs).length} existing slugs`);
        
        // Discover new slugs
        console.log('\n🔍 Discovering new slugs...');
        const updatedSlugs = await discoverMotorsportSlugs(2025);
        
        console.log('\n📊 Comparison:');
        console.log(`   Existing slugs: ${Object.keys(existingSlugs).length}`);
        console.log(`   Updated slugs: ${Object.keys(updatedSlugs).length}`);
        
        // Show what's new
        const newSlugs = {};
        for (const [name, slug] of Object.entries(updatedSlugs)) {
            if (!existingSlugs[name] || existingSlugs[name] !== slug) {
                newSlugs[name] = slug;
            }
        }
        
        if (Object.keys(newSlugs).length > 0) {
            console.log('\n🆕 New/updated slugs found:');
            Object.entries(newSlugs).forEach(([name, slug]) => {
                console.log(`   ${name}: ${slug}`);
            });
            
            // Save the updated slugs
            console.log('\n💾 Saving updated slugs to file...');
            await saveSlugsToFile(updatedSlugs);
            console.log('✅ Slugs file updated successfully!');
        } else {
            console.log('\nℹ️ No new slugs found');
        }
        
        // Verify Hungarian GP is now included
        console.log('\n🇭🇺 Verifying Hungarian GP slug:');
        if (updatedSlugs.hungarian) {
            console.log(`✅ Hungarian GP slug: ${updatedSlugs.hungarian}`);
        } else {
            console.log('❌ Hungarian GP slug still missing!');
        }
        
    } catch (error) {
        console.error('❌ Error updating slugs:', error);
    }
}

updateSlugs(); 