require('dotenv').config();
const mongoose = require('mongoose');
const { initializeSlugSystem, scrapeMotorsportResultsByType } = require('../src/scrapers/motorsportScraper');
const RaceResult = require('../src/models/RaceResult');
const RaceSelection = require('../src/models/RaceSelection');
const League = require('../src/models/League');
const LeagueLeaderboard = require('../src/models/LeagueLeaderboard');
const Player = require('../src/models/Player');
const { processRawResults, calculateTeamPoints } = require('../src/utils/scoringUtils');

// Get Belgian GP slug from file
const slugs = require('../src/data/motorsportSlugs.json');
const BELGIAN_GP_SLUG = slugs['belgian'];

async function scrapeBelgianGP() {
    try {
        console.log('🚀 Starting Belgian GP scraping process...');
        
        // Connect to database
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fantasy-f1');
        console.log('✅ Connected to MongoDB');
        
        // Initialize the slug system
        console.log('\n1️⃣ Initializing slug system...');
        await initializeSlugSystem();
        
        // Check if Belgian GP already has results
        const existingRace = await RaceResult.findOne({ round: 13, raceName: 'belgian' });
        if (existingRace && existingRace.results && existingRace.results.length > 0) {
            console.log('⚠️ Belgian GP already has results in database');
            console.log('Results count:', existingRace.results.length);
            return;
        }
        
        console.log('\n2️⃣ Scraping Belgian GP race results...');
        
        // Scrape race results
        const raceResults = await scrapeMotorsportResultsByType(BELGIAN_GP_SLUG, 'RACE');
        if (!raceResults || raceResults.length === 0) {
            console.log('❌ No race results found for Belgian GP');
            return;
        }
        
        console.log(`✅ Found ${raceResults.length} race results`);
        
        // Scrape sprint results (Belgian GP is a sprint weekend)
        let sprintResults = null;
        try {
            console.log('\n3️⃣ Scraping Belgian GP sprint results...');
            sprintResults = await scrapeMotorsportResultsByType(BELGIAN_GP_SLUG, 'SPR');
            if (sprintResults && sprintResults.length > 0) {
                console.log(`✅ Found ${sprintResults.length} sprint results`);
            } else {
                console.log('ℹ️ No sprint results found');
            }
        } catch (error) {
            console.log('ℹ️ No sprint results available for Belgian GP');
        }
        
        // Process and save results
        console.log('\n4️⃣ Processing and saving results...');
        
        // Create or update the race result
        const raceData = {
            round: 13,
            raceName: 'belgian',
            circuit: 'Circuit de Spa-Francorchamps',
            country: 'Belgium',
            date: new Date('2025-07-27T13:00:00Z'),
            raceStart: new Date('2025-07-27T13:00:00Z'),
            qualifyingStart: new Date('2025-07-26T13:00:00Z'),
            sprintStart: new Date('2025-07-26T13:00:00Z'),
            sprintQualifyingStart: new Date('2025-07-25T13:00:00Z'),
            status: 'completed',
            isSprintWeekend: true,
            results: raceResults,
            sprintResults: sprintResults,
            teamResults: calculateTeamPoints(raceResults),
            sprintTeamResults: sprintResults ? calculateTeamPoints(sprintResults) : null
        };
        
        const savedRace = await RaceResult.findOneAndUpdate(
            { round: 13 },
            raceData,
            { upsert: true, new: true }
        );
        
        console.log(`✅ Saved Belgian GP results to database`);
        
        // Update player points
        console.log('\n5️⃣ Updating player points...');
        await updatePlayerPoints(savedRace);
        
        // Update championship standings
        console.log('\n6️⃣ Updating championship standings...');
        await updateChampionshipStandings();
        
        console.log('\n✅ Belgian GP processing completed successfully!');
        
    } catch (error) {
        console.error('❌ Error processing Belgian GP:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

// Helper function to update player points
async function updatePlayerPoints(race) {
    try {
        const leagues = await League.find({});
        
        for (const league of leagues) {
            const players = await Player.find({ leagueId: league._id });
            
            for (const player of players) {
                // Find player's selection for this race
                const selection = await RaceSelection.findOne({
                    playerId: player._id,
                    round: race.round
                });
                
                if (selection) {
                    // Calculate points based on race results
                    const points = calculatePlayerPoints(selection, race);
                    
                    // Update player's total points
                    player.totalPoints += points;
                    await player.save();
                    
                    console.log(`Updated points for player ${player.username}: +${points}`);
                }
            }
        }
    } catch (error) {
        console.error('Error updating player points:', error);
    }
}

// Helper function to calculate player points
function calculatePlayerPoints(selection, race) {
    let points = 0;
    
    // Calculate points for main driver
    const mainDriverResult = race.results.find(r => 
        r.driver.toLowerCase() === selection.mainDriver.toLowerCase()
    );
    if (mainDriverResult) {
        points += mainDriverResult.points || 0;
    }
    
    // Calculate points for reserve driver
    const reserveDriverResult = race.results.find(r => 
        r.driver.toLowerCase() === selection.reserveDriver.toLowerCase()
    );
    if (reserveDriverResult) {
        points += reserveDriverResult.points || 0;
    }
    
    // Calculate points for team
    const teamResult = race.teamResults.find(t => 
        t.team.toLowerCase() === selection.team.toLowerCase()
    );
    if (teamResult) {
        points += teamResult.points || 0;
    }
    
    return points;
}

// Helper function to update championship standings
async function updateChampionshipStandings() {
    try {
        const leagues = await League.find({});
        
        for (const league of leagues) {
            const players = await Player.find({ leagueId: league._id })
                .sort({ totalPoints: -1 });
            
            // Update league leaderboard
            await LeagueLeaderboard.findOneAndUpdate(
                { leagueId: league._id },
                {
                    $set: {
                        standings: players.map((player, index) => ({
                            position: index + 1,
                            playerId: player._id,
                            username: player.username,
                            points: player.totalPoints
                        }))
                    }
                },
                { upsert: true }
            );
        }
        
        console.log('✅ Championship standings updated');
    } catch (error) {
        console.error('Error updating championship standings:', error);
    }
}

// Run the script
scrapeBelgianGP(); 