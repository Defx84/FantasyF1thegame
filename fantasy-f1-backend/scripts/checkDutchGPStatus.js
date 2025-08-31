require('dotenv').config();
const mongoose = require('mongoose');
const RaceResult = require('../src/models/RaceResult');
const RaceSelection = require('../src/models/RaceSelection');
const League = require('../src/models/League');
const { ROUND_TO_RACE } = require('../src/constants/roundMapping');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fantasy-f1';
mongoose.connect(MONGODB_URI);

async function checkDutchGPStatus() {
    try {
        console.log('🔍 Checking Dutch GP status...\n');
        
        const round = 15;
        const raceName = ROUND_TO_RACE[round].name;
        
        // Check current state
        const existingRace = await RaceResult.findOne({ round });
        console.log('📊 Current Dutch GP state:');
        console.log(`   Round: ${round}`);
        console.log(`   Race name: ${raceName}`);
        console.log(`   Status: ${existingRace?.status || 'Not found'}`);
        console.log(`   Results array exists: ${!!existingRace?.results}`);
        console.log(`   Results length: ${existingRace?.results?.length || 0}`);
        console.log(`   Team results length: ${existingRace?.teamResults?.length || 0}`);
        console.log(`   Sprint results length: ${existingRace?.sprintResults?.length || 0}`);
        
        // Check if race exists in database
        if (!existingRace) {
            console.log('\n❌ Dutch GP not found in database!');
            console.log('   This means the scraper has not run yet or failed to create the race entry.');
            return;
        }
        
        // Check race timing
        const now = new Date();
        const raceDate = ROUND_TO_RACE[round].date;
        const raceStart = existingRace.raceStart || raceDate;
        const qualifyingStart = existingRace.qualifyingStart || ROUND_TO_RACE[round].qualifyingStart;
        
        console.log('\n⏰ Race timing analysis:');
        console.log(`   Current time: ${now.toISOString()}`);
        console.log(`   Race start: ${raceStart.toISOString()}`);
        console.log(`   Qualifying start: ${qualifyingStart.toISOString()}`);
        console.log(`   Race has started: ${now > raceStart}`);
        console.log(`   Qualifying has started: ${now > qualifyingStart}`);
        
        // Check if race should be completed
        const RACE_DURATION_HOURS = 3;
        const raceEndTime = new Date(raceStart.getTime() + RACE_DURATION_HOURS * 60 * 60 * 1000);
        const shouldBeCompleted = now > raceEndTime;
        console.log(`   Race end time: ${raceEndTime.toISOString()}`);
        console.log(`   Should be completed: ${shouldBeCompleted}`);
        
        // Check selections
        console.log('\n🎯 Checking selections:');
        const selections = await RaceSelection.find({ round });
        console.log(`   Total selections found: ${selections.length}`);
        
        if (selections.length > 0) {
            const statusCounts = {};
            let adminAssignedCount = 0;
            
            selections.forEach(selection => {
                const status = selection.status || 'unknown';
                statusCounts[status] = (statusCounts[status] || 0) + 1;
                if (selection.isAdminAssigned) adminAssignedCount++;
            });
            
            console.log('   Selection status breakdown:');
            Object.entries(statusCounts).forEach(([status, count]) => {
                console.log(`     ${status}: ${count}`);
            });
            console.log(`   Admin assigned: ${adminAssignedCount}`);
            
            // Check a few selections in detail
            console.log('\n   Sample selections:');
            selections.slice(0, 3).forEach((selection, index) => {
                console.log(`     ${index + 1}. User: ${selection.user}, Status: ${selection.status}, Points: ${selection.points}, Admin assigned: ${selection.isAdminAssigned}`);
            });
        }
        
        // Check leagues
        console.log('\n🏆 Checking leagues:');
        const leagues = await League.find();
        console.log(`   Total leagues: ${leagues.length}`);
        
        if (leagues.length > 0) {
            leagues.forEach((league, index) => {
                console.log(`     ${index + 1}. ${league.name} - ${league.members.length} members`);
            });
        }
        
        // Recommendations
        console.log('\n💡 Recommendations:');
        
        if (!existingRace) {
            console.log('   1. The Dutch GP needs to be created in the database first');
            console.log('   2. Run the scraper to get race results');
            console.log('   3. Then admin assignments will work');
        } else if (existingRace.status !== 'completed') {
            console.log('   1. Race exists but is not marked as completed');
            console.log('   2. Race needs race results to be marked as completed');
            console.log('   3. Admin assignments only work on completed races');
        } else if (existingRace.results.length === 0) {
            console.log('   1. Race is marked as completed but has no results');
            console.log('   2. This is a data inconsistency - race needs proper results');
        } else {
            console.log('   1. Race appears to be properly set up');
            console.log('   2. Check if admin assignments are being saved correctly');
            console.log('   3. Check if points calculation is working');
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

// Run the script
checkDutchGPStatus();
