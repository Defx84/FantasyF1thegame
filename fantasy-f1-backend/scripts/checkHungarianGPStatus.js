require('dotenv').config();
const mongoose = require('mongoose');
const { ROUND_TO_RACE } = require('../src/constants/roundMapping');
const RaceResult = require('../src/models/RaceResult');
const { loadSlugsFromFile } = require('../src/scrapers/motorsportScraper');

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fantasy-f1';
mongoose.connect(MONGODB_URI);

async function checkHungarianGPStatus() {
    try {
        console.log('🔍 Checking Hungarian GP status...\n');
        
        const round = 14;
        const raceName = ROUND_TO_RACE[round].name;
        
        // Check current state
        const existingRace = await RaceResult.findOne({ round });
        console.log('📊 Current Hungarian GP state:');
        console.log(`   Round: ${round}`);
        console.log(`   Race name: ${raceName}`);
        console.log(`   Status: ${existingRace?.status || 'Not found'}`);
        console.log(`   Results array exists: ${!!existingRace?.results}`);
        console.log(`   Results length: ${existingRace?.results?.length || 0}`);
        console.log(`   Results content:`, existingRace?.results || 'N/A');
        console.log(`   Team results length: ${existingRace?.teamResults?.length || 0}`);
        console.log(`   Sprint results length: ${existingRace?.sprintResults?.length || 0}`);
        
        // Check shouldProcessRace logic
        console.log('\n🤔 Should Process Race Analysis:');
        
        const now = new Date();
        const raceDate = ROUND_TO_RACE[round].date;
        console.log(`   Current time: ${now.toISOString()}`);
        console.log(`   Race time: ${raceDate.toISOString()}`);
        console.log(`   Race is in past: ${raceDate < now}`);
        
        // Check if race already has data
        const hasResults = existingRace && existingRace.results && existingRace.results.length > 0;
        console.log(`   Has results in DB: ${hasResults ? 'YES (will skip)' : 'NO'}`);
        
        // Check if we have a valid slug
        const slugs = await loadSlugsFromFile();
        const hasSlug = !!slugs[raceName];
        console.log(`   Has valid slug: ${hasSlug ? 'YES' : 'NO (will skip)'}`);
        if (hasSlug) {
            console.log(`   Slug value: ${slugs[raceName]}`);
        }
        
        // Check if race is in the future
        const isFuture = raceDate > now;
        console.log(`   Is future race: ${isFuture ? 'YES (will skip)' : 'NO'}`);
        
        const shouldProcess = !hasResults && hasSlug && !isFuture;
        console.log(`   Should process: ${shouldProcess ? 'YES' : 'NO'}`);
        
        if (!shouldProcess) {
            console.log('\n❌ Reasons why race is not being processed:');
            if (hasResults) console.log('   - Race already has results in database');
            if (!hasSlug) console.log('   - No valid slug found for race');
            if (isFuture) console.log('   - Race is in the future');
        } else {
            console.log('\n✅ Race should be processed!');
        }
        
        // Check if the race was created as a future race
        if (existingRace && existingRace.status === 'scheduled' && existingRace.results.length === 0) {
            console.log('\n⚠️ This race was created as a future race but should now be processed!');
            console.log('   The scraper should pick it up on the next run.');
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

checkHungarianGPStatus(); 