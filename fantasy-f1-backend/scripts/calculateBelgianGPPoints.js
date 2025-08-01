require('dotenv').config();
const mongoose = require('mongoose');
const RaceResult = require('../src/models/RaceResult');
const RaceSelection = require('../src/models/RaceSelection');
const League = require('../src/models/League');

async function calculateBelgianGPPoints() {
    try {
        console.log('🎯 Calculating Belgian GP points...');
        
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
        
        // Get Belgian GP selections
        const selections = await RaceSelection.find({ round: 13 });
        console.log(`\n🏁 Found ${selections.length} selections for Belgian GP`);
        
        let validSelections = 0;
        let totalPointsCalculated = 0;
        
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
            let pointBreakdown = {
                mainDriver: selection.mainDriver || '',
                reserveDriver: selection.reserveDriver || '',
                team: selection.team || '',
                isSprintWeekend: belgianGP.isSprintWeekend || false,
                mainDriverPoints: 0,
                reserveDriverPoints: 0,
                teamPoints: 0
            };
            
            // Main driver points
            if (selection.mainDriver) {
                const mainDriverResult = belgianGP.results.find(r => 
                    r.driver.toLowerCase() === selection.mainDriver.toLowerCase()
                );
                if (mainDriverResult) {
                    points += mainDriverResult.points || 0;
                    pointBreakdown.mainDriverPoints = mainDriverResult.points || 0;
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
                    pointBreakdown.reserveDriverPoints = reserveDriverResult.points || 0;
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
                    pointBreakdown.teamPoints = teamResult.totalPoints || 0;
                    console.log(`Team (${selection.team}): +${teamResult.totalPoints || 0} points`);
                } else {
                    console.log(`Team (${selection.team}): Not found in team results`);
                }
            }
            
            console.log(`Total points: ${points}`);
            console.log(`Breakdown: Main ${pointBreakdown.mainDriverPoints} + Reserve ${pointBreakdown.reserveDriverPoints} + Team ${pointBreakdown.teamPoints}`);
            
            totalPointsCalculated += points;
            
            // Update the selection with points
            selection.points = points;
            selection.pointBreakdown = pointBreakdown;
            await selection.save();
        }
        
        console.log(`\n🎉 Points calculation completed!`);
        console.log(`Valid selections processed: ${validSelections}`);
        console.log(`Total points calculated: ${totalPointsCalculated}`);
        console.log(`Average points per selection: ${validSelections > 0 ? (totalPointsCalculated / validSelections).toFixed(2) : 0}`);
        
    } catch (error) {
        console.error('❌ Error calculating points:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

// Run the script
calculateBelgianGPPoints(); 