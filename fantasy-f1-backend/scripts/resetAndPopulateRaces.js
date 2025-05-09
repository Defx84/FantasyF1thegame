const mongoose = require('mongoose');
const RaceResult = require('../src/models/RaceResult');
const { ROUND_TO_RACE } = require('../src/constants/roundMapping');
require('dotenv').config();

async function resetAndPopulateRaces() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Delete all existing race results
        console.log('Deleting existing race results...');
        await RaceResult.deleteMany({});
        console.log('Deleted all race results');

        // Process each race in order
        for (let round = 1; round <= Object.keys(ROUND_TO_RACE).length; round++) {
            const raceInfo = ROUND_TO_RACE[round];
            if (!raceInfo) {
                console.log(`No race info found for round ${round}, skipping...`);
                continue;
            }

            const raceName = raceInfo.name;
            console.log(`\nProcessing ${raceName} (Round ${round})...`);

            try {
                // Create empty RaceResult document
                const raceData = {
                    round: parseInt(round),
                    raceName,
                    circuit: raceName.charAt(0).toUpperCase() + raceName.slice(1),
                    date: raceInfo.date,
                    raceStart: raceInfo.date,
                    raceEnd: new Date(raceInfo.date.getTime() + 2 * 60 * 60 * 1000), // 2 hours after race
                    qualifyingStart: raceInfo.qualifyingStart,
                    sprintQualifyingStart: raceInfo.sprintQualifyingStart,
                    sprintStart: raceInfo.sprintStart,
                    status: 'scheduled',
                    isSprintWeekend: raceInfo.hasSprint,
                    season: 2025,
                    results: [], // Empty array for race results
                    sprintResults: [], // Empty array for sprint results
                    teamResults: [] // Empty array for team results
                };

                const savedRace = await RaceResult.findOneAndUpdate(
                    { round: parseInt(round) },
                    raceData,
                    { upsert: true, new: true }
                );

                console.log(`Created empty entry for ${raceName}`);
                console.log(`Sprint weekend: ${raceInfo.hasSprint ? 'Yes' : 'No'}`);
                console.log(`Date: ${raceInfo.date.toISOString().split('T')[0]}`);
            } catch (error) {
                console.error(`Error processing ${raceName}:`, error);
            }
        }

        console.log('\nRace calendar population completed!');
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

resetAndPopulateRaces(); 