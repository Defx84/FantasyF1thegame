const mongoose = require('mongoose');
const RaceResult = require('../src/models/RaceResult');
require('dotenv').config();

async function checkResults() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB\n');

        const results = await RaceResult.find({}).sort({ round: 1 });
        
        for (const race of results) {
            console.log(`\n=== ${race.raceName} (Round ${race.round}) ===`);
            console.log('\nMain Race Results:');
            console.log('Position | Driver | Team');
            console.log('-'.repeat(50));
            
            race.results.forEach(result => {
                console.log(`${result.position.toString().padEnd(8)}| ${result.driver.padEnd(20)}| ${result.team}`);
            });

            if (race.sprintResults && race.sprintResults.length > 0) {
                console.log('\nSprint Results:');
                console.log('Position | Driver | Team');
                console.log('-'.repeat(50));
                
                race.sprintResults.forEach(result => {
                    console.log(`${result.position.toString().padEnd(8)}| ${result.driver.padEnd(20)}| ${result.team}`);
                });
            }

            // Collect unique teams for verification
            const teams = new Set([
                ...race.results.map(r => r.team),
                ...(race.sprintResults || []).map(r => r.team)
            ]);
            console.log('\nUnique teams found:', Array.from(teams).sort().join(', '));
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
    }
}

checkResults(); 