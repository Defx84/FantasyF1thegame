require('dotenv').config();
const mongoose = require('mongoose');
const RaceResult = require('../models/RaceResult');

async function checkNextRace() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const now = new Date();
        const nextRace = await RaceResult.findOne({
            $or: [
                { status: 'scheduled' },
                { status: 'qualifying' }
            ],
            qualifyingStart: { $gt: now }
        }).sort({ qualifyingStart: 1 });

        if (!nextRace) {
            console.log('No upcoming race found');
            return;
        }

        // Format the response exactly as the controller would
        const response = {
            hasUpcomingRace: true,
            raceName: nextRace.raceName,
            round: nextRace.round,
            qualifying: {
                date: nextRace.qualifyingStart,
                startTime: nextRace.qualifyingStart
            },
            race: {
                date: nextRace.date,
                startTime: nextRace.raceStart
            }
        };

        console.log('Next race response:', JSON.stringify(response, null, 2));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.connection.close();
    }
}

checkNextRace(); 