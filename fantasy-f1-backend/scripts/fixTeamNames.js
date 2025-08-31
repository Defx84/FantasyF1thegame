require('dotenv').config();
const mongoose = require('mongoose');
const RaceResult = require('../src/models/RaceResult');
const { normalizeTeamName } = require('../src/constants/f1Data2025');

async function fixTeamNames() {
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
            const normalizedTeam = normalizeTeamName(result.team);
            if (normalizedTeam && normalizedTeam !== result.team) {
              console.log(`  [${race.raceName}] Driver ${result.driver}: "${result.team}" -> "${normalizedTeam}"`);
              result.team = normalizedTeam;
              changed = true;
            }
          }
        }
      }

      // Check sprint results
      if (race.sprintResults && Array.isArray(race.sprintResults)) {
        for (const result of race.sprintResults) {
          if (result.team) {
            const normalizedTeam = normalizeTeamName(result.team);
            if (normalizedTeam && normalizedTeam !== result.team) {
              console.log(`  [${race.raceName}] Sprint Driver ${result.driver}: "${result.team}" -> "${normalizedTeam}"`);
              result.team = normalizedTeam;
              changed = true;
            }
          }
        }
      }

      // Check team results
      if (race.teamResults && Array.isArray(race.teamResults)) {
        for (const result of race.teamResults) {
          if (result.team) {
            const normalizedTeam = normalizeTeamName(result.team);
            if (normalizedTeam && normalizedTeam !== result.team) {
              console.log(`  [${race.raceName}] Team Result: "${result.team}" -> "${normalizedTeam}"`);
              result.team = normalizedTeam;
              changed = true;
            }
          }
        }
      }

      // Check sprint team results
      if (race.sprintTeamResults && Array.isArray(race.sprintTeamResults)) {
        for (const result of race.sprintTeamResults) {
          if (result.team) {
            const normalizedTeam = normalizeTeamName(result.team);
            if (normalizedTeam && normalizedTeam !== result.team) {
              console.log(`  [${race.raceName}] Sprint Team Result: "${result.team}" -> "${normalizedTeam}"`);
              result.team = normalizedTeam;
              changed = true;
            }
          }
        }
      }

      if (changed) {
        await race.save();
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

fixTeamNames();
