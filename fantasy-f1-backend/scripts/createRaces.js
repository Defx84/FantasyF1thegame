const mongoose = require('mongoose');
const RaceResult = require('../src/models/RaceResult');
const { ROUND_TO_RACE } = require('../src/constants/roundMapping');
require('dotenv').config();

async function createRaces() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Create races for rounds 1-24
        for (let round = 1; round <= 24; round++) {
            const raceInfo = ROUND_TO_RACE[round];
            if (!raceInfo) {
                console.log(`⚠️ No race info found for round ${round}`);
                continue;
            }

            const raceData = {
                round,
                raceName: raceInfo.name,
                circuit: raceInfo.circuit,
                raceStart: raceInfo.raceStart,
                qualifyingStart: raceInfo.qualifyingStart,
                status: 'scheduled',
                isSprintWeekend: raceInfo.isSprintWeekend || false,
                results: [],
                teamResults: [],
                sprintResults: null,
                sprintTeamResults: null
            };

            await RaceResult.findOneAndUpdate(
                { round },
                raceData,
                { upsert: true, new: true }
            );

            console.log(`✅ Created/Updated race: ${raceInfo.name} (Round ${round})`);
        }

        console.log('\n✅ All races created successfully');
    } catch (error) {
        console.error('❌ Error creating races:', error);
    } finally {
        await mongoose.disconnect();
        console.log('✅ Disconnected from MongoDB');
    }
}

createRaces(); 