/**
 * Script to mark all active leagues as completed for a finished season
 * This updates the league status without sending emails (emails are sent on December 8th)
 * Usage: node scripts/markLeaguesAsCompleted.js [season]
 * Example: node scripts/markLeaguesAsCompleted.js 2025
 */

require('dotenv').config();
const mongoose = require('mongoose');
const League = require('../src/models/League');
const RaceResult = require('../src/models/RaceResult');
const { isSeasonComplete, updateLeagueWithFinalStandings } = require('../src/controllers/seasonController');

async function markLeaguesAsCompleted() {
    try {
        // Get season from command line or use current year
        const season = parseInt(process.argv[2]) || new Date().getFullYear();

        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        console.log(`📅 Checking season ${season} completion status...\n`);

        // Check if season is complete
        const seasonComplete = await isSeasonComplete(season);
        
        if (!seasonComplete) {
            // Show race status
            const allRaces = await RaceResult.find({ season });
            const completedRaces = allRaces.filter(r => r.status === 'completed').length;
            const totalRaces = allRaces.length;
            
            console.log(`❌ Season ${season} is not yet complete!`);
            console.log(`   Completed races: ${completedRaces}/${totalRaces}`);
            console.log(`\n   Races status:`);
            for (const race of allRaces) {
                const statusIcon = race.status === 'completed' ? '✅' : '⏳';
                console.log(`   ${statusIcon} Round ${race.round}: ${race.raceName} - ${race.status}`);
            }
            process.exit(1);
        }

        console.log(`✅ Season ${season} is complete! All races are finished.\n`);

        // Find all active leagues for this season
        const leagues = await League.find({ 
            season: season,
            seasonStatus: { $ne: 'completed' }
        }).populate('owner', 'username');

        if (leagues.length === 0) {
            console.log(`ℹ️  No active leagues found for season ${season}. All leagues are already marked as completed.`);
            process.exit(0);
        }

        console.log(`📊 Found ${leagues.length} active league(s) to mark as completed:\n`);
        leagues.forEach(league => {
            console.log(`   - ${league.name} (Owner: ${league.owner?.username || 'Unknown'})`);
        });
        console.log('');

        // Process each league (skip email sending - that happens on December 8th)
        let successCount = 0;
        let errorCount = 0;

        for (const league of leagues) {
            try {
                console.log(`📄 Processing league: ${league.name}...`);
                await updateLeagueWithFinalStandings(league._id, season, true); // true = skip email
                console.log(`✅ League "${league.name}" marked as completed\n`);
                successCount++;
            } catch (leagueError) {
                console.error(`❌ Error processing league "${league.name}":`, leagueError.message);
                console.error('');
                errorCount++;
            }
        }

        console.log(`\n🏁 Processing finished:`);
        console.log(`   ✅ Successfully updated: ${successCount} league(s)`);
        if (errorCount > 0) {
            console.log(`   ❌ Errors: ${errorCount} league(s)`);
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}

// Run the script
markLeaguesAsCompleted();

