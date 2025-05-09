const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const RaceResult = require('../src/models/RaceResult');

async function insertRound1RaceResult() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Check if the entry already exists
        const existing = await RaceResult.findOne({ season: 2025, round: 1 });
        if (existing) {
            console.log('RaceResult for round 1, 2025 already exists. Aborting insert.');
            await mongoose.disconnect();
            return;
        }

        // Insert a new, empty RaceResult for Australian GP, 2025
        const newRace = new RaceResult({
            season: 2025,
            round: 1,
            raceName: 'Australian Grand Prix',
            circuit: 'Albert Park Circuit',
            country: 'Australia',
            date: new Date('2025-03-16T05:00:00Z'),
            raceStart: new Date('2025-03-16T05:00:00Z'),
            qualifyingStart: new Date('2025-03-15T05:00:00Z'),
            isSprintWeekend: false,
            status: 'scheduled',
            results: [],
            sprintResults: [],
            teamResults: []
        });
        await newRace.save();
        console.log('Inserted new empty RaceResult for round 1 (Australian GP, 2025).');

        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

insertRound1RaceResult(); 