require('dotenv').config();
const mongoose = require('mongoose');
const RaceResult = require('../src/models/RaceResult');

async function fixBelgianGPTeamResultsFinal() {
    try {
        console.log('🔧 Fixing Belgian GP team results (final version)...');
        
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fantasy-f1');
        console.log('✅ Connected to MongoDB');
        
        // Get the Belgian GP
        const belgianGP = await RaceResult.findOne({ round: 13 });
        
        if (!belgianGP) {
            console.log('❌ Belgian GP not found');
            return;
        }
        
        console.log(`📊 Current state:`);
        console.log(`Race results: ${belgianGP.results?.length || 0}`);
        console.log(`Sprint results: ${belgianGP.sprintResults?.length || 0}`);
        console.log(`Team results: ${belgianGP.teamResults?.length || 0}`);
        
        // Calculate team points from race results
        console.log('\n1️⃣ Calculating team points from race results...');
        const raceTeamPoints = {};
        
        belgianGP.results.forEach(result => {
            const team = result.team;
            if (!raceTeamPoints[team]) {
                raceTeamPoints[team] = 0;
            }
            raceTeamPoints[team] += result.points || 0;
        });
        
        console.log('Race team points:');
        Object.entries(raceTeamPoints).forEach(([team, points]) => {
            console.log(`  ${team}: ${points} points`);
        });
        
        // Calculate team points from sprint results
        console.log('\n2️⃣ Calculating team points from sprint results...');
        const sprintTeamPoints = {};
        
        belgianGP.sprintResults.forEach(result => {
            const team = result.team;
            if (!sprintTeamPoints[team]) {
                sprintTeamPoints[team] = 0;
            }
            sprintTeamPoints[team] += result.points || 0;
        });
        
        console.log('Sprint team points:');
        Object.entries(sprintTeamPoints).forEach(([team, points]) => {
            console.log(`  ${team}: ${points} points`);
        });
        
        // Combine and calculate total team points
        console.log('\n3️⃣ Combining team points...');
        const allTeams = new Set([
            ...Object.keys(raceTeamPoints),
            ...Object.keys(sprintTeamPoints)
        ]);
        
        const finalTeamResults = Array.from(allTeams).map(team => {
            const racePoints = raceTeamPoints[team] || 0;
            const sprintPoints = sprintTeamPoints[team] || 0;
            const totalPoints = racePoints + sprintPoints;
            
            return {
                team,
                racePoints,
                sprintPoints,
                totalPoints
            };
        }).sort((a, b) => b.totalPoints - a.totalPoints)
        .map((team, index) => ({
            ...team,
            position: index + 1
        }));
        
        console.log('\n🏆 Final team results:');
        finalTeamResults.forEach(team => {
            console.log(`${team.position}. ${team.team} - ${team.totalPoints} points (Race: ${team.racePoints}, Sprint: ${team.sprintPoints})`);
        });
        
        // Update the database
        console.log('\n4️⃣ Updating database...');
        const result = await RaceResult.updateOne(
            { round: 13 },
            { 
                $set: { 
                    teamResults: finalTeamResults,
                    updatedAt: new Date()
                }
            }
        );
        
        console.log(`✅ Updated Belgian GP: ${result.modifiedCount} document(s) modified`);
        
        // Verify the update
        const updatedRace = await RaceResult.findOne({ round: 13 });
        console.log('\n5️⃣ Verification:');
        console.log(`Team results count: ${updatedRace.teamResults?.length || 0}`);
        
        if (updatedRace.teamResults && updatedRace.teamResults.length > 0) {
            console.log('\n🏆 Updated team results:');
            updatedRace.teamResults.slice(0, 5).forEach(team => {
                console.log(`${team.position}. ${team.team} - ${team.totalPoints} points`);
            });
        }
        
    } catch (error) {
        console.error('❌ Error fixing team results:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

// Run the script
fixBelgianGPTeamResultsFinal(); 