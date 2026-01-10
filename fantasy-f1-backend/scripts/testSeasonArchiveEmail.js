/**
 * Script to test and manually trigger season archive email sending
 * This will help diagnose why emails weren't sent
 * Usage: node scripts/testSeasonArchiveEmail.js [season]
 */

require('dotenv').config();
const mongoose = require('mongoose');
const League = require('../src/models/League');
const RaceResult = require('../src/models/RaceResult');
const { isSeasonComplete } = require('../src/controllers/seasonController');
const { getSeasonArchiveData } = require('../src/utils/seasonArchiveData');
const { generateSeasonArchivePdf } = require('../src/utils/seasonArchivePdf');
const { sendSeasonArchiveToLeague } = require('../src/utils/email');

async function testSeasonArchiveEmail() {
    try {
        const season = parseInt(process.argv[2]) || new Date().getFullYear();

        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        console.log(`📅 Testing season ${season} archive email process...\n`);

        // Check if season is complete
        console.log('1️⃣ Checking if season is complete...');
        const seasonComplete = await isSeasonComplete(season);
        console.log(`   Season complete: ${seasonComplete}\n`);

        if (!seasonComplete) {
            const allRaces = await RaceResult.find({ season });
            const completedRaces = allRaces.filter(r => r.status === 'completed').length;
            const totalRaces = allRaces.length;
            console.log(`   ⚠️ Season not complete: ${completedRaces}/${totalRaces} races completed\n`);
        }

        // Find completed leagues
        console.log('2️⃣ Finding completed leagues...');
        const leagues = await League.find({ 
            season: season,
            seasonStatus: 'completed',
            finalStandings: { $exists: true }
        }).populate('members', 'email username');

        console.log(`   Found ${leagues.length} completed league(s)\n`);

        if (leagues.length === 0) {
            console.log('   ⚠️ No completed leagues found. Checking all leagues...\n');
            const allLeagues = await League.find({ season: season });
            console.log(`   Total leagues for season ${season}: ${allLeagues.length}`);
            allLeagues.forEach(league => {
                console.log(`   - ${league.name}: status=${league.seasonStatus}, hasFinalStandings=${!!league.finalStandings}`);
            });
            process.exit(0);
        }

        // Test with first league
        const testLeague = leagues[0];
        console.log(`3️⃣ Testing with league: ${testLeague.name}`);
        console.log(`   Members: ${testLeague.members.length}`);
        console.log(`   Member emails: ${testLeague.members.map(m => m.email || 'NO EMAIL').join(', ')}\n`);

        // Check if members have emails
        const membersWithEmails = testLeague.members.filter(m => m.email);
        if (membersWithEmails.length === 0) {
            console.log('   ❌ No members have email addresses!');
            process.exit(1);
        }

        console.log(`4️⃣ Getting season archive data...`);
        const seasonData = await getSeasonArchiveData(testLeague._id, season);
        console.log(`   ✅ Season data retrieved`);
        console.log(`   League name: ${seasonData.league.name}`);
        console.log(`   League members: ${seasonData.league.members?.length || 0}\n`);

        console.log(`5️⃣ Generating PDF...`);
        const pdfBuffer = await generateSeasonArchivePdf(seasonData.league, seasonData);
        console.log(`   ✅ PDF generated (${pdfBuffer.length} bytes)\n`);

        console.log(`6️⃣ Sending email...`);
        await sendSeasonArchiveToLeague(seasonData.league, pdfBuffer);
        console.log(`   ✅ Email sending process completed\n`);

        console.log('✅ Test completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error during test:', error);
        console.error('Stack:', error.stack);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}

// Run the test
testSeasonArchiveEmail();


