/**
 * Script to preview the season archive PDF for a league
 * Usage: node scripts/previewSeasonArchive.js <leagueId> <season>
 * Example: node scripts/previewSeasonArchive.js 507f1f77bcf86cd799439011 2025
 */

require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');
const { getSeasonArchiveData } = require('../src/utils/seasonArchiveData');
const { generateSeasonArchivePdf } = require('../src/utils/seasonArchivePdf');

async function previewSeasonArchive() {
  try {
    // Get arguments
    const leagueId = process.argv[2];
    const season = parseInt(process.argv[3]) || new Date().getFullYear();

    if (!leagueId) {
      console.error('❌ Error: League ID is required');
      console.log('Usage: node scripts/previewSeasonArchive.js <leagueId> [season]');
      console.log('Example: node scripts/previewSeasonArchive.js 507f1f77bcf86cd799439011 2025');
      process.exit(1);
    }

    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log(`\n📊 Generating preview PDF for league: ${leagueId}, season: ${season}...`);

    // Get season data
    const seasonData = await getSeasonArchiveData(leagueId, season);
    console.log(`✅ Retrieved season data for league: ${seasonData.league.name}`);
    console.log(`   - Members: ${seasonData.league.members.length}`);
    console.log(`   - Races: ${seasonData.races.length}`);
    console.log(`   - Selections: ${seasonData.raceSelections.length}`);

    // Generate PDF
    const outputPath = path.join(
      __dirname,
      '..',
      'preview',
      `${seasonData.league.name.replace(/[^a-z0-9]/gi, '_')}_Season_${season}_Preview.pdf`
    );

    // Create preview directory if it doesn't exist
    const fs = require('fs');
    const previewDir = path.dirname(outputPath);
    if (!fs.existsSync(previewDir)) {
      fs.mkdirSync(previewDir, { recursive: true });
    }

    console.log('\n📄 Generating PDF...');
    const pdfBuffer = await generateSeasonArchivePdf(seasonData.league, seasonData, outputPath);

    console.log(`\n✅ PDF generated successfully!`);
    console.log(`📁 Saved to: ${outputPath}`);
    console.log(`📏 File size: ${(pdfBuffer.length / 1024).toFixed(2)} KB`);

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error generating preview PDF:', error);
    if (error.message.includes('League not found')) {
      console.error('   Make sure the league ID is correct');
    } else if (error.message.includes('No leaderboard found')) {
      console.error('   The league may not have any standings data yet');
    }
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
}

previewSeasonArchive();


