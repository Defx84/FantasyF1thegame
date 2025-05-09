const mongoose = require('mongoose');
const RaceResult = require('../src/models/RaceResult');
const { ROUND_TO_RACE } = require('../src/constants/roundMapping');
require('dotenv').config();

async function cleanAndFixRaces() {
    try {
        // Step 1: Connect to MongoDB
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Step 2: Delete all existing RaceResult documents
        console.log('\nStep 1: Deleting all existing RaceResult documents...');
        await RaceResult.deleteMany({});
        console.log('✅ All RaceResult documents deleted');

        // Step 3: Create base race documents
        console.log('\nStep 2: Creating base race documents...');
        const races = await Promise.all(
            Object.entries(ROUND_TO_RACE).map(async ([round, raceInfo]) => {
                // Create a temporary ObjectId for race reference
                const tempRaceId = new mongoose.Types.ObjectId();
                
                return await RaceResult.create({
                    raceId: tempRaceId,
                    race: tempRaceId,
                    round: parseInt(round),
                    raceName: raceInfo.name,
                    circuit: raceInfo.name.charAt(0).toUpperCase() + raceInfo.name.slice(1),
                    date: raceInfo.date,
                    raceStart: raceInfo.date,
                    raceEnd: new Date(raceInfo.date.getTime() + 2 * 60 * 60 * 1000),
                    qualifyingStart: raceInfo.qualifyingStart,
                    sprintQualifyingStart: raceInfo.sprintQualifyingStart,
                    sprintStart: raceInfo.sprintStart,
                    status: 'scheduled',
                    isSprintWeekend: false,
                    season: 2025,
                    // Required fields with placeholder values
                    driverId: new mongoose.Types.ObjectId(), // Temporary ID
                    position: 0,
                    points: 0,
                    results: [],
                    sprintResults: [],
                    teamResults: []
                });
            })
        );
        console.log('✅ Base race documents created');

        // Step 4: Fix Sprint weekends
        console.log('\nStep 3: Fixing Sprint weekends...');
        const sprintRounds = [2, 6, 14, 19, 21, 23];
        
        await RaceResult.updateMany(
            { round: { $in: sprintRounds } },
            { $set: { isSprintWeekend: true } }
        );
        console.log('✅ Sprint weekends fixed');

        // Verify the changes
        console.log('\nVerifying changes...');
        const sprintRaces = await RaceResult.find({ isSprintWeekend: true }).sort('round');
        console.log('\nSprint weekends for 2025:');
        sprintRaces.forEach(race => {
            console.log(`- Round ${race.round}: ${race.circuit} Grand Prix`);
        });

        // Print all races for verification
        console.log('\nAll races for 2025:');
        const allRaces = await RaceResult.find().sort('round');
        allRaces.forEach(race => {
            console.log(`Round ${race.round}: ${race.circuit} Grand Prix (Sprint: ${race.isSprintWeekend ? 'Yes' : 'No'})`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
    }
}

cleanAndFixRaces(); 