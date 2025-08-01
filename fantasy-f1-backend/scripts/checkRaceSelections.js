require('dotenv').config();
const mongoose = require('mongoose');
const RaceSelection = require('../src/models/RaceSelection');
const User = require('../src/models/User');

async function checkRaceSelections() {
    try {
        console.log('🔍 Checking race selections...');
        
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fantasy-f1');
        console.log('✅ Connected to MongoDB');
        
        // Get all race selections
        const selections = await RaceSelection.find({});
        console.log(`\n📊 Found ${selections.length} race selections`);
        
        if (selections.length > 0) {
            console.log('\n🏁 Sample selections:');
            selections.slice(0, 5).forEach((selection, index) => {
                console.log(`${index + 1}. Player: ${selection.playerId}, Round: ${selection.round}`);
                console.log(`   Main: ${selection.mainDriver}, Reserve: ${selection.reserveDriver}, Team: ${selection.team}`);
            });
            
            // Check for Belgian GP selections (round 13)
            const belgianSelections = selections.filter(s => s.round === 13);
            console.log(`\n🇧🇪 Belgian GP selections (round 13): ${belgianSelections.length}`);
            
            if (belgianSelections.length > 0) {
                belgianSelections.forEach((selection, index) => {
                    console.log(`${index + 1}. Player: ${selection.playerId}`);
                    console.log(`   Main: ${selection.mainDriver}, Reserve: ${selection.reserveDriver}, Team: ${selection.team}`);
                });
            }
        }
        
        // Check if there are any users with selections
        const usersWithSelections = await User.find({ 'leagueSelections.0': { $exists: true } });
        console.log(`\n👥 Users with league selections: ${usersWithSelections.length}`);
        
    } catch (error) {
        console.error('❌ Error checking race selections:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

// Run the script
checkRaceSelections(); 