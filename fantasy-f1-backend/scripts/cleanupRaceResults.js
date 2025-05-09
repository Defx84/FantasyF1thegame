const mongoose = require('mongoose');
require('dotenv').config();

async function cleanupRaceResults() {
    try {
        // Connect to MongoDB
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ Connected to MongoDB');

        // Delete all race results
        const RaceResult = require('../src/models/RaceResult');
        const result = await RaceResult.deleteMany({});
        
        console.log(`✅ Deleted ${result.deletedCount} race results from database`);
        
        // Disconnect from MongoDB
        await mongoose.disconnect();
        console.log('✅ Disconnected from MongoDB');
    } catch (error) {
        console.error('❌ Error during cleanup:', error);
        process.exit(1);
    }
}

// Run the cleanup
cleanupRaceResults(); 