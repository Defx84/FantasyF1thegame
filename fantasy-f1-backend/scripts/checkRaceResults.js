const mongoose = require('mongoose');
const RaceResult = require('../src/models/RaceResult');
require('dotenv').config();

async function checkRaceResults() {
    try {
        console.log('Attempting to connect to MongoDB...');
        console.log('Connection string:', process.env.MONGODB_URI);
        
        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000
        });
        console.log('Successfully connected to MongoDB');

        console.log('Querying race results...');
        const raceResults = await RaceResult.find()
            .sort({ round: 1 })
            .lean();

        if (raceResults.length === 0) {
            console.log('No race results found in the database');
            return;
        }

        console.log(`Found ${raceResults.length} race results`);
        
        // Debug: Print the structure of the first race result
        console.log('\nFirst race result structure:', JSON.stringify(raceResults[0], null, 2));

        // Display race results in a table format
        console.log('\nRace Results:');
        console.log('='.repeat(100));

        raceResults.forEach(race => {
            console.log(`\nRace: ${race.raceName} (Round ${race.round})`);
            console.log('-'.repeat(100));
            console.log('Driver | Team | Position | Points | Status');
            console.log('-'.repeat(100));
            
            if (race.results && Array.isArray(race.results)) {
                const sortedResults = [...race.results].sort((a, b) => 
                    (a.position || 999) - (b.position || 999)
                );
                
                sortedResults.forEach(result => {
                    if (result && typeof result === 'object') {
                        const driver = result.driver || 'N/A';
                        const team = result.team || 'N/A';
                        const position = result.position || 'N/A';
                        const points = result.points || 0;
                        const status = result.status || 'N/A';

                        console.log(
                            `${driver.padEnd(20)} | ${team.padEnd(15)} | ` +
                            `${position.toString().padStart(8)} | ${points.toString().padStart(6)} | ${status}`
                        );
                    }
                });
            } else {
                console.log('No results available for this race');
            }

            // Display sprint results if available
            if (race.sprintResults && Array.isArray(race.sprintResults) && race.sprintResults.length > 0) {
                console.log(`\nSprint Results:`);
                console.log('-'.repeat(100));
                console.log('Driver | Team | Position | Points');
                console.log('-'.repeat(100));

                const sortedSprintResults = [...race.sprintResults].sort((a, b) => 
                    (a.position || 999) - (b.position || 999)
                );

                sortedSprintResults.forEach(result => {
                    if (result && typeof result === 'object') {
                        const driver = result.driver || 'N/A';
                        const team = result.team || 'N/A';
                        const position = result.position || 'N/A';
                        const points = result.points || 0;

                        console.log(
                            `${driver.padEnd(20)} | ${team.padEnd(15)} | ` +
                            `${position.toString().padStart(8)} | ${points.toString().padStart(6)}`
                        );
                    }
                });
            }
        });

    } catch (error) {
        console.error('Error:', error.message);
        if (error.name === 'MongoServerSelectionError') {
            console.error('Could not connect to MongoDB. Please ensure MongoDB is running on localhost:27017');
        }
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
    }
}

checkRaceResults(); 