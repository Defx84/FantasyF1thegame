const mongoose = require('mongoose');
const UsedSelection = require('../src/models/UsedSelection');
const User = require('../src/models/User');
const League = require('../src/models/League');
require('dotenv').config();

async function checkUsedSelections() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all UsedSelection documents
    const usedSelections = await UsedSelection.find({})
      .populate('user', 'username')
      .populate('league', 'name')
      .lean();

    console.log(`📊 Found ${usedSelections.length} UsedSelection documents\n`);

    if (usedSelections.length === 0) {
      console.log('❌ No UsedSelection documents found');
      await mongoose.disconnect();
      return;
    }

    // Analyze each UsedSelection
    for (const usedSelection of usedSelections) {
      console.log('='.repeat(70));
      console.log(`👤 User: ${usedSelection.user?.username || 'Unknown'} (${usedSelection.user?._id})`);
      console.log(`🏆 League: ${usedSelection.league?.name || 'Unknown'} (${usedSelection.league?._id})`);
      console.log('='.repeat(70));

      // Main Driver Cycles
      console.log('\n📋 MAIN DRIVER CYCLES:');
      console.log(`   Total cycles: ${usedSelection.mainDriverCycles?.length || 0}`);
      if (usedSelection.mainDriverCycles && usedSelection.mainDriverCycles.length > 0) {
        usedSelection.mainDriverCycles.forEach((cycle, index) => {
          const isLastCycle = index === usedSelection.mainDriverCycles.length - 1;
          const cycleLabel = isLastCycle ? '🔄 CURRENT CYCLE' : `   Cycle ${index}`;
          console.log(`   ${cycleLabel}: ${cycle.length} drivers`);
          if (cycle.length > 0) {
            console.log(`      Drivers: ${cycle.join(', ')}`);
          }
          if (cycle.length === 20 && isLastCycle) {
            console.log(`      ⚠️  WARNING: Current cycle has 20 drivers but new cycle not created!`);
          }
        });
        
        const lastCycleIndex = usedSelection.mainDriverCycles.length - 1;
        const lastCycle = usedSelection.mainDriverCycles[lastCycleIndex];
        const secondLastCycle = usedSelection.mainDriverCycles.length > 1 
          ? usedSelection.mainDriverCycles[usedSelection.mainDriverCycles.length - 2]
          : null;
        
        console.log(`\n   🔍 Analysis:`);
        console.log(`      Last cycle index: ${lastCycleIndex}`);
        console.log(`      Last cycle length: ${lastCycle?.length || 0}`);
        if (secondLastCycle) {
          console.log(`      Second-to-last cycle length: ${secondLastCycle.length}`);
          if (secondLastCycle.length === 20 && lastCycle.length > 0) {
            console.log(`      ⚠️  ISSUE: Previous cycle has 20 drivers, but current cycle is not empty!`);
            console.log(`      Current cycle drivers: ${lastCycle.join(', ')}`);
          }
        }
        if (lastCycle.length === 20) {
          console.log(`      ⚠️  ISSUE: Current cycle has exactly 20 drivers - should have created new cycle!`);
        }
      } else {
        console.log('   No cycles found');
      }

      // Reserve Driver Cycles
      console.log('\n📋 RESERVE DRIVER CYCLES:');
      console.log(`   Total cycles: ${usedSelection.reserveDriverCycles?.length || 0}`);
      if (usedSelection.reserveDriverCycles && usedSelection.reserveDriverCycles.length > 0) {
        usedSelection.reserveDriverCycles.forEach((cycle, index) => {
          const isLastCycle = index === usedSelection.reserveDriverCycles.length - 1;
          const cycleLabel = isLastCycle ? '🔄 CURRENT CYCLE' : `   Cycle ${index}`;
          console.log(`   ${cycleLabel}: ${cycle.length} drivers`);
          if (cycle.length > 0) {
            console.log(`      Drivers: ${cycle.join(', ')}`);
          }
        });
        
        const lastCycleIndex = usedSelection.reserveDriverCycles.length - 1;
        const lastCycle = usedSelection.reserveDriverCycles[lastCycleIndex];
        console.log(`\n   🔍 Analysis:`);
        console.log(`      Last cycle index: ${lastCycleIndex}`);
        console.log(`      Last cycle length: ${lastCycle?.length || 0}`);
        if (lastCycle.length === 20) {
          console.log(`      ⚠️  ISSUE: Current cycle has exactly 20 drivers - should have created new cycle!`);
        }
      } else {
        console.log('   No cycles found');
      }

      // Team Cycles
      console.log('\n📋 TEAM CYCLES:');
      console.log(`   Total cycles: ${usedSelection.teamCycles?.length || 0}`);
      if (usedSelection.teamCycles && usedSelection.teamCycles.length > 0) {
        usedSelection.teamCycles.forEach((cycle, index) => {
          const isLastCycle = index === usedSelection.teamCycles.length - 1;
          const cycleLabel = isLastCycle ? '🔄 CURRENT CYCLE' : `   Cycle ${index}`;
          console.log(`   ${cycleLabel}: ${cycle.length} teams`);
          if (cycle.length > 0) {
            console.log(`      Teams: ${cycle.join(', ')}`);
          }
        });
      } else {
        console.log('   No cycles found');
      }

      // Check what getUsedSelections would return
      console.log('\n📤 What getUsedSelections API would return:');
      const lastMainCycleIndex = (usedSelection.mainDriverCycles?.length || 0) - 1;
      const lastReserveCycleIndex = (usedSelection.reserveDriverCycles?.length || 0) - 1;
      const lastTeamCycleIndex = (usedSelection.teamCycles?.length || 0) - 1;
      
      const apiMainDrivers = (usedSelection.mainDriverCycles && lastMainCycleIndex >= 0) 
        ? usedSelection.mainDriverCycles[lastMainCycleIndex] || []
        : [];
      const apiReserveDrivers = (usedSelection.reserveDriverCycles && lastReserveCycleIndex >= 0)
        ? usedSelection.reserveDriverCycles[lastReserveCycleIndex] || []
        : [];
      const apiTeams = (usedSelection.teamCycles && lastTeamCycleIndex >= 0)
        ? usedSelection.teamCycles[lastTeamCycleIndex] || []
        : [];
      
      console.log(`   usedMainDrivers: [${apiMainDrivers.join(', ')}] (${apiMainDrivers.length} drivers)`);
      console.log(`   usedReserveDrivers: [${apiReserveDrivers.join(', ')}] (${apiReserveDrivers.length} drivers)`);
      console.log(`   usedTeams: [${apiTeams.join(', ')}] (${apiTeams.length} teams)`);
      
      if (apiMainDrivers.length > 0 && apiMainDrivers.length < 20) {
        console.log(`\n   ✅ Main drivers: ${20 - apiMainDrivers.length} remaining in current cycle`);
      } else if (apiMainDrivers.length === 20) {
        console.log(`\n   ⚠️  Main drivers: Cycle complete but new cycle not created!`);
      } else if (apiMainDrivers.length === 0 && (usedSelection.mainDriverCycles?.length || 0) > 1) {
        const previousCycle = usedSelection.mainDriverCycles[usedSelection.mainDriverCycles.length - 2];
        if (previousCycle && previousCycle.length === 20) {
          console.log(`\n   ✅ Main drivers: New cycle started correctly (previous cycle had 20 drivers)`);
        }
      }
      
      // Check for duplicate drivers across cycles
      if ((usedSelection.mainDriverCycles?.length || 0) > 1) {
        const lastCycle = usedSelection.mainDriverCycles[usedSelection.mainDriverCycles.length - 1];
        const secondLastCycle = usedSelection.mainDriverCycles[usedSelection.mainDriverCycles.length - 2];
        if (lastCycle && secondLastCycle && secondLastCycle.length === 20) {
          const duplicates = lastCycle.filter(driver => secondLastCycle.includes(driver));
          if (duplicates.length > 0) {
            console.log(`\n   🐛 BUG FOUND: Driver(s) ${duplicates.join(', ')} appear in BOTH the last cycle (${usedSelection.mainDriverCycles.length - 2}) and current cycle (${usedSelection.mainDriverCycles.length - 1})!`);
            console.log(`      This is the root cause - the 20th driver was added to both cycles.`);
          }
        }
      }

      console.log('\n');
    }

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkUsedSelections();

