const mongoose = require('mongoose');
const RaceResult = require('../src/models/RaceResult');
require('dotenv').config();

async function triggerPostSaveHook() {
    try {
        // Connect to MongoDB
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Test with a specific round (you can change this)
        const testRound = 1; // Change this to test different races
        
        console.log(`\n=== Triggering Post-Save Hook for Round ${testRound} ===`);
        
        // Get the race result
        const raceResult = await RaceResult.findOne({ round: testRound });
        if (!raceResult) {
            console.log(`No race result found for round ${testRound}`);
            return;
        }
        
        console.log(`\nRace: ${raceResult.raceName} (Round ${raceResult.round})`);
        console.log(`Current Status: ${raceResult.status}`);
        console.log(`Is Sprint Weekend: ${raceResult.isSprintWeekend}`);
        
        // Ensure the race is marked as completed
        if (raceResult.status !== 'completed') {
            console.log('Setting race status to completed...');
            raceResult.status = 'completed';
        }
        
        // Save the document to trigger the post-save hook
        console.log('Saving race result to trigger post-save hook...');
        await raceResult.save();
        
        console.log('Post-save hook triggered successfully!');
        
        // Check if points were assigned
        const updatedRaceResult = await RaceResult.findOne({ round: testRound });
        console.log(`\nUpdated race status: ${updatedRaceResult.status}`);
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
    }
}

triggerPostSaveHook(); 