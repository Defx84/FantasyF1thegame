require('dotenv').config();
const mongoose = require('mongoose');
const { ROUND_TO_RACE } = require('../src/constants/roundMapping');
const RaceResult = require('../src/models/RaceResult');
const fs = require('fs').promises;
const path = require('path');

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fantasy-f1';
mongoose.connect(MONGODB_URI);

async function debugHungarianGP() {
    try {
        console.log('🔍 Debugging Hungarian GP (Round 14) scraping issue...\n');
        
        // 1. Check current time vs race time
        const now = new Date();
        const raceDate = ROUND_TO_RACE[14].date;
        const timeDiffHours = (now - raceDate) / (1000 * 60 * 60);
        
        console.log('📅 Time Analysis:');
        console.log(`   Current time: ${now.toISOString()}`);
        console.log(`   Race time: ${raceDate.toISOString()}`);
        console.log(`   Time difference: ${timeDiffHours.toFixed(2)} hours`);
        console.log(`   Race should be processed: ${raceDate < now ? 'YES' : 'NO'}\n`);
        
        // 2. Check if race exists in database
        const existingRace = await RaceResult.findOne({ round: 14 });
        console.log('🗄️ Database Status:');
        if (existingRace) {
            console.log(`   Race found in DB: YES`);
            console.log(`   Status: ${existingRace.status}`);
            console.log(`   Results count: ${existingRace.results?.length || 0}`);
            console.log(`   Team results count: ${existingRace.teamResults?.length || 0}`);
            console.log(`   Sprint results count: ${existingRace.sprintResults?.length || 0}`);
        } else {
            console.log(`   Race found in DB: NO`);
        }
        console.log('');
        
        // 3. Check if slug exists
        const SLUGS_FILE = path.join(__dirname, '../src/data/motorsportSlugs.json');
        let slugCache = {};
        try {
            const data = await fs.readFile(SLUGS_FILE, 'utf8');
            slugCache = JSON.parse(data);
        } catch (error) {
            console.log('⚠️ Could not read slugs file');
        }
        
        console.log('🔗 Slug Status:');
        const raceName = ROUND_TO_RACE[14].name; // 'hungarian'
        console.log(`   Race name: ${raceName}`);
        console.log(`   Slug found: ${slugCache[raceName] ? 'YES' : 'NO'}`);
        if (slugCache[raceName]) {
            console.log(`   Slug value: ${slugCache[raceName]}`);
        }
        console.log('');
        
        // 4. Check shouldProcessRace logic
        console.log('🤔 Should Process Race Analysis:');
        
        // Check if race already has data
        const hasResults = existingRace && existingRace.results && existingRace.results.length > 0;
        console.log(`   Has results in DB: ${hasResults ? 'YES (will skip)' : 'NO'}`);
        
        // Check if we have a valid slug
        const hasSlug = !!slugCache[raceName];
        console.log(`   Has valid slug: ${hasSlug ? 'YES' : 'NO (will skip)'}`);
        
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
        }
        
        console.log('\n📋 Available slugs:');
        Object.entries(slugCache).forEach(([name, slug]) => {
            console.log(`   ${name}: ${slug}`);
        });
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

debugHungarianGP(); 