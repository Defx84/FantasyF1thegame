const mongoose = require('mongoose');
require('dotenv').config();

async function dropRaceCollection() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Drop the Race collection
        await mongoose.connection.db.dropCollection('races');
        console.log('Successfully dropped the Race collection');

        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    } catch (error) {
        if (error.code === 26) { // NamespaceNotFound error
            console.log('Race collection does not exist, nothing to drop');
        } else {
            console.error('Error:', error);
        }
        process.exit(1);
    }
}

dropRaceCollection(); 