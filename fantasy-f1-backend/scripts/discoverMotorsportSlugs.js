const { 
    discoverMotorsportSlugs, 
    scrapeMotorsportResultsByType,
    loadSlugsFromFile,
    saveSlugsToFile
} = require('../src/scrapers/motorsportScraper');
const { ROUND_TO_RACE } = require('../src/constants/roundMapping');
const RaceResult = require('../src/models/RaceResult');
const League = require('../src/models/League');
const Player = require('../src/models/Player');
const mongoose = require('mongoose');
const { processRawResults, calculateTeamPoints } = require('../src/utils/scoringUtils');
require('dotenv').config();

let slugCache = {};

// Add this mapping at the top or before processRace
const raceNameToSlugKey = {
  "Australian Grand Prix": "australian",
  "Chinese Grand Prix": "chinese",
  "Japanese Grand Prix": "japanese",
  "Bahrain Grand Prix": "bahrain",
  "Saudi Arabian Grand Prix": "saudi-arabian",
  "Miami Grand Prix": "miami",
  // Add more as needed
};

async function connectToDatabase() {
    try {
        // Ensure .env is loaded
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is not defined in environment variables');
        }

        // Validate MongoDB URI format
        if (!process.env.MONGODB_URI.startsWith('mongodb://') && !process.env.MONGODB_URI.startsWith('mongodb+srv://')) {
            throw new Error('Invalid MongoDB URI format');
        }

        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
            socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
        });

        // Verify the connection
        const db = mongoose.connection;
        db.on('error', console.error.bind(console, 'MongoDB connection error:'));
        db.once('open', () => {
            console.log('✅ Connected to MongoDB successfully');
        });

        // Test the connection
        await mongoose.connection.db.admin().ping();
        console.log('✅ MongoDB connection is healthy');
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
        throw error;
    }
}

async function shouldProcessRace(round, raceName) {
    const now = new Date();
    const raceDate = ROUND_TO_RACE[round].date;
    
    // Skip future races
    if (raceDate > now) {
        console.log(`⏭️ Skipping ${raceName} (round ${round}) - Race is in the future (${raceDate.toISOString().split('T')[0]})`);
        return false;
    }
    
    // Check if race already has data in database
    const existingRace = await RaceResult.findOne({ round });
    if (existingRace && existingRace.results && existingRace.results.length > 0) {
        console.log(`⏭️ Skipping ${raceName} (round ${round}) - Race already has results in database`);
        return false;
    }
    
    return true;
}

async function saveRaceResults(round, raceName, raceResults, sprintResults) {
    try {
        // Get the race from ROUND_TO_RACE mapping
        const raceInfo = ROUND_TO_RACE[round];
        if (!raceInfo) {
            throw new Error(`No race info found for round ${round}`);
        }

        // Create base race data
        const raceData = {
            round: parseInt(round),
            raceName,
            circuit: raceName, // We'll update this later with proper circuit info
            date: raceInfo.date,
            raceStart: raceInfo.date,
            qualifyingStart: raceInfo.qualifyingStart,
            isSprintWeekend: raceInfo.hasSprint,
            season: 2025,
            status: 'completed',
            results: [],
            teamResults: []
        };

        // Add sprint timing info if it's a sprint weekend
        if (raceInfo.hasSprint) {
            raceData.sprintQualifyingStart = raceInfo.sprintQualifyingStart;
            raceData.sprintStart = raceInfo.sprintStart;
        }

        // Process race results
        if (raceResults && raceResults.length > 0) {
            raceData.results = raceResults.map(result => {
                const position = result.position.toLowerCase();
                return {
                    driverId: new mongoose.Types.ObjectId(), // Temporary ID
                    position: isNaN(position) ? 999 : parseInt(position), // Use high number for DNF/DNS/DSQ
                    points: parseInt(result.points) || 0,
                    didNotFinish: position === 'dnf',
                    didNotStart: position === 'dns',
                    disqualified: position === 'dsq' || position === 'dq'
                };
            });
        }

        // Process sprint results
        if (sprintResults && sprintResults.length > 0) {
            raceData.sprintResults = sprintResults.map(result => {
                const position = result.position.toLowerCase();
                return {
                    driverId: new mongoose.Types.ObjectId(), // Temporary ID
                    position: isNaN(position) ? 999 : parseInt(position), // Use high number for DNF/DNS/DSQ
                    points: parseInt(result.points) || 0,
                    didNotFinish: position === 'dnf',
                    didNotStart: position === 'dns',
                    disqualified: position === 'dsq' || position === 'dq'
                };
            });
        }

        // Process team results
        const teamPoints = new Map();
        raceResults.forEach(result => {
            const team = result.team;
            const points = parseInt(result.points) || 0;
            teamPoints.set(team, (teamPoints.get(team) || 0) + points);
        });

        if (sprintResults) {
            sprintResults.forEach(result => {
                const team = result.team;
                const points = parseInt(result.points) || 0;
                teamPoints.set(team, (teamPoints.get(team) || 0) + points);
            });
        }

        // Convert team points to array and sort by points
        const sortedTeams = Array.from(teamPoints.entries())
            .sort(([,a], [,b]) => b - a)
            .map(([team, points], index) => ({
                teamId: new mongoose.Types.ObjectId(), // Temporary ID
                position: index + 1,
                points
            }));

        raceData.teamResults = sortedTeams;

        // Save to database
        const race = await RaceResult.findOneAndUpdate(
            { round: parseInt(round) },
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

async function processRace(round, raceName) {
    try {
        console.log(`\n🏎 Processing ${raceName} (round ${round})...`);
        
        // Normalize raceName to slug key
        const slugKey = raceNameToSlugKey[raceName] || raceName.toLowerCase().replace(' grand prix', '');
        const slug = slugCache[slugKey];
        if (!slug) {
            console.log(`⚠️ No slug found for ${raceName}, skipping...`);
            return;
        }
        
        // Check if we should process this race
        if (!await shouldProcessRace(round, raceName)) {
            return;
        }
        
        // Scrape race results
        const raceResults = await scrapeMotorsportResultsByType(slug, 'RACE');
        if (!raceResults || raceResults.length === 0) {
            console.log(`⚠️ No race results found for ${raceName}`);
            return;
        }
        
        // For sprint races, also scrape sprint results
        let sprintResults = null;
        if (ROUND_TO_RACE[round].hasSprint) {
            console.log(`🏃 Processing sprint results for ${raceName}...`);
            sprintResults = await scrapeMotorsportResultsByType(slug, 'SPRINT');
        }
        
        // Save results to database
        const savedRace = await saveRaceResults(round, raceName, raceResults, sprintResults);
        
        // Update player points
        await updatePlayerPoints(savedRace);
        
        console.log(`✅ Successfully processed ${raceName} (round ${round})`);
    } catch (error) {
        console.error(`❌ Error processing ${raceName}:`, error);
        throw error;
    }
}

async function main() {
    try {
        // 1. Connect to database
        await connectToDatabase();
        
        // 2. Load existing slugs
        slugCache = await loadSlugsFromFile();
        
        // 3. Discover and update slugs if needed
        slugCache = await discoverMotorsportSlugs(2025);
        
        // 4. Process each race
        for (const [round, race] of Object.entries(ROUND_TO_RACE)) {
            const raceName = race.name;
            if (await shouldProcessRace(round, raceName)) {
                await processRace(round, raceName);
            }
        }
        
        // 5. Disconnect from database
        await disconnectFromDatabase();
    } catch (error) {
        console.error('Error in main process:', error);
        process.exit(1);
    }
}

main(); 