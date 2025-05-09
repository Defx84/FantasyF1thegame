const mongoose = require('mongoose');
const RaceResult = require('../src/models/RaceResult');
require('dotenv').config();

async function clearRaceResults() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        console.log('Clearing race results...');
        await RaceResult.deleteMany({});
        console.log('Race results cleared successfully');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
    }
}

clearRaceResults(); 