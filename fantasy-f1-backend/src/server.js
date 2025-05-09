require('dotenv').config({ path: '../.env' });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { generalLimiter, authLimiter, sensitiveLimiter } = require('./middleware/rateLimiter');
const { 
    discoverMotorsportSlugs, 
    scrapeMotorsportResultsByType,
    loadSlugsFromFile,
    saveSlugsToFile,
    initializeScraperSystem,
    runScraper
} = require('./scrapers/motorsportScraper');
const { ROUND_TO_RACE } = require('./constants/roundMapping');
const RaceResult = require('./models/RaceResult');
const League = require('./models/League');
const User = require('./models/User');
const { processRawResults, calculateTeamPoints, updatePlayerPoints, updateChampionshipStandings } = require('./utils/scoringUtils');

const app = require('./app');

async function shouldProcessRace(round, raceName) {
    try {
        const now = new Date();
        const raceDate = ROUND_TO_RACE[round].date;
        
        // Check if race already has data in database
        const existingRace = await RaceResult.findOne({ round });
        if (existingRace && existingRace.results && existingRace.results.length > 0) {
            console.log(`⏭️ Skipping ${raceName} (round ${round}) - Race already has results in database`);
            return false;
        }
        
        // Check if we have a valid slug for this race
        const slugs = await loadSlugsFromFile();
        if (!slugs[raceName]) {
            console.log(`⏭️ Skipping ${raceName} (round ${round}) - No valid slug found`);
            return false;
        }
        
        // For future races, create an empty race result
        if (raceDate > now) {
            console.log(`📅 Creating empty race result for future race: ${raceName} (round ${round})`);
            const raceData = {
                round,
                raceName,
                circuit: ROUND_TO_RACE[round].circuit,
                date: raceDate,
                raceStart: ROUND_TO_RACE[round].raceStart,
                qualifyingStart: ROUND_TO_RACE[round].qualifyingStart,
                status: 'scheduled',
                isSprintWeekend: ROUND_TO_RACE[round].isSprintWeekend || false,
                results: [],
                teamResults: [],
                sprintResults: null,
                sprintTeamResults: null
            };
            
            await RaceResult.findOneAndUpdate(
                { round },
                raceData,
                { upsert: true, new: true }
            );
            return false;
        }
        
        console.log(`✅ Will process ${raceName} (round ${round})`);
        return true;
    } catch (error) {
        console.error(`❌ Error checking if race should be processed:`, error);
        return false;
    }
}

async function saveRaceResults(round, raceName, raceResults, sprintResults) {
    try {
        // Calculate team points for both race and sprint
        const teamResults = calculateTeamPoints(raceResults);
        const sprintTeamResults = sprintResults ? calculateTeamPoints(sprintResults) : null;

        // Process driver results
        const processedRaceResults = raceResults.map(result => ({
            ...result,
            points: result.rawPoints,
            status: result.status || 'Finished'
        }));

        const processedSprintResults = sprintResults ? sprintResults.map(result => ({
            ...result,
            points: result.rawPoints,
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

async function processRace(round, raceName, slug) {
    try {
        console.log(`\n🏎 Processing ${raceName} (round ${round})...`);
        
        // Get race results
        const raceResults = await scrapeMotorsportResultsByType(slug);
        if (!raceResults || raceResults.length === 0) {
            console.log(`❌ No results found for ${raceName}`);
            return;
        }

        // Get sprint results if it's a sprint weekend
        let sprintResults = null;
        if (ROUND_TO_RACE[round].isSprintWeekend) {
            sprintResults = await scrapeMotorsportResultsByType(slug, true);
            if (!sprintResults || sprintResults.length === 0) {
                console.log(`⚠️ No sprint results found for ${raceName}`);
            }
        }

        // Save results to database
        const savedRace = await saveRaceResults(round, raceName, raceResults, sprintResults);

        // Update player points and championship standings
        await updatePlayerPoints(savedRace);
        await updateChampionshipStandings();

        console.log(`✅ Finished processing ${raceName}`);
    } catch (error) {
        console.error(`❌ Error processing ${raceName}:`, error);
        throw error;
    }
}

// Start the server
const port = process.env.PORT || 5000;
app.listen(port, async () => {
    console.log(`🚀 Server running on port ${port}`);
    
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('📦 Connected to MongoDB');
        
        // Initialize scraper system
        console.log('🔄 Initializing scraper system...');
        await initializeScraperSystem();
        
        // Run scraper immediately
        console.log('🏎 Running initial race results update...');
        await runScraper();
        
        console.log('✅ Server initialization complete');
    } catch (error) {
        console.error('❌ Error during startup:', error);
    }
}); 