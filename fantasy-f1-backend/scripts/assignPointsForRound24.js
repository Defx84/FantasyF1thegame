require('dotenv').config();
const mongoose = require('mongoose');
const RaceResult = require('../src/models/RaceResult');
const RaceSelection = require('../src/models/RaceSelection');
const League = require('../src/models/League');
const ScoringService = require('../src/services/ScoringService');
const LeaderboardService = require('../src/services/LeaderboardService');

const ROUND = 24; // Abu Dhabi GP

async function assignPointsForRound24() {
    try {
        console.log(`🎯 Starting points assignment for Round ${ROUND} (Abu Dhabi GP)...\n`);
        
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');
        
        // Find the race result
        const raceResult = await RaceResult.findOne({ round: ROUND });
        if (!raceResult) {
            console.error(`❌ Race result not found for round ${ROUND}`);
            process.exit(1);
        }
        
        console.log(`📊 Race: ${raceResult.raceName} (Round ${ROUND})`);
        console.log(`   Status: ${raceResult.status}`);
        console.log(`   Results count: ${raceResult.results?.length || 0}`);
        console.log(`   Team results count: ${raceResult.teamResults?.length || 0}`);
        console.log(`   Sprint weekend: ${raceResult.isSprintWeekend}\n`);
        
        // Validate race is completed
        if (raceResult.status !== 'completed') {
            console.error(`❌ Race is not completed (status: ${raceResult.status}). Cannot assign points.`);
            process.exit(1);
        }
        
        // Validate race has results
        if (!raceResult.results || raceResult.results.length === 0) {
            console.error(`❌ Race has no results. Cannot assign points.`);
            process.exit(1);
        }
        
        if (!raceResult.teamResults || raceResult.teamResults.length === 0) {
            console.error(`❌ Race has no team results. Cannot assign points.`);
            process.exit(1);
        }
        
        // Find all leagues that have selections for this round
        const leagueIds = await RaceSelection.find({ round: ROUND })
            .distinct('league');
        
        console.log(`🏆 Found ${leagueIds.length} leagues with selections for round ${ROUND}\n`);
        
        if (leagueIds.length === 0) {
            console.log('⚠️ No leagues found with selections for this round.');
            await mongoose.disconnect();
            return;
        }
        
        // Initialize services
        const scoringService = new ScoringService();
        const leaderboardService = new LeaderboardService();
        
        // Process each league
        let totalUpdated = 0;
        let totalSkipped = 0;
        let totalNoSelection = 0;
        
        for (const leagueId of leagueIds) {
            const league = await League.findById(leagueId).populate('members');
            if (!league) {
                console.error(`❌ League not found: ${leagueId}`);
                continue;
            }
            
            console.log(`\n📋 Processing league: ${league.name} (${league.members.length} members)`);
            
            let updatedCount = 0;
            let skippedCount = 0;
            let noSelectionCount = 0;
            
            for (const member of league.members) {
                // Find selection for this user, league, and round
                const selection = await RaceSelection.findOne({
                    user: member._id,
                    league: leagueId,
                    round: ROUND
                });
                
                if (!selection) {
                    noSelectionCount++;
                    continue;
                }
                
                // Skip empty selections (no drivers or team selected)
                if (!selection.mainDriver || !selection.reserveDriver || !selection.team) {
                    noSelectionCount++;
                    console.log(`   ⚠️  Skipping ${member.username} - empty selection (no drivers/team selected)`);
                    continue;
                }
                
                // Check if points should be assigned
                const shouldAssign = !selection.pointBreakdown || 
                                   selection.status === 'empty' || 
                                   selection.status === 'user-submitted';
                
                if (!shouldAssign) {
                    skippedCount++;
                    console.log(`   ⏭️  Skipping ${member.username} - points already assigned (status: ${selection.status}, points: ${selection.points})`);
                    continue;
                }
                
                // Calculate points
                console.log(`   🔄 Processing ${member.username}:`);
                console.log(`      Selection: ${selection.mainDriver} (main), ${selection.reserveDriver} (reserve), ${selection.team} (team)`);
                console.log(`      Current status: ${selection.status}`);
                
                const pointsData = scoringService.calculateRacePoints({
                    mainDriver: selection.mainDriver,
                    reserveDriver: selection.reserveDriver,
                    team: selection.team
                }, raceResult);
                
                // Update selection
                selection.points = pointsData.totalPoints;
                selection.pointBreakdown = pointsData.breakdown;
                selection.status = 'admin-assigned';
                // Note: Not setting isAdminAssigned=true for automated assignments
                // as it requires assignedBy field which we don't have for automated process
                selection.assignedAt = new Date();
                await selection.save();
                
                updatedCount++;
                console.log(`      ✅ Assigned ${pointsData.totalPoints} points`);
                console.log(`         Breakdown: Main ${pointsData.breakdown.mainDriverPoints}, Reserve ${pointsData.breakdown.reserveDriverPoints}, Team ${pointsData.breakdown.teamPoints}`);
            }
            
            // Update leaderboard for this league
            if (updatedCount > 0) {
                await leaderboardService.updateStandings(leagueId);
                console.log(`   📊 Updated leaderboard for ${league.name}`);
            }
            
            console.log(`   📈 Summary for ${league.name}:`);
            console.log(`      ✅ Updated: ${updatedCount}`);
            console.log(`      ⏭️  Skipped: ${skippedCount}`);
            console.log(`      ❌ No selection: ${noSelectionCount}`);
            
            totalUpdated += updatedCount;
            totalSkipped += skippedCount;
            totalNoSelection += noSelectionCount;
        }
        
        // Final summary
        console.log(`\n${'='.repeat(70)}`);
        console.log(`🎉 Points assignment completed for Round ${ROUND}!`);
        console.log(`${'='.repeat(70)}`);
        console.log(`   ✅ Total updated: ${totalUpdated}`);
        console.log(`   ⏭️  Total skipped: ${totalSkipped}`);
        console.log(`   ❌ Total no selection: ${totalNoSelection}`);
        console.log(`${'='.repeat(70)}\n`);
        
    } catch (error) {
        console.error('❌ Error assigning points:', error);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

// Run the script
assignPointsForRound24();

