const mongoose = require('mongoose');
const axios = require('axios');
const cheerio = require('cheerio');
const { scrapeMotorsportResultsByType } = require('../src/scrapers/motorsportScraper');
const { ROUND_TO_RACE } = require('../src/constants/roundMapping');
const RaceResult = require('../src/models/RaceResult');
const { processTeamResults } = require('../src/utils/scoringUtils');
require('dotenv').config();

async function scrapeRaceResults() {
    try {
        // Connect to MongoDB
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Get slugs from file
        const slugs = require('../src/data/motorsportSlugs.json');
        console.log('Loaded slugs:', slugs);

        const currentDate = new Date();

        // Process each race in order
        for (let round = 1; round <= Object.keys(ROUND_TO_RACE).length; round++) {
            const raceInfo = ROUND_TO_RACE[round];
            if (!raceInfo) {
                console.log(`No race info found for round ${round}, skipping...`);
                continue;
            }

            const raceName = raceInfo.name;
            const slug = slugs[raceName];
            if (!slug) {
                console.log(`No slug found for ${raceName}, skipping...`);
                continue;
            }

            // Skip races that haven't happened yet
            if (raceInfo.date > currentDate) {
                console.log(`\nSkipping ${raceName} (Round ${round}) - Race is in the future`);
                continue;
            }

            console.log(`\nProcessing ${raceName} (Round ${round})...`);
            console.log(`Race date: ${raceInfo.date.toISOString().split('T')[0]}`);
            console.log(`Has sprint: ${raceInfo.hasSprint ? 'Yes' : 'No'}`);

            try {
                // Find existing race result document
                const existingRaceResult = await RaceResult.findOne({ round });
                if (!existingRaceResult) {
                    console.log(`No race result found for round ${round}, skipping...`);
                    continue;
                }

                // Scrape race results
                console.log('Scraping race results...');
                const raceResults = await scrapeMotorsportResultsByType(slug, 'RACE');
                
                if (!raceResults || raceResults.length === 0) {
                    console.log('No race results found, skipping...');
                    continue;
                }

                // Only check for sprint results if the race has a sprint
                let sprintResults = [];
                if (raceInfo.hasSprint) {
                    try {
                        console.log('Scraping sprint results...');
                        const sprintData = await scrapeMotorsportResultsByType(slug, 'SPR');
                        if (sprintData && sprintData.length > 0) {
                            sprintResults = sprintData;
                            console.log(`Found ${sprintResults.length} sprint results`);
                        } else {
                            console.log('No sprint results found');
                        }
                    } catch (error) {
                        console.log('Error scraping sprint results:', error.message);
                    }
                }

                // Process team results
                const teamResults = processTeamResults(raceResults, sprintResults);

                // Update the existing race result
                const updateData = {
                    results: raceResults,
                    sprintResults,
                    teamResults,
                    status: 'completed',
                    lastUpdated: new Date()
                };

                const updatedRaceResult = await RaceResult.findOneAndUpdate(
                    { round },
                    updateData,
                    { new: true }
                );

                console.log(`Updated results for ${raceName}`);
                console.log(`Main race positions:`, raceResults.map(r => `${r.position}. ${r.driver}`).join(', '));
                if (sprintResults.length > 0) {
                    console.log(`Sprint positions:`, sprintResults.map(r => `${r.position}. ${r.driver}`).join(', '));
                }
                console.log(`Team results:`, teamResults.map(t => `${t.position}. ${t.team} (${t.points} points)`).join(', '));

            } catch (error) {
                console.error(`Error processing ${raceName}:`, error);
            }
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
    }
}

scrapeRaceResults();