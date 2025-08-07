require('dotenv').config();
const mongoose = require('mongoose');
const { ROUND_TO_RACE } = require('../src/constants/roundMapping');
const RaceResult = require('../src/models/RaceResult');
const { runScraper } = require('../src/scrapers/motorsportScraper');

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fantasy-f1';
mongoose.connect(MONGODB_URI);

async function testHungarianGPScraping() {
    try {
        console.log('🔍 Testing Hungarian GP scraping with updated slug...\n');
        
        // Check current state
        const existingRace = await RaceResult.findOne({ round: 14 });
        console.log('📊 Current Hungarian GP state:');
        console.log(`   Status: ${existingRace?.status || 'Not found'}`);
        console.log(`   Results count: ${existingRace?.results?.length || 0}`);
        console.log(`   Team results count: ${existingRace?.teamResults?.length || 0}`);
        
        // Run the scraper
        console.log('\n🏎 Running scraper...');
        await runScraper();
        
        // Check updated state
        console.log('\n📊 Updated Hungarian GP state:');
        const updatedRace = await RaceResult.findOne({ round: 14 });
        if (updatedRace) {
            console.log(`   Status: ${updatedRace.status}`);
            console.log(`   Results count: ${updatedRace.results?.length || 0}`);
            console.log(`   Team results count: ${updatedRace.teamResults?.length || 0}`);
            console.log(`   Sprint results count: ${updatedRace.sprintResults?.length || 0}`);
            
            if (updatedRace.results && updatedRace.results.length > 0) {
                console.log('\n🏆 Race results found!');
                console.log('Top 3 finishers:');
                updatedRace.results.slice(0, 3).forEach((result, index) => {
                    console.log(`   ${index + 1}. ${result.driver} (${result.team}) - ${result.points} points`);
                });
            } else {
                console.log('\n❌ No race results found');
            }
        } else {
            console.log('❌ Race not found in database');
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

testHungarianGPScraping(); 