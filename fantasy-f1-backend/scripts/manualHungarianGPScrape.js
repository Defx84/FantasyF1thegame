require('dotenv').config();
const mongoose = require('mongoose');
const { ROUND_TO_RACE } = require('../src/constants/roundMapping');
const RaceResult = require('../src/models/RaceResult');
const { scrapeMotorsportResultsByType } = require('../src/scrapers/motorsportScraper');
const { processTeamResults } = require('../src/utils/scoringUtils');

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fantasy-f1';
mongoose.connect(MONGODB_URI);

async function manualHungarianGPScrape() {
    try {
        console.log('🏎 Manually scraping Hungarian GP...\n');
        
        const round = 14;
        const raceName = ROUND_TO_RACE[round].name;
        const slug = 'hungarian-gp-653191';
        
        console.log(`📊 Race details:`);
        console.log(`   Round: ${round}`);
        console.log(`   Race name: ${raceName}`);
        console.log(`   Slug: ${slug}`);
        console.log(`   Has sprint: ${ROUND_TO_RACE[round].hasSprint ? 'Yes' : 'No'}`);
        
        // Scrape race results
        console.log('\n🏁 Scraping race results...');
        const scrapedRaceData = await scrapeMotorsportResultsByType(slug, 'RACE');
        const raceResults = scrapedRaceData.results;
        
        if (!raceResults || raceResults.length === 0) {
            console.log('❌ No race results found!');
            return;
        }
        
        console.log(`✅ Found ${raceResults.length} race results`);
        console.log('Top 3 finishers:');
        raceResults.slice(0, 3).forEach((result, index) => {
            console.log(`   ${index + 1}. ${result.driver} (${result.team}) - ${result.points} points`);
        });
        
        // Scrape sprint results if it's a sprint weekend
        let sprintResults = [];
        if (ROUND_TO_RACE[round].hasSprint) {
            console.log('\n🏃 Scraping sprint results...');
            try {
                const scrapedSprintData = await scrapeMotorsportResultsByType(slug, 'SPR');
                const sprintData = scrapedSprintData.results;
                if (sprintData && sprintData.length > 0) {
                    sprintResults = sprintData;
                    console.log(`✅ Found ${sprintResults.length} sprint results`);
                } else {
                    console.log('⚠️ No sprint results found');
                }
            } catch (error) {
                console.log('❌ Error scraping sprint results:', error.message);
            }
        }
        
        // Process team results
        console.log('\n🏆 Processing team results...');
        const teamResults = processTeamResults(raceResults, sprintResults);
        console.log(`✅ Processed ${teamResults.length} team results`);
        
        // Update the race result in database
        console.log('\n💾 Saving to database...');
        const raceData = {
            round: parseInt(round),
            raceName,
            results: raceResults,
            teamResults,
            sprintResults: sprintResults.length > 0 ? sprintResults : [],
            sprintTeamResults: sprintResults.length > 0 ? processTeamResults(sprintResults) : [],
            status: 'completed',
            isSprintWeekend: ROUND_TO_RACE[round].hasSprint || false,
            lastUpdated: new Date()
        };
        
        const updatedRace = await RaceResult.findOneAndUpdate(
            { round: parseInt(round) },
            raceData,
            { upsert: true, new: true }
        );
        
        console.log('✅ Hungarian GP results saved successfully!');
        console.log(`   Status: ${updatedRace.status}`);
        console.log(`   Results count: ${updatedRace.results.length}`);
        console.log(`   Team results count: ${updatedRace.teamResults.length}`);
        console.log(`   Sprint results count: ${updatedRace.sprintResults.length}`);
        
        console.log('\n🎉 Hungarian GP scraping completed! The post-save hook should now trigger points calculation.');
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

manualHungarianGPScrape(); 