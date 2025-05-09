require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');

async function checkLeagues() {
    try {
        // Use the MONGODB_URI from .env
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error('MONGODB_URI not found in .env file');
        }
        console.log('Using MongoDB URI:', mongoUri);
        
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');

        // Get all documents from the leagues collection directly
        const leagues = await mongoose.connection.collection('leagues').find({}).toArray();
        
        console.log('\nTotal leagues found:', leagues.length);
        
        if (leagues.length === 0) {
            // Show all collections and their counts
            const collections = await mongoose.connection.db.listCollections().toArray();
            for (const collection of collections) {
                const count = await mongoose.connection.collection(collection.name).countDocuments();
                console.log(`\nCollection '${collection.name}' has ${count} documents`);
                
                // If it's the leagues collection, show a sample document
                if (collection.name === 'leagues') {
                    const sampleLeague = await mongoose.connection.collection(collection.name).findOne({});
                    if (sampleLeague) {
                        console.log('\nSample league document:', sampleLeague);
                    }
                }
            }
        } else {
            leagues.forEach(league => {
                console.log('\nLeague:', {
                    _id: league._id.toString(),
                    name: league.name,
                    code: league.code,
                    season: league.season,
                    members: league.members ? league.members.length : 0,
                    owner: league.owner
                });
            });
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
        console.error('Error details:', error.message);
        if (error.stack) {
            console.error('Stack:', error.stack);
        }
    }
}

checkLeagues(); 