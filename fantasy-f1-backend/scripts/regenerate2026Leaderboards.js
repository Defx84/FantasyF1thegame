const mongoose = require('mongoose');
const League = require('../src/models/League');
const LeagueLeaderboard = require('../src/models/LeagueLeaderboard');
const LeaderboardService = require('../src/services/LeaderboardService');
require('dotenv').config({ path: '.env' });

async function regenerate2026Leaderboards() {
    try {
        console.log('🔄 Regenerating leaderboards for all 2026 leagues...\n');
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Find all 2026 leagues
        const leagues2026 = await League.find({ season: 2026 });
        console.log(`Found ${leagues2026.length} leagues for 2026 season\n`);

        if (leagues2026.length === 0) {
            console.log('No 2026 leagues found. Nothing to regenerate.');
            await mongoose.disconnect();
            return;
        }

        const leaderboardService = new LeaderboardService();
        let successCount = 0;
        let errorCount = 0;
        const errors = [];

        for (const league of leagues2026) {
            try {
                console.log(`\n📊 Processing league: ${league.name} (ID: ${league._id})`);
                
                // Delete existing leaderboard to force regeneration
                const deleted = await LeagueLeaderboard.deleteMany({
                    league: league._id,
                    season: 2026
                });
                console.log(`   Deleted ${deleted.deletedCount} existing leaderboard(s)`);

                // Regenerate leaderboard using the fixed service
                console.log(`   Regenerating leaderboard...`);
                await leaderboardService.updateStandings(league._id.toString());

                // Verify the new leaderboard
                const newLeaderboard = await LeagueLeaderboard.findOne({
                    league: league._id,
                    season: 2026
                });

                if (newLeaderboard) {
                    const driverRaces = newLeaderboard.driverStandings.reduce((acc, standing) => {
                        standing.raceResults.forEach(result => {
                            if (!acc.includes(result.round)) {
                                acc.push(result.round);
                            }
                        });
                        return acc;
                    }, []);

                    console.log(`   ✅ Successfully regenerated`);
                    console.log(`   - Driver standings: ${newLeaderboard.driverStandings.length} players`);
                    console.log(`   - Constructor standings: ${newLeaderboard.constructorStandings.length} players`);
                    console.log(`   - Races included: ${driverRaces.length} (rounds: ${driverRaces.sort((a, b) => a - b).join(', ') || 'none'})`);
                    
                    // Check if any 2025 races are present (should be 0)
                    const raceResults2025 = await mongoose.connection.db.collection('raceresults').find({
                        season: 2025,
                        status: 'completed',
                        round: { $in: driverRaces }
                    }).toArray();
                    
                    if (raceResults2025.length > 0) {
                        console.log(`   ⚠️  WARNING: Found ${raceResults2025.length} 2025 race results that might be included!`);
                    } else {
                        console.log(`   ✅ Verified: No 2025 races included`);
                    }

                    successCount++;
                } else {
                    console.log(`   ⚠️  Warning: Leaderboard was not created`);
                    errorCount++;
                    errors.push({
                        league: league.name,
                        error: 'Leaderboard not created after regeneration'
                    });
                }

            } catch (error) {
                console.error(`   ❌ Error processing league ${league.name}:`, error.message);
                errorCount++;
                errors.push({
                    league: league.name,
                    error: error.message
                });
            }
        }

        console.log('\n' + '='.repeat(100));
        console.log('\n📊 Summary:');
        console.log(`   Total 2026 leagues: ${leagues2026.length}`);
        console.log(`   Successfully regenerated: ${successCount}`);
        console.log(`   Errors: ${errorCount}`);

        if (errors.length > 0) {
            console.log('\n❌ Errors encountered:');
            errors.forEach((err, index) => {
                console.log(`   ${index + 1}. ${err.league}: ${err.error}`);
            });
        }

        console.log('\n💡 All 2026 leaderboards have been regenerated with the fixed season filtering.');
        console.log('   Standings should now only show 2026 races that are actually completed.\n');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('✅ Disconnected from MongoDB');
    }
}

regenerate2026Leaderboards();

