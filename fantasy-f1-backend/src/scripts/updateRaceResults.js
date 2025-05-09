const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const RaceResult = require('../models/RaceResult');
const { ROUND_TO_RACE } = require('../constants/roundMapping');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// Function to update race status
async function updateRaceStatus(round, raceData) {
    try {
        const now = new Date();
        const raceDate = new Date(raceData.date);
        
        // Only update races that have already happened
        if (now > raceDate) {
            const result = await RaceResult.findOneAndUpdate(
                { round },
                { 
                    $set: { 
                        status: 'completed',
                        lastUpdated: new Date()
                    }
                },
                { new: true }
            );
            
            if (result) {
                console.log(`Updated round ${round} (${raceData.name}) to completed`);
            } else {
                console.log(`No race found for round ${round}`);
            }
        } else {
            console.log(`Round ${round} (${raceData.name}) hasn't happened yet`);
        }
    } catch (error) {
        console.error(`Error updating round ${round}:`, error);
    }
}

// Main function to update all races
async function updateAllRaces() {
    try {
        // Get all rounds from the mapping
        const rounds = Object.keys(ROUND_TO_RACE);
        
        // Update each race
        for (const round of rounds) {
            await updateRaceStatus(round, ROUND_TO_RACE[round]);
        }
        
        console.log('All races updated');
    } catch (error) {
        console.error('Error updating races:', error);
    } finally {
        mongoose.disconnect();
    }
}

// Run the script if called directly
if (require.main === module) {
    updateAllRaces();
}

module.exports = { updateAllRaces }; 