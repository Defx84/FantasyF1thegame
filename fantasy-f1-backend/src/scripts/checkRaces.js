require('dotenv').config();
const mongoose = require('mongoose');
const RaceResult = require('../models/RaceResult');

async function checkRaces() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Find the Miami race specifically
        const miamiRace = await RaceResult.findOne({ raceName: 'miami' });
        console.log('\nMiami Race Details:', miamiRace ? {
            round: miamiRace.round,
            raceName: miamiRace.raceName,
            status: miamiRace.status,
            date: miamiRace.date,
            raceStart: miamiRace.raceStart,
            qualifyingStart: miamiRace.qualifyingStart,
            timeUntil: miamiRace.qualifyingStart ? miamiRace.qualifyingStart.getTime() - new Date().getTime() : null
        } : 'Not found');

        // Let's update the Miami race with the correct race start time (2 days after qualifying)
        if (miamiRace && miamiRace.qualifyingStart && !miamiRace.raceStart) {
            const raceStart = new Date(miamiRace.qualifyingStart);
            raceStart.setDate(raceStart.getDate() + 2); // Race is typically 2 days after qualifying
            
            const result = await RaceResult.updateOne(
                { raceName: 'miami' },
                { 
                    $set: { 
                        raceStart: raceStart,
                        date: miamiRace.qualifyingStart // Set date to qualifying start for consistency
                    }
                }
            );
            console.log('\nUpdate result:', result);

            // Verify the update
            const updatedRace = await RaceResult.findOne({ raceName: 'miami' });
            console.log('\nUpdated Miami Race:', {
                round: updatedRace.round,
                raceName: updatedRace.raceName,
                status: updatedRace.status,
                date: updatedRace.date,
                raceStart: updatedRace.raceStart,
                qualifyingStart: updatedRace.qualifyingStart
            });
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
    }
}

checkRaces(); 