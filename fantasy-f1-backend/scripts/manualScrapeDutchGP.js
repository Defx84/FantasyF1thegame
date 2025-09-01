require('dotenv').config();
const mongoose = require('mongoose');
const { runScraper, scrapeMotorsportResultsByType } = require('../src/scrapers/motorsportScraper');
const { loadSlugsFromFile } = require('../src/scrapers/motorsportScraper');
const RaceResult = require('../src/models/RaceResult');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fantasy-f1';

async function manualScrapeDutchGP() {
    try {
        console.log('🏎 Manually triggering scraper for Dutch GP...\n');
        
        // Connect to MongoDB
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');
        
        const round = 15;
        const raceName = 'dutch';
        
        // Load slugs
        console.log('📚 Loading slugs...');
        const slugs = await loadSlugsFromFile();
        const slug = slugs[raceName];
        
        if (!slug) {
            console.log('❌ No slug found for Dutch GP');
            console.log('Available slugs:', Object.keys(slugs));
            return;
        }
        
        console.log(`✅ Found slug for Dutch GP: ${slug}`);
        
        // Option 1: Run the full scraper (processes all races)
        console.log('\n🔄 Option 1: Running full scraper...');
        try {
            await runScraper();
            console.log('✅ Full scraper completed');
        } catch (error) {
            console.log('⚠️ Full scraper had issues:', error.message);
        }
        
        // Option 2: Scrape just the Dutch GP
        console.log('\n🏁 Option 2: Scraping just Dutch GP...');
        try {
            const raceResults = await scrapeMotorsportResultsByType(slug);
            if (raceResults && raceResults.length > 0) {
                console.log(`✅ Scraped ${raceResults.length} race results for Dutch GP`);
                
                // Update the race result in database
                const updateData = {
                    results: raceResults,
                    status: 'completed',
                    lastUpdated: new Date()
                };
                
                const updatedRace = await RaceResult.findOneAndUpdate(
                    { round },
                    { $set: updateData },
                    { new: true }
                );
                
                console.log(`✅ Updated Dutch GP in database with ${raceResults.length} results`);
                console.log(`   Status: ${updatedRace.status}`);
                console.log(`   Results count: ${updatedRace.results.length}`);
            } else {
                console.log('❌ No race results found for Dutch GP');
            }
        } catch (error) {
            console.log('❌ Error scraping Dutch GP:', error.message);
        }
        
        // Check final status
        console.log('\n📊 Final Dutch GP status:');
        const finalRace = await RaceResult.findOne({ round });
        if (finalRace) {
            console.log(`   Status: ${finalRace.status}`);
            console.log(`   Results: ${finalRace.results?.length || 0}`);
            console.log(`   Last updated: ${finalRace.lastUpdated}`);
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

// Run the script
manualScrapeDutchGP();


