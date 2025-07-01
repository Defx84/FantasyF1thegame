const mongoose = require('mongoose');
const RaceResult = require('../src/models/RaceResult');
const RaceSelection = require('../src/models/RaceSelection');
const League = require('../src/models/League');
const ScoringService = require('../src/services/ScoringService');
require('dotenv').config();

async function testPointsAssignment() {
    try {
        // Connect to MongoDB
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Test with a specific round (you can change this)
        const testRound = 1; // Change this to test different races
        
        console.log(`\n=== Testing Points Assignment for Round ${testRound} ===`);
        
        // Get the race result
        const raceResult = await RaceResult.findOne({ round: testRound });
        if (!raceResult) {
            console.log(`No race result found for round ${testRound}`);
            return;
        }
        
        console.log(`\nRace: ${raceResult.raceName} (Round ${raceResult.round})`);
        console.log(`Status: ${raceResult.status}`);
        console.log(`Is Sprint Weekend: ${raceResult.isSprintWeekend}`);
        console.log(`Results count: ${raceResult.results?.length || 0}`);
        console.log(`Sprint results count: ${raceResult.sprintResults?.length || 0}`);
        console.log(`Team results count: ${raceResult.teamResults?.length || 0}`);
        
        // Show team results structure
        console.log('\nTeam Results:');
        raceResult.teamResults?.forEach((team, index) => {
            console.log(`${index + 1}. ${team.team}: Position ${team.position}, Race Points ${team.racePoints}, Sprint Points ${team.sprintPoints}, Total ${team.totalPoints}`);
        });
        
        // Get all leagues
        const leagues = await League.find({}).populate('members');
        console.log(`\nFound ${leagues.length} leagues`);
        
        // Test points calculation for each league
        const scoringService = new ScoringService();
        
        for (const league of leagues) {
            console.log(`\n--- Testing League: ${league.name} ---`);
            
            for (const member of league.members) {
                const selection = await RaceSelection.findOne({
                    user: member._id,
                    league: league._id,
                    race: raceResult._id
                });
                
                if (!selection) {
                    console.log(`  No selection found for ${member.username}`);
                    continue;
                }
                
                console.log(`\n  User: ${member.username}`);
                console.log(`  Selection: Main Driver: ${selection.mainDriver}, Reserve Driver: ${selection.reserveDriver}, Team: ${selection.team}`);
                console.log(`  Current Points: ${selection.points || 0}`);
                console.log(`  Current Status: ${selection.status}`);
                
                // Calculate points
                const pointsData = scoringService.calculateRacePoints({
                    mainDriver: selection.mainDriver,
                    reserveDriver: selection.reserveDriver,
                    team: selection.team
                }, raceResult);
                
                console.log(`  Calculated Points: ${pointsData.totalPoints}`);
                console.log(`  Breakdown:`, pointsData.breakdown);
                
                // Check if points should be updated
                const pointsChanged = 
                    selection.points !== pointsData.totalPoints || 
                    JSON.stringify(selection.pointBreakdown) !== JSON.stringify(pointsData.breakdown);
                
                console.log(`  Points Changed: ${pointsChanged ? 'YES' : 'NO'}`);
            }
        }
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
    }
}

testPointsAssignment(); 