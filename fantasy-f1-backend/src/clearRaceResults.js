const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const RaceResult = require('./models/RaceResult');

async function clearRaceResults() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('📦 Connected to MongoDB');

        // Delete all race results
        const result = await RaceResult.deleteMany({});
        console.log(`🗑️ Deleted ${result.deletedCount} race results`);

        // Close the connection
        await mongoose.connection.close();
        console.log('🔌 Disconnected from MongoDB');
    } catch (error) {
        console.error('❌ Error clearing race results:', error);
        process.exit(1);
    }
}

clearRaceResults(); 