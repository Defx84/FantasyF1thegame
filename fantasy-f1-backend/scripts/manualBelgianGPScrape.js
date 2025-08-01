require('dotenv').config();
const mongoose = require('mongoose');
const { scrapeMotorsportResultsByType } = require('../src/scrapers/motorsportScraper');
const RaceResult = require('../src/models/RaceResult');

async function manualBelgianGPScrape() {
    try {
        console.log('🚀 Manual Belgian GP scraping...');
        
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fantasy-f1');
        console.log('✅ Connected to MongoDB');
        
        // Correct Belgian GP slug
        const BELGIAN_GP_SLUG = 'belgian-gp-653187';
        
        console.log('\n1️⃣ Scraping Belgian GP race results...');
        const raceData = await scrapeMotorsportResultsByType(BELGIAN_GP_SLUG, 'RACE');
        
        if (!raceData || !raceData.results || raceData.results.length === 0) {
            console.log('❌ No race results found');
            return;
        }
        
        const raceResults = raceData.results;
        console.log(`✅ Found ${raceResults.length} race results`);
        console.log('Top 5 results:');
        raceResults.slice(0, 5).forEach((result, index) => {
            console.log(`${index + 1}. ${result.position}. ${result.driver} (${result.team}) - ${result.points || 0} points`);
        });
        
        console.log('\n2️⃣ Scraping Belgian GP sprint results...');
        let sprintResults = null;
        try {
            const sprintData = await scrapeMotorsportResultsByType(BELGIAN_GP_SLUG, 'SPR');
            if (sprintData && sprintData.results && sprintData.results.length > 0) {
                sprintResults = sprintData.results;
                console.log(`✅ Found ${sprintResults.length} sprint results`);
            } else {
                console.log('ℹ️ No sprint results found');
            }
        } catch (error) {
            console.log('ℹ️ No sprint results available');
        }
        
        console.log('\n3️⃣ Saving results to database...');
        
        // Update the Belgian GP document
        const updateData = {
            results: raceResults,
            sprintResults: sprintResults || [],
            status: 'completed',
            lastUpdated: new Date()
        };
        
        const result = await RaceResult.updateOne(
            { round: 13 },
            { $set: updateData }
        );
        
        console.log(`✅ Updated Belgian GP: ${result.modifiedCount} document(s) modified`);
        
        // Verify the update
        const updatedRace = await RaceResult.findOne({ round: 13 });
        console.log('\n4️⃣ Verification:');
        console.log(`Results count: ${updatedRace.results?.length || 0}`);
        console.log(`Sprint results count: ${updatedRace.sprintResults?.length || 0}`);
        console.log(`Status: ${updatedRace.status}`);
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

// Run the script
manualBelgianGPScrape(); 