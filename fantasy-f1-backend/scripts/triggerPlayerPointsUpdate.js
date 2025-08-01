require('dotenv').config();
const mongoose = require('mongoose');
const RaceResult = require('../src/models/RaceResult');
const League = require('../src/models/League');
const User = require('../src/models/User');
const RaceSelection = require('../src/models/RaceSelection');
const LeagueLeaderboard = require('../src/models/LeagueLeaderboard');

async function triggerPlayerPointsUpdate() {
    try {
        console.log('🎯 Triggering player points update for Belgian GP...');
        
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
        
        // Get all leagues
        const leagues = await League.find({});
        console.log(`\n🏆 Found ${leagues.length} leagues`);
        
        let totalPlayersUpdated = 0;
        
        for (const league of leagues) {
            console.log(`\n📋 Processing league: ${league.name}`);
            
            // Get all users in this league
            const users = await User.find({ 
                'leagueSelections.leagueId': league._id.toString() 
            });
            console.log(`Users in league: ${users.length}`);
            
            for (const user of users) {
                // Get user's selection for Belgian GP (round 13) using the built-in method
                const selection = user.getSelections(league._id, 13);
                
                if (selection) {
                    console.log(`\n👤 Processing user: ${user.username}`);
                    console.log(`Selection: ${selection.mainDriver} (main), ${selection.reserveDriver} (reserve), ${selection.team} (team)`);
                    
                    // Calculate points
                    let points = 0;
                    
                    // Main driver points
                    const mainDriverResult = belgianGP.results.find(r => 
                        r.driver.toLowerCase() === selection.mainDriver.toLowerCase()
                    );
                    if (mainDriverResult) {
                        points += mainDriverResult.points || 0;
                        console.log(`Main driver (${selection.mainDriver}): +${mainDriverResult.points || 0} points`);
                    }
                    
                    // Reserve driver points
                    const reserveDriverResult = belgianGP.results.find(r => 
                        r.driver.toLowerCase() === selection.reserveDriver.toLowerCase()
                    );
                    if (reserveDriverResult) {
                        points += reserveDriverResult.points || 0;
                        console.log(`Reserve driver (${selection.reserveDriver}): +${reserveDriverResult.points || 0} points`);
                    }
                    
                    // Team points
                    const teamResult = belgianGP.teamResults.find(t => 
                        t.team.toLowerCase() === selection.team.toLowerCase()
                    );
                    if (teamResult) {
                        points += teamResult.totalPoints || 0;
                        console.log(`Team (${selection.team}): +${teamResult.totalPoints || 0} points`);
                    }
                    
                    // Update user's race history
                    const oldPoints = user.raceHistory.find(r => r.round === 13)?.points || 0;
                    
                    // Add or update race history entry
                    const existingHistoryIndex = user.raceHistory.findIndex(r => r.round === 13);
                    if (existingHistoryIndex >= 0) {
                        user.raceHistory[existingHistoryIndex].points = points;
                    } else {
                        user.raceHistory.push({
                            round: 13,
                            points: points,
                            breakdown: {
                                mainDriver: mainDriverResult?.points || 0,
                                reserveDriver: reserveDriverResult?.points || 0,
                                team: teamResult?.totalPoints || 0
                            }
                        });
                    }
                    
                    await user.save();
                    
                    console.log(`Race points: ${oldPoints} → ${points} (+${points - oldPoints})`);
                    totalPlayersUpdated++;
                    
                } else {
                    console.log(`⚠️ No selection found for user: ${user.username}`);
                }
            }
            
            // Update league leaderboard
            const updatedUsers = await User.find({ 
                'leagueSelections.leagueId': league._id.toString() 
            });
            
            // Calculate total points for each user
            const userStandings = updatedUsers.map(user => {
                const totalPoints = user.raceHistory.reduce((sum, race) => sum + (race.points || 0), 0);
                return {
                    user,
                    totalPoints
                };
            }).sort((a, b) => b.totalPoints - a.totalPoints);
            
            const standings = userStandings.map((userStanding, index) => ({
                position: index + 1,
                playerId: userStanding.user._id,
                username: userStanding.user.username,
                points: userStanding.totalPoints
            }));
            
            await LeagueLeaderboard.findOneAndUpdate(
                { leagueId: league._id },
                { $set: { standings } },
                { upsert: true }
            );
            
            console.log(`✅ Updated leaderboard for league: ${league.name}`);
        }
        
        console.log(`\n🎉 Player points update completed!`);
        console.log(`Total players updated: ${totalPlayersUpdated}`);
        
    } catch (error) {
        console.error('❌ Error updating player points:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

// Run the script
triggerPlayerPointsUpdate(); 