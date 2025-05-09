const mongoose = require('mongoose');
require('dotenv').config();

async function deleteRaceResults() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const result = await mongoose.connection.db.collection('raceresults').deleteMany({});
        console.log(`Deleted ${result.deletedCount} RaceResult documents`);

        await mongoose.connection.close();
        console.log('Disconnected from MongoDB');
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

deleteRaceResults(); 