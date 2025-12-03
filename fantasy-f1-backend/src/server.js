require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cron = require('node-cron');
const { generalLimiter, authLimiter, sensitiveLimiter } = require('./middleware/rateLimiter');
const { 
    discoverMotorsportSlugs, 
    scrapeMotorsportResultsByType,
    loadSlugsFromFile,
    saveSlugsToFile,
    initializeScraperSystem,
    runScraper
} = require('./scrapers/motorsportScraper');
// Temporarily disabled token cleanup to fix import issues
// const { cleanupExpiredTokens } = require('./utils/tokenUtils.js');
const { ROUND_TO_RACE } = require('./constants/roundMapping');
const RaceResult = require('./models/RaceResult');
const League = require('./models/League');
const User = require('./models/User');
const { processRawResults, calculateTeamPoints } = require('./utils/scoringUtils');
const { sendReminderEmails } = require('./services/reminderService');

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
        try {
            const slugs = await loadSlugsFromFile();
            if (!slugs[raceName]) {
                console.log(`⏭️ Skipping ${raceName} (round ${round}) - No valid slug found`);
                return false;
            }
        } catch (error) {
            console.log(`⏭️ Skipping ${raceName} (round ${round}) - Error loading slugs: ${error.message}`);
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
            status: 'completed', // CRITICAL: Set status to completed to trigger post-save hook
            lastUpdated: new Date()
        };

        const race = await RaceResult.findOneAndUpdate(
            { round },
            raceData,
            { upsert: true, new: true }
        );

        console.log(`💾 Saved results for ${raceName} (round ${round}) to database with status: ${race.status}`);
        console.log(`🎯 Post-save hook should now trigger automatic points calculation for all users`);
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

        // Save results to database (this will trigger automatic points calculation via post-save hook)
        const savedRace = await saveRaceResults(round, raceName, raceResults, sprintResults);

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
        
        // Schedule token cleanup (run daily at 2 AM) - Temporarily disabled
        // cron.schedule('0 2 * * *', async () => {
        //     console.log('🧹 Running scheduled token cleanup...');
        //     try {
        //         const cleanedCount = await cleanupExpiredTokens();
        //         console.log(`✅ Cleaned up ${cleanedCount} expired tokens`);
        //     } catch (error) {
        //         console.error('❌ Error during token cleanup:', error);
        //     }
        // });
        
        // Schedule reminder emails (run daily at 7:45 PM UK time)
        cron.schedule('45 19 * * *', async () => {
            console.log('🔔 Running scheduled reminder emails at 7:45 PM UK time...');
            try {
                const result = await sendReminderEmails();
                console.log(`✅ Reminder emails sent: ${result.sent}, skipped: ${result.skipped}`);
            } catch (error) {
                console.error('❌ Error during reminder emails:', error);
            }
        });
        
        // Schedule season archive PDF generation (run on Monday, December 8th at 8am UK time)
        // Note: UK time is GMT in December (UTC+0), so 8am UK = 8am UTC
        // Cron: minute 0, hour 8, day 8, month 12 (December), any day of week
        // This will run on December 8th at 8am UTC, but only process the current year's season
        cron.schedule('0 8 8 12 *', async () => {
            console.log('📧 Running scheduled season archive PDF generation on December 8th at 8am UTC...');
            try {
                const { isSeasonComplete, updateLeagueWithFinalStandings } = require('./controllers/seasonController');
                const League = require('./models/League');
                
                const currentYear = new Date().getFullYear();
                const season = currentYear;
                
                // Verify we're actually on December 8th (cron should handle this, but double-check)
                const today = new Date();
                if (today.getDate() !== 8 || today.getMonth() !== 11) { // Month is 0-indexed, so 11 = December
                    console.log(`⏭️ Skipping - today is not December 8th (current date: ${today.toDateString()})`);
                    return;
                }
                
                console.log(`📅 Processing season ${season} archive on December 8th, ${currentYear}`);
                const seasonComplete = await isSeasonComplete(season);
                
                if (seasonComplete) {
                    console.log(`🏁 Season ${season} is complete! Processing final standings for all leagues...`);
                    
                    // Get all active leagues for this season that haven't been processed yet
                    // The seasonStatus check ensures we only process each league once
                    const leagues = await League.find({ 
                        season: season,
                        seasonStatus: { $ne: 'completed' } // Only process leagues that aren't already completed
                    });
                    
                    console.log(`📊 Found ${leagues.length} leagues to process for season completion`);
                    
                    // Process each league
                    let successCount = 0;
                    let errorCount = 0;
                    for (const league of leagues) {
                        try {
                            console.log(`📄 Processing season completion for league: ${league.name} (${league._id})`);
                            await updateLeagueWithFinalStandings(league._id, season);
                            console.log(`✅ Season completion processed for league: ${league.name}`);
                            successCount++;
                        } catch (leagueError) {
                            console.error(`❌ Error processing season completion for league ${league.name}:`, leagueError);
                            errorCount++;
                            // Continue with other leagues even if one fails
                        }
                    }
                    
                    console.log(`🏁 Season ${season} completion processing finished: ${successCount} successful, ${errorCount} errors`);
                } else {
                    // Check how many races are left
                    const allRaces = await RaceResult.find({ season });
                    const completedRaces = allRaces.filter(r => r.status === 'completed').length;
                    const totalRaces = allRaces.length;
                    console.log(`⏳ Season ${season} not yet complete: ${completedRaces}/${totalRaces} races completed`);
                }
            } catch (error) {
                console.error('❌ Error during season archive PDF generation:', error);
            }
        });
        
        // Schedule one-time slug discovery for 12:30 GMT
        const now = new Date();
        const targetTime = new Date();
        targetTime.setUTCHours(12, 30, 0, 0); // 12:30 GMT
        
        // If 12:30 GMT has already passed today, schedule for tomorrow
        if (targetTime <= now) {
            targetTime.setUTCDate(targetTime.getUTCDate() + 1);
        }
        
        const timeUntilSlugDiscovery = targetTime.getTime() - now.getTime();
        console.log(`⏰ Scheduling one-time slug discovery for ${targetTime.toUTCString()} (${Math.round(timeUntilSlugDiscovery / 1000 / 60)} minutes from now)...`);
        
        setTimeout(async () => {
            try {
                console.log('🔍 Running scheduled slug discovery at 12:30 GMT...');
                const currentYear = new Date().getFullYear();
                await discoverMotorsportSlugs(currentYear);
                console.log('✅ Scheduled slug discovery completed successfully');
            } catch (error) {
                console.error('❌ Error during scheduled slug discovery:', error);
            }
        }, timeUntilSlugDiscovery);
        
        // Run scraper immediately since it's past 19:05
        console.log('🏎 Running immediate Dutch GP scraper since scheduled time has passed...');
        setTimeout(async () => {
            try {
                await runScraper();
                console.log('✅ Immediate Dutch GP scraper completed successfully');
            } catch (error) {
                console.error('❌ Error during immediate Dutch GP scraper:', error);
                console.log('🔄 Will retry in 5 minutes...');
                
                // Retry after 5 minutes
                setTimeout(async () => {
                    try {
                        console.log('🔄 Retrying Dutch GP scraper...');
                        await runScraper();
                        console.log('✅ Retry successful!');
                    } catch (retryError) {
                        console.error('❌ Retry failed:', retryError);
                    }
                }, 5 * 60 * 1000);
            }
        }, 10000); // Run after 10 seconds
        
        // Schedule scraper to run in 20 minutes for debugging
        const runTime = new Date(now.getTime() + 20 * 60 * 1000); // 20 minutes from now
        console.log(`⏰ Scheduling scraper to run in 20 minutes at ${runTime.toISOString()} for debugging...`);
        setTimeout(async () => {
            try {
                console.log('🔍 Running scheduled scraper (20-minute debug run)...');
                await runScraper();
                console.log('✅ Scheduled scraper completed successfully');
            } catch (error) {
                console.error('❌ Error during scheduled scraper:', error);
            }
        }, 20 * 60 * 1000); // 20 minutes
        
        console.log('✅ Server initialization complete');
    } catch (error) {
        console.error('❌ Error during startup:', error);
    }
}); 