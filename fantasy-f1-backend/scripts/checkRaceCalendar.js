const mongoose = require('mongoose');
const RaceCalendar = require('../src/models/RaceCalendar');
require('dotenv').config();

async function checkRaceCalendar() {
    try {
        console.log('Attempting to connect to MongoDB...');
        
        // Set mongoose options
        mongoose.set('strictQuery', false);
        
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        
        console.log('Successfully connected to MongoDB');

        // Get all races
        const races = await RaceCalendar.find({}).sort({ round: 1 });
        console.log(`Found ${races.length} races in the calendar:`);
        
        races.forEach(race => {
            console.log(`\nRound ${race.round}: ${race.raceName}`);
            console.log(`Circuit: ${race.circuit}`);
            console.log(`Date: ${race.date}`);
            console.log(`Race Start: ${race.raceStart}`);
            console.log(`Qualifying Start: ${race.qualifyingStart}`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
    }
}

// Run the check
checkRaceCalendar(); 