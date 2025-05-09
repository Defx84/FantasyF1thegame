require('dotenv').config();
const mongoose = require('mongoose');

async function checkCollections() {
    try {
        await mongoose.connect('mongodb://localhost:27017/fantasy-f1');
        console.log('Connected to MongoDB');

        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('\nCollections found:', collections.length);
        collections.forEach(collection => {
            console.log('\nCollection:', collection.name);
        });

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
}

checkCollections(); 