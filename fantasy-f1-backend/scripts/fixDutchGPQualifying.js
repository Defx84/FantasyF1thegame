require('dotenv').config();
const mongoose = require('mongoose');
const RaceResult = require('../src/models/RaceResult');
const { ROUND_TO_RACE } = require('../src/constants/roundMapping');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fantasy-f1';
mongoose.connect(MONGODB_URI);

async function fixDutchGPQualifying() {
    try {
        console.log('🔧 Fixing Dutch GP qualifying date...\n');
        
        const round = 15;
        const raceName = ROUND_TO_RACE[round].name;
        
        // Get the correct dates from roundMapping
        const correctQualifyingStart = ROUND_TO_RACE[round].qualifyingStart;
        const correctRaceStart = ROUND_TO_RACE[round].date;
        
        console.log('📅 Correct dates from roundMapping:');
        console.log(`   Qualifying start: ${correctQualifyingStart.toISOString()}`);
        console.log(`   Race start: ${correctRaceStart.toISOString()}`);
        
        // Find and update the Dutch GP in the database
        const updatedRace = await RaceResult.findOneAndUpdate(
            { round },
            {
                $set: {
                    qualifyingStart: correctQualifyingStart,
                    raceStart: correctRaceStart,
                    date: correctRaceStart
                }
            },
            { new: true }
        );
        
        if (!updatedRace) {
            console.log('❌ Dutch GP not found in database!');
            return;
        }
        
        console.log('\n✅ Successfully updated Dutch GP dates:');
        console.log(`   Round: ${updatedRace.round}`);
        console.log(`   Race name: ${updatedRace.raceName}`);
        console.log(`   Old qualifying start: ${updatedRace.qualifyingStart.toISOString()}`);
        console.log(`   Old race start: ${updatedRace.raceStart.toISOString()}`);
        console.log(`   Status: ${updatedRace.status}`);
        
        // Check if the race should now be marked as completed
        const now = new Date();
        const RACE_DURATION_HOURS = 3;
        const raceEndTime = new Date(correctRaceStart.getTime() + RACE_DURATION_HOURS * 60 * 60 * 1000);
        
        console.log('\n⏰ Timing analysis after fix:');
        console.log(`   Current time: ${now.toISOString()}`);
        console.log(`   Race end time: ${raceEndTime.toISOString()}`);
        console.log(`   Should be completed: ${now > raceEndTime}`);
        
        if (now > raceEndTime) {
            console.log('\n🔄 Race should be completed. Updating status...');
            
            const raceWithUpdatedStatus = await RaceResult.findOneAndUpdate(
                { round },
                { $set: { status: 'completed' } },
                { new: true }
            );
            
            console.log(`✅ Status updated to: ${raceWithUpdatedStatus.status}`);
        }
        
        console.log('\n🎯 Next steps:');
        console.log('   1. The qualifying date is now correct (August 30)');
        console.log('   2. The race start date is now correct (August 31)');
        console.log('   3. Race status should now be "completed"');
        console.log('   4. Admin assignments should now work properly');
        console.log('   5. However, you still need actual race results for points calculation');
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

// Run the script
fixDutchGPQualifying();
