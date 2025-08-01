require('dotenv').config();
const mongoose = require('mongoose');
const RaceResult = require('../src/models/RaceResult');
const RaceCalendar = require('../src/models/RaceCalendar');

async function fixBelgianHungarianRounds() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fantasy-f1');
        console.log('✅ Connected to MongoDB');

        // Check current state
        console.log('\n📋 Checking current race assignments...');
        
        const belgianRace = await RaceResult.findOne({ raceName: 'belgian' });
        const hungarianRace = await RaceResult.findOne({ raceName: 'hungarian' });
        
        console.log('Belgian GP:', belgianRace ? {
            round: belgianRace.round,
            raceName: belgianRace.raceName,
            date: belgianRace.date
        } : 'Not found');
        
        console.log('Hungarian GP:', hungarianRace ? {
            round: hungarianRace.round,
            raceName: hungarianRace.raceName,
            date: hungarianRace.date
        } : 'Not found');

        // Fix the rounds if needed
        if (belgianRace && belgianRace.round !== 13) {
            console.log(`\n🔧 Fixing Belgian GP round from ${belgianRace.round} to 13`);
            await RaceResult.updateOne(
                { raceName: 'belgian' },
                { $set: { round: 13 } }
            );
        }

        if (hungarianRace && hungarianRace.round !== 14) {
            console.log(`\n🔧 Fixing Hungarian GP round from ${hungarianRace.round} to 14`);
            await RaceResult.updateOne(
                { raceName: 'hungarian' },
                { $set: { round: 14 } }
            );
        }

        // Also fix RaceCalendar entries if they exist
        const belgianCalendar = await RaceCalendar.findOne({ raceName: 'Belgian Grand Prix' });
        const hungarianCalendar = await RaceCalendar.findOne({ raceName: 'Hungarian Grand Prix' });

        if (belgianCalendar && belgianCalendar.round !== 13) {
            console.log(`\n🔧 Fixing Belgian GP calendar round from ${belgianCalendar.round} to 13`);
            await RaceCalendar.updateOne(
                { raceName: 'Belgian Grand Prix' },
                { $set: { round: 13 } }
            );
        }

        if (hungarianCalendar && hungarianCalendar.round !== 14) {
            console.log(`\n🔧 Fixing Hungarian GP calendar round from ${hungarianCalendar.round} to 14`);
            await RaceCalendar.updateOne(
                { raceName: 'Hungarian Grand Prix' },
                { $set: { round: 14 } }
            );
        }

        // Verify the fixes
        console.log('\n✅ Verification after fixes:');
        
        const updatedBelgian = await RaceResult.findOne({ raceName: 'belgian' });
        const updatedHungarian = await RaceResult.findOne({ raceName: 'hungarian' });
        
        console.log('Belgian GP:', updatedBelgian ? {
            round: updatedBelgian.round,
            raceName: updatedBelgian.raceName,
            date: updatedBelgian.date
        } : 'Not found');
        
        console.log('Hungarian GP:', updatedHungarian ? {
            round: updatedHungarian.round,
            raceName: updatedHungarian.raceName,
            date: updatedHungarian.date
        } : 'Not found');

        console.log('\n✅ Fix completed successfully');

    } catch (error) {
        console.error('❌ Error fixing rounds:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

// Run the script
fixBelgianHungarianRounds(); 