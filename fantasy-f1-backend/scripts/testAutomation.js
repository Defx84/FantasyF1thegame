const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const RaceResult = require('../src/models/RaceResult');
const RaceSelection = require('../src/models/RaceSelection');
const League = require('../src/models/League');
const ScoringService = require('../src/services/ScoringService');
const LeaderboardService = require('../src/services/LeaderboardService');

async function testAutomation() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database');

    // Test parameters
    const testRound = 1; // Change this to test different rounds
    console.log(`\n🧪 Testing automation for round ${testRound}`);

    // Check if race result exists and is completed
    const raceResult = await RaceResult.findOne({ round: testRound });
    if (!raceResult) {
      console.log(`❌ No race result found for round ${testRound}`);
      return;
    }

    console.log(`📊 Race: ${raceResult.raceName} (Round ${testRound})`);
    console.log(`📊 Status: ${raceResult.status}`);
    console.log(`📊 Results count: ${raceResult.results?.length || 0}`);
    console.log(`📊 Team results count: ${raceResult.teamResults?.length || 0}`);

    if (raceResult.status !== 'completed') {
      console.log(`⚠️ Race is not completed (status: ${raceResult.status})`);
      console.log('💡 Automation will only run when race status is "completed"');
    }

    // Check race selections
    const selections = await RaceSelection.find({ round: testRound });
    console.log(`\n📋 Found ${selections.length} race selections for round ${testRound}`);

    // Analyze selection statuses
    const statusCounts = {};
    selections.forEach(selection => {
      statusCounts[selection.status] = (statusCounts[selection.status] || 0) + 1;
    });

    console.log('📊 Selection status breakdown:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}`);
    });

    // Check which selections would be processed by automation
    const scoringService = new ScoringService();
    let processableCount = 0;
    let alreadyProcessedCount = 0;

    for (const selection of selections) {
      const shouldProcess = !selection.pointBreakdown || 
                           selection.status === 'empty' || 
                           selection.status === 'user-submitted';
      
      if (shouldProcess) {
        processableCount++;
        console.log(`✅ Would process: User ${selection.user} (status: ${selection.status})`);
      } else {
        alreadyProcessedCount++;
        console.log(`⏭️ Already processed: User ${selection.user} (status: ${selection.status}, points: ${selection.points})`);
      }
    }

    console.log(`\n📈 Summary:`);
    console.log(`   Processable selections: ${processableCount}`);
    console.log(`   Already processed: ${alreadyProcessedCount}`);

    if (processableCount > 0 && raceResult.status === 'completed') {
      console.log(`\n🚀 Automation should process ${processableCount} selections for this round`);
    } else if (raceResult.status !== 'completed') {
      console.log(`\n⏳ Automation will trigger when race status becomes "completed"`);
    } else {
      console.log(`\n✅ All selections already processed`);
    }

    // Test points calculation for one selection
    if (selections.length > 0) {
      const testSelection = selections[0];
      console.log(`\n🧮 Testing points calculation for user ${testSelection.user}:`);
      console.log(`   Main Driver: ${testSelection.mainDriver}`);
      console.log(`   Reserve Driver: ${testSelection.reserveDriver}`);
      console.log(`   Team: ${testSelection.team}`);

      try {
        const pointsData = scoringService.calculateRacePoints({
          mainDriver: testSelection.mainDriver,
          reserveDriver: testSelection.reserveDriver,
          team: testSelection.team
        }, raceResult);

        console.log(`   Calculated points: ${pointsData.totalPoints}`);
        console.log(`   Breakdown:`, pointsData.breakdown);
      } catch (error) {
        console.log(`   ❌ Error calculating points: ${error.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Error testing automation:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from database');
  }
}

// Run the test
testAutomation(); 