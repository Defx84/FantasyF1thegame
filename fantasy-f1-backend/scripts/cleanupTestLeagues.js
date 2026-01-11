/**
 * Cleanup Test Leagues Script
 * 
 * This script removes all test leagues created by simulation scripts.
 * Targets leagues with names matching various test patterns:
 * - Comprehensive Season Test
 * - Multi-Player Season Test
 * - Season Test League
 * - Full Season Test
 * - Mystery Test League
 * - Test Card League
 * - Any league with "test" in the name
 */

require('dotenv').config();
const mongoose = require('mongoose');
const League = require('../src/models/League');
const RaceSelection = require('../src/models/RaceSelection');
const LeagueLeaderboard = require('../src/models/LeagueLeaderboard');
const UsedSelection = require('../src/models/UsedSelection');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fantasy-f1';

async function cleanupTestLeagues() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all test leagues with various naming patterns
    const testLeaguePatterns = [
      /^Comprehensive Season Test/i,
      /^Multi-Player Season Test/i,
      /^Season Test League/i,
      /^Full Season Test/i,
      /^Mystery Test League/i,
      /^Test Card League/i,
      /test.*league/i,
      /.*test.*season/i
    ];
    
    // Build query to match any test pattern
    const testLeagues = await League.find({
      $or: testLeaguePatterns.map(pattern => ({
        name: { $regex: pattern }
      }))
    });

    console.log(`📋 Found ${testLeagues.length} test league(s) to delete:\n`);

    if (testLeagues.length === 0) {
      console.log('✅ No test leagues found. Nothing to clean up.');
      await mongoose.disconnect();
      return;
    }

    // Display leagues to be deleted
    testLeagues.forEach((league, index) => {
      console.log(`${index + 1}. ${league.name}`);
      console.log(`   ID: ${league._id}`);
      console.log(`   Season: ${league.season}`);
      console.log(`   Created: ${league.createdAt}`);
      console.log(`   Members: ${league.members?.length || 0}`);
      console.log('');
    });

    // Confirm deletion
    console.log('⚠️  WARNING: This will permanently delete:');
    console.log('   - The league(s)');
    console.log('   - All race selections');
    console.log('   - All leaderboard data');
    console.log('   - All used selections');
    console.log('\nTo proceed, set CONFIRM_DELETE=true in your environment or modify this script.\n');

    // Check for confirmation (you can set CONFIRM_DELETE=true to auto-confirm)
    const confirmDelete = process.env.CONFIRM_DELETE === 'true';

    if (!confirmDelete) {
      console.log('❌ Deletion cancelled. Set CONFIRM_DELETE=true to proceed.');
      await mongoose.disconnect();
      return;
    }

    console.log('🗑️  Starting deletion...\n');

    let deletedCount = 0;
    let errorCount = 0;

    for (const league of testLeagues) {
      try {
        const leagueId = league._id.toString();
        
        console.log(`Deleting: ${league.name}...`);
        
        // Delete all related data
        const [selectionsDeleted, leaderboardsDeleted, usedSelectionsDeleted] = await Promise.all([
          RaceSelection.deleteMany({ league: leagueId }),
          LeagueLeaderboard.deleteMany({ league: leagueId }),
          UsedSelection.deleteMany({ league: leagueId })
        ]);

        // Delete the league itself
        await League.findByIdAndDelete(leagueId);

        console.log(`   ✅ Deleted league and related data:`);
        console.log(`      - Race selections: ${selectionsDeleted.deletedCount}`);
        console.log(`      - Leaderboards: ${leaderboardsDeleted.deletedCount}`);
        console.log(`      - Used selections: ${usedSelectionsDeleted.deletedCount}`);
        
        deletedCount++;
      } catch (error) {
        console.error(`   ❌ Error deleting ${league.name}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`✅ Cleanup complete!`);
    console.log(`   Deleted: ${deletedCount} league(s)`);
    if (errorCount > 0) {
      console.log(`   Errors: ${errorCount} league(s)`);
    }
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the cleanup
cleanupTestLeagues();
