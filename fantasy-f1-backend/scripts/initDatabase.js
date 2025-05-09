const mongoose = require('mongoose');
require('dotenv').config();

// Import models to ensure schemas are registered
const RaceResult = require('../src/models/RaceResult');
const Leaderboard = require('../src/models/Leaderboard');
const LeagueLeaderboard = require('../src/models/LeagueLeaderboard');
const RaceSelection = require('../src/models/RaceSelection');
const User = require('../src/models/User');
const League = require('../src/models/League');

async function initDatabase() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Create collections if they don't exist
        const collections = [
            'raceresults',
            'leaderboards',
            'leagueleaderboards',
            'raceselections',
            'users',
            'leagues'
        ];

        for (const collection of collections) {
            try {
                await mongoose.connection.createCollection(collection);
                console.log(`Created collection: ${collection}`);
            } catch (error) {
                if (error.code === 48) { // Collection already exists
                    console.log(`Collection already exists: ${collection}`);
                } else {
                    console.error(`Error creating collection ${collection}:`, error);
                }
            }
        }

        // Create indexes
        console.log('\nCreating indexes...');
        
        try {
            // RaceResult indexes
            await mongoose.connection.collection('raceresults').createIndex({ round: 1 }, { unique: true });
            await mongoose.connection.collection('raceresults').createIndex({ raceId: 1 }, { unique: true });
            console.log('Created RaceResult indexes');
            
            // Leaderboard indexes
            await mongoose.connection.collection('leaderboards').createIndex({ season: 1 }, { unique: true });
            console.log('Created Leaderboard indexes');
            
            // LeagueLeaderboard indexes
            await mongoose.connection.collection('leagueleaderboards').createIndex({ 
                league: 1, 
                season: 1 
            }, { unique: true });
            console.log('Created LeagueLeaderboard indexes');
            
            // RaceSelection indexes
            await mongoose.connection.collection('raceselections').createIndex({ 
                user: 1, 
                race: 1 
            }, { unique: true });
            console.log('Created RaceSelection indexes');
            
            // User indexes
            await mongoose.connection.collection('users').createIndex({ email: 1 }, { unique: true });
            await mongoose.connection.collection('users').createIndex({ username: 1 }, { unique: true });
            console.log('Created User indexes');
            
            // League indexes
            await mongoose.connection.collection('leagues').createIndex({ name: 1 }, { unique: true });
            console.log('Created League indexes');
        } catch (error) {
            if (error.code === 86) { // Index already exists
                console.log('Indexes already exist');
            } else {
                console.error('Error creating indexes:', error);
            }
        }

        console.log('\nDatabase initialization complete!');
        
    } catch (error) {
        console.error('Error initializing database:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
    }
}

initDatabase(); 