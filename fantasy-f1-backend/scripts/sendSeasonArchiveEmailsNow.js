/**
 * Script to manually trigger season archive email sending
 * Usage: node scripts/sendSeasonArchiveEmailsNow.js [season]
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

async function sendSeasonArchiveEmailsNow() {
    try {
        const season = parseInt(process.argv[2]) || new Date().getFullYear();

        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Import the processSeasonArchive function logic
        const { isSeasonComplete } = require('../src/controllers/seasonController');
        const League = require('../src/models/League');
        const { getSeasonArchiveData } = require('../src/utils/seasonArchiveData');
        const { generateSeasonArchivePdf } = require('../src/utils/seasonArchivePdf');
        const { sendSeasonArchiveToLeague } = require('../src/utils/email');

        console.log(`📅 Processing season ${season} archive emails...\n`);

        // Check if season is complete
        const seasonComplete = await isSeasonComplete(season);
        
        if (!seasonComplete) {
            console.log(`❌ Season ${season} is not yet complete! Cannot send archive emails.`);
            process.exit(1);
        }

        console.log(`✅ Season ${season} is complete!\n`);

        // Find all completed leagues for this season
        const leagues = await League.find({ 
            season: season,
            seasonStatus: 'completed',
            finalStandings: { $exists: true }
        }).populate('members', 'email username');

        if (leagues.length === 0) {
            console.log(`ℹ️  No completed leagues found for season ${season}.`);
            process.exit(0);
        }

        console.log(`📊 Found ${leagues.length} completed league(s) to send season archive emails:\n`);
        leagues.forEach(league => {
            console.log(`   - ${league.name} (${league.members.length} members)`);
        });
        console.log('');

        // Process each league - send emails only
        let successCount = 0;
        let errorCount = 0;

        for (const league of leagues) {
            try {
                console.log(`📄 Processing league: ${league.name}...`);
                
                const seasonData = await getSeasonArchiveData(league._id, season);
                const pdfBuffer = await generateSeasonArchivePdf(seasonData.league, seasonData);
                await sendSeasonArchiveToLeague(seasonData.league, pdfBuffer);
                
                console.log(`✅ Season archive email sent for league: ${league.name}\n`);
                successCount++;
            } catch (leagueError) {
                console.error(`❌ Error sending email for league "${league.name}":`, leagueError.message);
                console.error('Stack:', leagueError.stack);
                console.error('');
                errorCount++;
            }
        }

        console.log(`\n🏁 Email sending finished:`);
        console.log(`   ✅ Successfully sent: ${successCount} league(s)`);
        if (errorCount > 0) {
            console.log(`   ❌ Errors: ${errorCount} league(s)`);
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Fatal error:', error);
        console.error('Stack:', error.stack);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}

// Run the script
sendSeasonArchiveEmailsNow();

