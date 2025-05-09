require('dotenv').config();
const mongoose = require('mongoose');
const RaceResult = require('../models/RaceResult');

async function updateRace() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Update round 1 to be a scheduled race 2 hours in the future
        const futureDate = new Date(Date.now() + 7200000); // 2 hours from now
        const result = await RaceResult.updateOne(
            { round: 1 },
            { 
                $set: { 
                    status: 'scheduled',
                    date: futureDate,
                    raceStart: futureDate,
                    qualifyingStart: new Date(futureDate.getTime() - 86400000), // 1 day before race
                    isSprintWeekend: false
                }
            }
        );

        console.log('Update result:', result);

        // Verify the update
        const updatedRace = await RaceResult.findOne({ round: 1 });
        console.log('Updated race:', {
            round: updatedRace.round,
            raceName: updatedRace.raceName,
            status: updatedRace.status,
            date: updatedRace.date,
            raceStart: updatedRace.raceStart,
            qualifyingStart: updatedRace.qualifyingStart
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

updateRace(); 