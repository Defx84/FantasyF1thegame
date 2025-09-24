const mongoose = require('mongoose');
const League = require('./src/models/League');
const RaceSelection = require('./src/models/RaceSelection');
const LeagueLeaderboard = require('./src/models/LeagueLeaderboard');
const RaceCalendar = require('./src/models/RaceCalendar');
require('dotenv').config();

async function checkLeagueLJFAKC() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Search for league by code
    const league = await League.findOne({ code: 'LJFAKC' });
    console.log('\n=== LEAGUE SEARCH ===');
    if (league) {
      console.log(`Found league: ${league.name}`);
      console.log(`League ID: ${league._id}`);
      console.log(`Members: ${league.members.length}`);
      console.log(`Created: ${league.createdAt}`);
    } else {
      console.log('League with code LJFAKC not found');
      return;
    }
    
    // Get race selections for this league
    const selections = await RaceSelection.find({ league: league._id }).sort({ round: 1 });
    console.log(`\n=== RACE SELECTIONS ===`);
    console.log(`Total selections: ${selections.length}`);
    
    if (selections.length === 0) {
      console.log('No selections found for this league');
      return;
    }
    
    // Check race references
    const raceCalendars = await RaceCalendar.find({}).sort({ round: 1 });
    const roundToRaceId = {};
    raceCalendars.forEach(race => {
      roundToRaceId[race.round] = race._id;
    });
    
    let correctReferences = 0;
    let incorrectReferences = 0;
    const roundsWithIssues = [];
    
    selections.forEach(sel => {
      const correctRaceId = roundToRaceId[sel.round];
      if (correctRaceId && sel.race.toString() === correctRaceId.toString()) {
        correctReferences++;
      } else {
        incorrectReferences++;
        if (!roundsWithIssues.includes(sel.round)) {
          roundsWithIssues.push(sel.round);
        }
      }
    });
    
    console.log(`\n=== RACE REFERENCE CHECK ===`);
    console.log(`Correct references: ${correctReferences}`);
    console.log(`Incorrect references: ${incorrectReferences}`);
    console.log(`Rounds with issues: ${roundsWithIssues.join(', ')}`);
    
    // Check standings
    const leaderboard = await LeagueLeaderboard.findOne({ league: league._id });
    if (leaderboard) {
      console.log(`\n=== CURRENT STANDINGS ===`);
      console.log(`Driver standings: ${leaderboard.driverStandings.length}`);
      console.log(`Constructor standings: ${leaderboard.constructorStandings.length}`);
      
      if (leaderboard.driverStandings.length > 0) {
        console.log('\nDriver standings:');
        leaderboard.driverStandings.forEach((standing, index) => {
          console.log(`  ${index + 1}. User: ${standing.user} - Points: ${standing.totalPoints} - Races: ${standing.raceResults.length}`);
        });
      }
    } else {
      console.log('\n=== CURRENT STANDINGS ===');
      console.log('No leaderboard found for this league');
    }
    
    // Sample selections with points
    console.log(`\n=== SAMPLE SELECTIONS ===`);
    const sampleSelections = selections.slice(0, 5);
    sampleSelections.forEach(sel => {
      console.log(`Round ${sel.round}: Points ${sel.points} - Status: ${sel.status}`);
    });
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkLeagueLJFAKC();

