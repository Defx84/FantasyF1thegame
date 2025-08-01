require('dotenv').config();
const mongoose = require('mongoose');
const RaceResult = require('../src/models/RaceResult');
const { calculateTeamPoints } = require('../src/utils/scoringUtils');

async function fixBelgianGPTeamResults() {
    try {
        console.log('🔧 Fixing Belgian GP team results...');
        
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
        
        if (!belgianGP.results || belgianGP.results.length === 0) {
            console.log('❌ No race results found');
            return;
        }
        
        // Calculate team results for race
        console.log('\n1️⃣ Calculating team results for race...');
        const raceTeamResults = calculateTeamPoints(belgianGP.results);
        console.log(`Race team results: ${raceTeamResults.length} teams`);
        
        // Calculate team results for sprint
        let sprintTeamResults = [];
        if (belgianGP.sprintResults && belgianGP.sprintResults.length > 0) {
            console.log('\n2️⃣ Calculating team results for sprint...');
            sprintTeamResults = calculateTeamPoints(belgianGP.sprintResults);
            console.log(`Sprint team results: ${sprintTeamResults.length} teams`);
        }
        
        // Merge team results
        console.log('\n3️⃣ Merging team results...');
        const allTeamResults = [...raceTeamResults, ...sprintTeamResults];
        
        // Group by team and sum points
        const teamPointsMap = new Map();
        
        allTeamResults.forEach(result => {
            const team = result.team;
            if (!teamPointsMap.has(team)) {
                teamPointsMap.set(team, {
                    team: team,
                    racePoints: 0,
                    sprintPoints: 0,
                    totalPoints: 0
                });
            }
            
            const teamData = teamPointsMap.get(team);
            if (result.type === 'sprint') {
                teamData.sprintPoints += result.points || 0;
            } else {
                teamData.racePoints += result.points || 0;
            }
            teamData.totalPoints = teamData.racePoints + teamData.sprintPoints;
        });
        
        const finalTeamResults = Array.from(teamPointsMap.values())
            .sort((a, b) => b.totalPoints - a.totalPoints)
            .map((team, index) => ({
                ...team,
                position: index + 1
            }));
        
        console.log(`Final team results: ${finalTeamResults.length} teams`);
        console.log('\n🏆 Top 5 teams:');
        finalTeamResults.slice(0, 5).forEach(team => {
            console.log(`${team.position}. ${team.team} - Race: ${team.racePoints}, Sprint: ${team.sprintPoints}, Total: ${team.totalPoints}`);
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
        
    } catch (error) {
        console.error('❌ Error fixing team results:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

// Run the script
fixBelgianGPTeamResults(); 