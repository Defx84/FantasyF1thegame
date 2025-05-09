const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const RaceResult = require('./models/RaceResult');
const { ROUND_TO_RACE } = require('./constants/roundMapping');

async function initializeRaces() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('📦 Connected to MongoDB');

        // Initialize each race
        for (const [round, race] of Object.entries(ROUND_TO_RACE)) {
            const raceData = {
                round: parseInt(round),
                raceName: race.name,
                circuit: race.circuit,
                raceStart: race.raceStart,
                qualifyingStart: race.qualifyingStart,
                status: 'scheduled',
                isSprintWeekend: race.isSprintWeekend || false,
                results: [],
                teamResults: [],
                sprintResults: [],
                sprintTeamResults: []
            };

            // Add sprint-specific fields if it's a sprint weekend
            if (race.isSprintWeekend) {
                raceData.sprintStart = race.sprintStart;
                raceData.sprintQualifyingStart = race.sprintQualifyingStart;
            }

            // Create or update the race
            const updatedRace = await RaceResult.findOneAndUpdate(
                { round: parseInt(round) },
                raceData,
                { upsert: true, new: true }
            );

            console.log(`✅ Created/Updated race: ${updatedRace.raceName} (Round ${updatedRace.round})`);
        }

        console.log('🏁 All races initialized');

        // Close the connection
        await mongoose.connection.close();
        console.log('🔌 Disconnected from MongoDB');
    } catch (error) {
        console.error('❌ Error initializing races:', error);
        process.exit(1);
    }
}

initializeRaces(); 