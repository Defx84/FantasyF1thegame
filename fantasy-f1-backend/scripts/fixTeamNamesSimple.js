require('dotenv').config();
const mongoose = require('mongoose');
const RaceResult = require('../src/models/RaceResult');

async function fixTeamNamesSimple() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fantasy-f1');
    console.log('Connected to MongoDB');

    // Find all race results
    const raceResults = await RaceResult.find({});
    console.log(`Found ${raceResults.length} race results to check`);

    let updated = 0;
    for (const race of raceResults) {
      let changed = false;
      
      // Check race results
      if (race.results && Array.isArray(race.results)) {
        for (const result of race.results) {
          if (result.team) {
            // Manual team name mapping based on what we found
            let newTeam = result.team;
            if (result.team === 'Sauber') {
              newTeam = 'Stake F1 Team Kick Sauber';
            } else if (result.team === 'Racing Bulls') {
              newTeam = 'RB';
            } else if (result.team === 'Aston Martin Racing') {
              newTeam = 'Aston Martin';
            }
            
            if (newTeam !== result.team) {
              console.log(`  [${race.raceName}] Driver ${result.driver}: "${result.team}" -> "${newTeam}"`);
              result.team = newTeam;
              changed = true;
            }
          }
        }
      }

      // Check sprint results
      if (race.sprintResults && Array.isArray(race.sprintResults)) {
        for (const result of race.sprintResults) {
          if (result.team) {
            // Manual team name mapping based on what we found
            let newTeam = result.team;
            if (result.team === 'Sauber') {
              newTeam = 'Stake F1 Team Kick Sauber';
            } else if (result.team === 'Racing Bulls') {
              newTeam = 'RB';
            } else if (result.team === 'Aston Martin Racing') {
              newTeam = 'Aston Martin';
            }
            
            if (newTeam !== result.team) {
              console.log(`  [${race.raceName}] Sprint Driver ${result.driver}: "${result.team}" -> "${newTeam}"`);
              result.team = newTeam;
              changed = true;
            }
          }
        }
      }

      // Check team results
      if (race.teamResults && Array.isArray(race.teamResults)) {
        for (const result of race.teamResults) {
          if (result.team) {
            // Manual team name mapping based on what we found
            let newTeam = result.team;
            if (result.team === 'Sauber') {
              newTeam = 'Stake F1 Team Kick Sauber';
            } else if (result.team === 'Racing Bulls') {
              newTeam = 'RB';
            } else if (result.team === 'Aston Martin Racing') {
              newTeam = 'Aston Martin';
            }
            
            if (newTeam !== result.team) {
              console.log(`  [${race.raceName}] Team Result: "${result.team}" -> "${newTeam}"`);
              result.team = newTeam;
              changed = true;
            }
          }
        }
      }

      // Check sprint team results
      if (race.sprintTeamResults && Array.isArray(race.sprintTeamResults)) {
        for (const result of race.sprintTeamResults) {
          if (result.team) {
            // Manual team name mapping based on what we found
            let newTeam = result.team;
            if (result.team === 'Sauber') {
              newTeam = 'Stake F1 Team Kick Sauber';
            } else if (result.team === 'Racing Bulls') {
              newTeam = 'RB';
            } else if (result.team === 'Aston Martin Racing') {
              newTeam = 'Aston Martin';
            }
            
            if (newTeam !== result.team) {
              console.log(`  [${race.raceName}] Sprint Team Result: "${result.team}" -> "${newTeam}"`);
              result.team = newTeam;
              changed = true;
            }
          }
        }
      }

      if (changed) {
        // Use updateOne to avoid validation issues
        await RaceResult.updateOne(
          { _id: race._id },
          { 
            $set: {
              results: race.results,
              sprintResults: race.sprintResults,
              teamResults: race.teamResults,
              sprintTeamResults: race.sprintTeamResults
            }
          }
        );
        updated++;
        console.log(`✅ Updated ${race.raceName} (Round ${race.round})`);
      }
    }

    console.log(`\n🎯 Team name normalization complete!`);
    console.log(`   Updated ${updated} race results`);
    
    if (updated === 0) {
      console.log('   All team names are already normalized');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error during team name normalization:', error);
    process.exit(1);
  }
}

fixTeamNamesSimple();
