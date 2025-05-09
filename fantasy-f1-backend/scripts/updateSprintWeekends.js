const mongoose = require('mongoose');
const RaceCalendar = require('../src/models/RaceCalendar');
const { ROUND_TO_RACE } = require('../src/constants/roundMapping');
require('dotenv').config({ path: 'fantasy-f1-backend/.env' });

async function updateSprintWeekends() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fantasy-f1');
        console.log('✅ Connected to MongoDB');

        // Update each race's sprint weekend status
        for (const [round, race] of Object.entries(ROUND_TO_RACE)) {
            let updateOperation;
            
            if (race.hasSprint) {
                // For sprint races, set the sprint times
                updateOperation = {
                    $set: {
                        isSprintWeekend: true,
                        sprintStart: race.sprintStart,
                        sprintQualifyingStart: race.sprintQualifyingStart
                    }
                };
            } else {
                // For non-sprint races, remove sprint times
                updateOperation = {
                    $set: { isSprintWeekend: false },
                    $unset: { 
                        sprintStart: "",
                        sprintQualifyingStart: ""
                    }
                };
            }

            const updatedRace = await RaceCalendar.findOneAndUpdate(
                { round: parseInt(round) },
                updateOperation,
                { new: true }
            );

            if (updatedRace) {
                console.log(`Updated ${updatedRace.raceName} (Round ${round}):`, {
                    isSprintWeekend: updatedRace.isSprintWeekend,
                    sprintStart: updatedRace.sprintStart,
                    sprintQualifyingStart: updatedRace.sprintQualifyingStart
                });
            } else {
                console.log(`⚠️ No race found for round ${round}`);
            }
        }

        console.log('\n✅ All races updated successfully');
    } catch (error) {
        console.error('❌ Error updating races:', error);
    } finally {
        await mongoose.disconnect();
        console.log('✅ Disconnected from MongoDB');
    }
}

// Run the update script
updateSprintWeekends(); 