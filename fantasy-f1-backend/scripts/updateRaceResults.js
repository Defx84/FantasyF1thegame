const { initializeSlugSystem, scrapeMotorsportResultsByType } = require('../src/scrapers/motorsportScraper');
const { ROUND_TO_RACE } = require('../src/constants/roundMapping');
const RaceResult = require('../src/models/RaceResult');
const League = require('../src/models/League');
const Player = require('../src/models/Player');
const mongoose = require('mongoose');
const { processRawResults, calculateTeamPoints } = require('../src/utils/scoringUtils');

// Known slugs for 2025 races
const KNOWN_SLUGS = {
    'australia': 'australian-gp-652989',
    'china': 'chinese-gp-652993',
    'japan': 'japanese-gp-652997',
    'bahrain': 'bahrain-gp-653151',
    'saudi-arabia': 'saudi-arabia-gp-653152'
};

// Race dates for 2025 season
const RACE_DATES = {
    'australia': new Date('2025-03-16'),
    'china': new Date('2025-03-23'),
    'japan': new Date('2025-04-06'),
    'bahrain': new Date('2025-04-13'),
    'saudi-arabia': new Date('2025-04-20')
};

async function connectToDatabase() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fantasyf1', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ Connected to MongoDB');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        throw error;
    }
}

async function disconnectFromDatabase() {
    try {
        await mongoose.disconnect();
        console.log('✅ Disconnected from MongoDB');
    } catch (error) {
        console.error('❌ Error disconnecting from MongoDB:', error);
    }
}

async function shouldSkipRace(round, raceName) {
    const now = new Date();
    const raceDate = RACE_DATES[raceName];
    
    // Skip future races
    if (raceDate > now) {
        console.log(`⏭️ Skipping ${raceName} (round ${round}) - Race is in the future (${raceDate.toISOString().split('T')[0]})`);
        return true;
    }
    
    // Check if race already has data in database
    const existingRace = await RaceResult.findOne({ round });
    if (existingRace && existingRace.results && existingRace.results.length > 0) {
        console.log(`⏭️ Skipping ${raceName} (round ${round}) - Race already has results in database`);
        return true;
    }
    
    return false;
}

async function saveRaceResults(round, raceName, raceResults, sprintResults) {
    try {
        // Calculate team points for both race and sprint
        const teamResults = calculateTeamPoints(raceResults);
        const sprintTeamResults = sprintResults ? calculateTeamPoints(sprintResults) : null;

        // Process driver results
        const processedRaceResults = raceResults.map(result => ({
            ...result,
            points: result.rawPoints, // Store raw points for driver championship
            status: result.status || 'Finished'
        }));

        const processedSprintResults = sprintResults ? sprintResults.map(result => ({
            ...result,
            points: result.rawPoints, // Store raw points for sprint race
            status: result.status || 'Finished'
        })) : null;

        // Create or update race result
        const raceData = {
            round,
            raceName,
            results: processedRaceResults,
            teamResults,
            sprintResults: processedSprintResults,
            sprintTeamResults,
            lastUpdated: new Date()
        };

        const race = await RaceResult.findOneAndUpdate(
            { round },
            raceData,
            { upsert: true, new: true }
        );

        console.log(`💾 Saved results for ${raceName} (round ${round}) to database`);
        return race;
    } catch (error) {
        console.error(`❌ Error saving results for ${raceName}:`, error);
        throw error;
    }
}

async function updatePlayerPoints(raceResult) {
    try {
        console.log('\n🎮 Updating player points...');
        
        // Get all active leagues
        const leagues = await League.find({ isActive: true });
        console.log(`Found ${leagues.length} active leagues`);
        
        for (const league of leagues) {
            console.log(`\nProcessing league: ${league.name}`);
            
            // Get all players in this league
            const players = await Player.find({ league: league._id });
            console.log(`Found ${players.length} players in league`);
            
            for (const player of players) {
                let mainDriverPoints = 0;
                let reserveDriverPoints = 0;
                let teamPoints = 0;

                // Find main driver's result
                const mainDriverResult = raceResult.results.find(
                    r => r.driver === player.selections.mainDriver
                );

                // Find reserve driver's result
                const reserveDriverResult = raceResult.results.find(
                    r => r.driver === player.selections.reserveDriver
                );

                // Find team's result
                const teamResult = raceResult.teamResults.find(
                    t => t.team === player.selections.team
                );

                // Handle main race points (using main driver)
                if (mainDriverResult) {
                    if (mainDriverResult.status === 'DNS') {
                        // Only use reserve driver points if main driver DNS
                        mainDriverPoints = reserveDriverResult ? reserveDriverResult.points : 0;
                    } else {
                        // For DNF, DSQ or any other status, use the actual points scored (which will be 0 for DNF/DSQ)
                        mainDriverPoints = mainDriverResult.points;
                    }
                }

                // Handle sprint race points (using reserve driver)
                if (raceResult.sprintResults) {
                    const reserveDriverSprintResult = raceResult.sprintResults.find(
                        r => r.driver === player.selections.reserveDriver
                    );

                    if (reserveDriverSprintResult) {
                        if (reserveDriverSprintResult.status === 'DNS') {
                            // If reserve driver DNS in sprint, use 0 points
                            reserveDriverPoints = 0;
                        } else {
                            // For DNF, DSQ or any other status, use the actual points scored (which will be 0 for DNF/DSQ)
                            reserveDriverPoints = reserveDriverSprintResult.points;
                        }
                    }
                }

                // Calculate team points (includes both race and sprint if available)
                if (teamResult) {
                    teamPoints = teamResult.points;
                    if (raceResult.sprintTeamResults) {
                        const sprintTeamResult = raceResult.sprintTeamResults.find(
                            t => t.team === player.selections.team
                        );
                        if (sprintTeamResult) {
                            teamPoints += sprintTeamResult.points;
                        }
                    }
                }

                // Update player's points for this race
                await Player.findByIdAndUpdate(player._id, {
                    $push: {
                        racePoints: {
                            round: raceResult.round,
                            mainDriverPoints,    // Main race points (main driver)
                            reserveDriverPoints, // Sprint race points (reserve driver)
                            teamPoints           // Total team points
                        }
                    }
                });
                
                console.log(`Updated points for ${player.name}:`);
                console.log(`- Main Race (Main Driver): ${mainDriverPoints}`);
                console.log(`- Sprint Race (Reserve Driver): ${reserveDriverPoints}`);
                console.log(`- Team (Constructors Championship): ${teamPoints}`);
            }
        }
    } catch (error) {
        console.error('❌ Error updating player points:', error);
        throw error;
    }
}

async function updateChampionshipStandings() {
    try {
        console.log('\n🏆 Updating championship standings...');
        
        // Update driver championship
        const driverStandings = await calculateDriverStandings();
        await updateDriverChampionship(driverStandings);
        
        // Update constructor championship
        const constructorStandings = await calculateConstructorStandings();
        await updateConstructorChampionship(constructorStandings);
        
        console.log('✅ Championship standings updated');
    } catch (error) {
        console.error('❌ Error updating championship standings:', error);
        throw error;
    }
}

async function processRace(round, raceName) {
    console.log(`\n🏎 Processing round ${round}: ${raceName}`);
    
    // Check if we should skip this race
    if (await shouldSkipRace(round, raceName)) {
        return;
    }
    
    const slug = KNOWN_SLUGS[raceName];
    if (!slug) {
        console.log(`❌ No known slug for ${raceName}`);
        return;
    }
    
    try {
        // 1. Scrape and save race results
        console.log('\n1️⃣ Scraping race results...');
        const raceResults = await scrapeMotorsportResultsByType(slug, 'RACE');
        let sprintResults = null;
        
        try {
            sprintResults = await scrapeMotorsportResultsByType(slug, 'SPR');
        } catch (error) {
            if (error.name === 'TimeoutError') {
                console.log('ℹ️ No sprint results available for this race');
            } else {
                throw error;
            }
        }
        
        // 2. Save results to database
        const savedRace = await saveRaceResults(round, raceName, raceResults, sprintResults);
        
        // 3. Update player points
        await updatePlayerPoints(savedRace);
        
        // 4. Update championship standings
        await updateChampionshipStandings();
        
        console.log(`\n✅ Successfully processed ${raceName} (round ${round})`);
    } catch (error) {
        console.error(`❌ Error processing ${raceName}:`, error);
        throw error;
    }
}

async function main() {
    try {
        console.log('🚀 Starting race results update process...');
        
        // Connect to database
        await connectToDatabase();
        
        // Initialize the slug system
        console.log('\n1️⃣ Initializing slug system...');
        await initializeSlugSystem();
        
        // Process all races in 2025 (official F1 calendar order)
        const racesToProcess = [
            { round: 1, name: 'australia' },
            { round: 2, name: 'china' },
            { round: 3, name: 'japan' },
            { round: 4, name: 'bahrain' },
            { round: 5, name: 'saudi-arabia' }
        ];
        
        for (const race of racesToProcess) {
            await processRace(race.round, race.name);
            console.log('\n' + '='.repeat(80) + '\n');
        }
        
        console.log('\n✅ All races processed successfully');
    } catch (error) {
        console.error('❌ Process failed:', error);
    } finally {
        // Always disconnect from database
        await disconnectFromDatabase();
    }
}

// Run the process
main(); 