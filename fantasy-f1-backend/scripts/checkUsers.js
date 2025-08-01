require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const League = require('../src/models/League');

async function checkUsers() {
    try {
        console.log('🔍 Checking users structure...');
        
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fantasy-f1');
        console.log('✅ Connected to MongoDB');
        
        // Get all users
        const users = await User.find({});
        console.log(`\n📊 Found ${users.length} users`);
        
        if (users.length > 0) {
            const firstUser = users[0];
            console.log('\n👤 First user structure:');
            console.log(`Username: ${firstUser.username}`);
            console.log(`Email: ${firstUser.email}`);
            console.log(`League selections count: ${firstUser.leagueSelections?.length || 0}`);
            console.log(`Race history count: ${firstUser.raceHistory?.length || 0}`);
            
            if (firstUser.leagueSelections && firstUser.leagueSelections.length > 0) {
                console.log('\n🏆 League selections:');
                firstUser.leagueSelections.forEach((ls, index) => {
                    console.log(`${index + 1}. League ID: ${ls.leagueId}`);
                    console.log(`   Selections count: ${ls.selections?.length || 0}`);
                });
            }
            
            if (firstUser.raceHistory && firstUser.raceHistory.length > 0) {
                console.log('\n🏁 Race history:');
                firstUser.raceHistory.forEach((race, index) => {
                    console.log(`${index + 1}. Round ${race.round}: ${race.points} points`);
                });
            }
        }
        
        // Get all leagues
        const leagues = await League.find({});
        console.log(`\n🏆 Found ${leagues.length} leagues`);
        
        if (leagues.length > 0) {
            console.log('\n📋 Leagues:');
            leagues.forEach((league, index) => {
                console.log(`${index + 1}. ${league.name} (ID: ${league._id})`);
            });
        }
        
    } catch (error) {
        console.error('❌ Error checking users:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

// Run the script
checkUsers(); 