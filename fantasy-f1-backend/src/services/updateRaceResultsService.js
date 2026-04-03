/**
 * Service used by admin route POST /update-race-results/:round.
 * Contains processRace + saveRaceResults so the app does not depend on script files.
 */
const { scrapeMotorsportResultsByType } = require('../scrapers/motorsportScraper');
const { ROUND_TO_RACE } = require('../constants/roundMapping');
const RaceResult = require('../models/RaceResult');
const RaceCalendar = require('../models/RaceCalendar');
const { calculateTeamPoints, processRawResults } = require('../utils/scoringUtils');
const { isCalendarRaceCancelled } = require('../utils/raceCalendarUtils');

async function saveRaceResults(round, raceName, raceResults, sprintResults) {
    const existingRace = await RaceResult.findOne({ round });
    const season = existingRace?.season || new Date().getFullYear();
    const cal = await RaceCalendar.findOne({ round: parseInt(round, 10), season });
    if (isCalendarRaceCancelled(cal)) {
        throw new Error(`Round ${round} is cancelled; results cannot be saved.`);
    }

    const processedRaceResults = processRawResults(raceResults, false, season);
    const processedSprintResults = sprintResults ? processRawResults(sprintResults, true, season) : null;

    const teamResults = calculateTeamPoints(
        processedRaceResults,
        processedSprintResults || [],
        season
    );

    const raceData = {
        round,
        raceName,
        results: processedRaceResults,
        teamResults,
        sprintResults: processedSprintResults,
        status: 'completed',
        lastUpdated: new Date()
    };

    const race = await RaceResult.findOneAndUpdate(
        { round },
        raceData,
        { upsert: true, new: true }
    );

    console.log(`💾 Saved results for ${raceName} (round ${round}) to database`);
    return race;
}

/**
 * Scrape and save race results for one round. Used by admin POST /update-race-results/:round.
 * @param {number} round - Race round number
 * @param {string} raceName - Race name (for logging)
 * @param {string} slug - Motorsport.com slug for the race
 */
async function processRace(round, raceName, slug) {
    try {
        console.log(`\n🏎 Processing ${raceName} (round ${round})...`);

        const { results: raceResults } = await scrapeMotorsportResultsByType(slug, 'RACE');
        if (!raceResults || raceResults.length === 0) {
            console.log(`❌ No results found for ${raceName}`);
            return;
        }

        let sprintResults = null;
        const roundInfo = ROUND_TO_RACE[round];
        if (roundInfo?.isSprintWeekend) {
            try {
                const { results: sprintData } = await scrapeMotorsportResultsByType(slug, 'SPR');
                if (sprintData && sprintData.length > 0) {
                    sprintResults = sprintData;
                } else {
                    console.log(`⚠️ No sprint results found for ${raceName}`);
                }
            } catch (e) {
                console.log(`⚠️ Sprint scrape failed for ${raceName}:`, e.message);
            }
        }

        await saveRaceResults(round, raceName, raceResults, sprintResults);
        console.log(`✅ Finished processing ${raceName}`);
    } catch (error) {
        console.error(`❌ Error processing ${raceName}:`, error);
        throw error;
    }
}

module.exports = { processRace, saveRaceResults };
