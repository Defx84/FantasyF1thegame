require('dotenv').config();
const mongoose = require('mongoose');

async function patchSprintWeekends() {
    try {
        // Connect to MongoDB
        const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/fantasy-f1';
        console.log('Connecting to MongoDB:', uri);
        await mongoose.connect(uri);
        console.log('Connected to MongoDB');

        // Get database reference
        const db = mongoose.connection.db;
        
        // Log available collections
        const collections = await db.listCollections().toArray();
        console.log('\nAvailable collections:');
        collections.forEach(c => console.log(`- ${c.name}`));

        // Check if required collections exist
        if (!collections.find(c => c.name === 'raceresults')) {
            console.error('\n❌ Error: raceresults collection not found!');
            return;
        }
        if (!collections.find(c => c.name === 'racecalendars')) {
            console.error('\n❌ Error: racecalendars collection not found!');
            return;
        }

        // Get all race results
        const raceResults = await db.collection('raceresults').find({}).toArray();
        console.log(`\nFound ${raceResults.length} race results to check`);

        if (raceResults.length === 0) {
            // Try to show a sample of what's in the database
            console.log('\nChecking database content:');
            for (const collection of collections) {
                const count = await db.collection(collection.name).countDocuments();
                const sample = await db.collection(collection.name).findOne();
                console.log(`\n${collection.name}:`);
                console.log(`- Document count: ${count}`);
                console.log('- Sample document:', sample ? JSON.stringify(sample, null, 2) : 'No documents');
            }
            return;
        }

        // Update each race result
        for (const race of raceResults) {
            try {
                // Find corresponding calendar entry
                const calendarRace = await db.collection('racecalendars').findOne({ round: race.round });
                
                if (calendarRace) {
                    const oldValue = race.isSprintWeekend;
                    race.isSprintWeekend = calendarRace.isSprintWeekend || false;
                    
                    // Update the race result
                    await db.collection('raceresults').updateOne(
                        { _id: race._id },
                        { $set: { isSprintWeekend: race.isSprintWeekend } }
                    );
                    
                    console.log(`\nUpdated race: ${race.raceName} (Round ${race.round})`);
                    console.log(`  Sprint Weekend: ${oldValue} → ${race.isSprintWeekend}`);
                } else {
                    console.warn(`\n⚠️ No calendar entry found for race: ${race.raceName} (Round ${race.round})`);
                }
            } catch (error) {
                console.error(`\nError updating race ${race.raceName}:`, error);
            }
        }

        console.log('\n✅ Patch completed successfully');
    } catch (error) {
        console.error('\n❌ Error running patch:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
    }
}

// Run the patch
patchSprintWeekends(); 