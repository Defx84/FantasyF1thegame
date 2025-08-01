require('dotenv').config();
const mongoose = require('mongoose');
const RaceResult = require('../src/models/RaceResult');
const RaceSelection = require('../src/models/RaceSelection');

async function simpleBelgianGPPoints() {
    try {
        console.log('🎯 Calculating Belgian GP points (simple version)...');
        
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fantasy-f1');
        console.log('✅ Connected to MongoDB');
        
        // Get the Belgian GP
        const belgianGP = await RaceResult.findOne({ round: 13 });
        
        if (!belgianGP) {
            console.log('❌ Belgian GP not found');
            return;
        }
        
        console.log(`📊 Belgian GP status: ${belgianGP.status}`);
        console.log(`Race results: ${belgianGP.results?.length || 0}`);
        console.log(`Sprint results: ${belgianGP.sprintResults?.length || 0}`);
        console.log(`Team results: ${belgianGP.teamResults?.length || 0}`);
        
        // Get Belgian GP selections (without populate to avoid the hang)
        const selections = await RaceSelection.find({ round: 13 }).lean();
        console.log(`\n🏁 Found ${selections.length} selections for Belgian GP`);
        
        let validSelections = 0;
        let totalPointsCalculated = 0;
        
        console.log('\n📋 Processing selections:');
        
        for (const selection of selections) {
            // Skip selections with no data
            if (!selection.mainDriver && !selection.reserveDriver && !selection.team) {
                continue;
            }
            
            validSelections++;
            console.log(`\n👤 Selection ${validSelections}:`);
            console.log(`Main: ${selection.mainDriver || 'None'}`);
            console.log(`Reserve: ${selection.reserveDriver || 'None'}`);
            console.log(`Team: ${selection.team || 'None'}`);
            
            let points = 0;
            let breakdown = {
                mainDriver: 0,
                reserveDriver: 0,
                team: 0
            };
            
            // Main driver points
            if (selection.mainDriver) {
                const mainDriverResult = belgianGP.results.find(r => 
                    r.driver.toLowerCase() === selection.mainDriver.toLowerCase()
                );
                if (mainDriverResult) {
                    points += mainDriverResult.points || 0;
                    breakdown.mainDriver = mainDriverResult.points || 0;
                    console.log(`Main driver (${selection.mainDriver}): +${mainDriverResult.points || 0} points`);
                } else {
                    console.log(`Main driver (${selection.mainDriver}): Not found in results`);
                }
            }
            
            // Reserve driver points
            if (selection.reserveDriver) {
                const reserveDriverResult = belgianGP.results.find(r => 
                    r.driver.toLowerCase() === selection.reserveDriver.toLowerCase()
                );
                if (reserveDriverResult) {
                    points += reserveDriverResult.points || 0;
                    breakdown.reserveDriver = reserveDriverResult.points || 0;
                    console.log(`Reserve driver (${selection.reserveDriver}): +${reserveDriverResult.points || 0} points`);
                } else {
                    console.log(`Reserve driver (${selection.reserveDriver}): Not found in results`);
                }
            }
            
            // Team points
            if (selection.team) {
                const teamResult = belgianGP.teamResults.find(t => 
                    t.team.toLowerCase() === selection.team.toLowerCase()
                );
                if (teamResult) {
                    points += teamResult.totalPoints || 0;
                    breakdown.team = teamResult.totalPoints || 0;
                    console.log(`Team (${selection.team}): +${teamResult.totalPoints || 0} points`);
                } else {
                    console.log(`Team (${selection.team}): Not found in team results`);
                }
            }
            
            console.log(`Total points: ${points}`);
            console.log(`Breakdown: Main ${breakdown.mainDriver} + Reserve ${breakdown.reserveDriver} + Team ${breakdown.team}`);
            
            totalPointsCalculated += points;
        }
        
        console.log(`\n🎉 Points calculation completed!`);
        console.log(`Valid selections processed: ${validSelections}`);
        console.log(`Total points calculated: ${totalPointsCalculated}`);
        console.log(`Average points per selection: ${validSelections > 0 ? (totalPointsCalculated / validSelections).toFixed(2) : 0}`);
        
        // Show top teams from Belgian GP
        console.log(`\n🏆 Belgian GP Team Results:`);
        belgianGP.teamResults.slice(0, 5).forEach((team, index) => {
            console.log(`${index + 1}. ${team.team} - ${team.totalPoints} points (Race: ${team.racePoints}, Sprint: ${team.sprintPoints})`);
        });
        
    } catch (error) {
        console.error('❌ Error calculating points:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

// Run the script
simpleBelgianGPPoints(); 