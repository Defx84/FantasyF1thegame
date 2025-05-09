require('dotenv').config();
const mongoose = require('mongoose');
const RaceResult = require('../src/models/RaceResult');

async function fixTeamPoints() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fantasy-f1');
        console.log('Connected to MongoDB');

        // Get all race results
        const raceResults = await RaceResult.find({});
        console.log(`Found ${raceResults.length} race results to process`);

        // Process each race
        for (const race of raceResults) {
            console.log(`\nProcessing race: ${race.raceName} (Round ${race.round})`);
            console.log(`Sprint Weekend: ${race.isSprintWeekend}`);

            // Build race points aggregation
            const racePointsByTeam = {};
            race.results.forEach(result => {
                if (!result.team) return;
                racePointsByTeam[result.team] = (racePointsByTeam[result.team] || 0) + (result.points || 0);
            });

            // Build sprint points aggregation if it's a sprint weekend
            const sprintPointsByTeam = {};
            if (race.isSprintWeekend && race.sprintResults) {
                race.sprintResults.forEach(result => {
                    if (!result.team) return;
                    sprintPointsByTeam[result.team] = (sprintPointsByTeam[result.team] || 0) + (result.points || 0);
                });
            }

            // Merge into final team results
            const teamNames = new Set([
                ...Object.keys(racePointsByTeam),
                ...Object.keys(sprintPointsByTeam)
            ]);

            const updatedTeamResults = Array.from(teamNames).map(team => {
                const racePoints = racePointsByTeam[team] || 0;
                const sprintPoints = race.isSprintWeekend ? (sprintPointsByTeam[team] || 0) : 0;
                const totalPoints = racePoints + sprintPoints;

                // Log the points breakdown
                console.log(`${team}:`);
                console.log(`  Race Points: ${racePoints}`);
                console.log(`  Sprint Points: ${sprintPoints}`);
                console.log(`  Total Points: ${totalPoints}`);

                return {
                    team,
                    racePoints,
                    sprintPoints,
                    totalPoints
                };
            });

            // Compare with existing team results
            console.log('\nPoints changes:');
            race.teamResults.forEach(oldResult => {
                const newResult = updatedTeamResults.find(r => r.team === oldResult.team);
                if (newResult) {
                    const pointsChanged = 
                        oldResult.racePoints !== newResult.racePoints ||
                        oldResult.sprintPoints !== newResult.sprintPoints ||
                        oldResult.totalPoints !== newResult.totalPoints;

                    if (pointsChanged) {
                        console.log(`\n${oldResult.team} points updated:`);
                        console.log(`  Race: ${oldResult.racePoints} → ${newResult.racePoints}`);
                        console.log(`  Sprint: ${oldResult.sprintPoints} → ${newResult.sprintPoints}`);
                        console.log(`  Total: ${oldResult.totalPoints} → ${newResult.totalPoints}`);
                    }
                }
            });

            // Update the race with new team results
            await RaceResult.updateOne(
                { _id: race._id },
                { 
                    $set: { 
                        teamResults: updatedTeamResults,
                        updatedAt: new Date()
                    }
                }
            );
            console.log('\n✅ Updated team results saved to database');
        }

        console.log('\n🎉 All race results have been processed');
    } catch (error) {
        console.error('❌ Error fixing team points:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
    }
}

// Run the fix
fixTeamPoints(); 