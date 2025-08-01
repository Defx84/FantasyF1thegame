require('dotenv').config();
const mongoose = require('mongoose');
const { runScraper, initializeScraperSystem, shouldProcessRace, processRace } = require('../src/scrapers/motorsportScraper');
const { ROUND_TO_RACE } = require('../src/constants/roundMapping');
const RaceResult = require('../src/models/RaceResult');

async function debugBelgianGPScraping() {
    try {
        console.log('🔍 Debugging Belgian GP scraping...');
        
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fantasy-f1');
        console.log('✅ Connected to MongoDB');
        
        // Initialize scraper system
        console.log('🔄 Initializing scraper system...');
        await initializeScraperSystem();
        
        // Check if Belgian GP should be processed
        console.log('\n1️⃣ Checking if Belgian GP should be processed...');
        const shouldProcess = await shouldProcessRace(13, 'belgian');
        console.log(`Should process Belgian GP: ${shouldProcess}`);
        
        if (shouldProcess) {
            console.log('\n2️⃣ Processing Belgian GP...');
            await processRace(13, 'belgian');
        } else {
            console.log('\n❌ Belgian GP should not be processed. Checking why...');
            
            // Check the current race document
            const belgianRace = await RaceResult.findOne({ round: 13 });
            console.log('Current Belgian GP document:', {
                round: belgianRace?.round,
                raceName: belgianRace?.raceName,
                status: belgianRace?.status,
                resultsCount: belgianRace?.results?.length || 0,
                hasResults: belgianRace?.results && belgianRace.results.length > 0
            });
            
            // Check if it has results but shouldProcessRace thinks it doesn't
            if (belgianRace?.results && belgianRace.results.length > 0) {
                console.log('⚠️ Race has results but shouldProcessRace returned false');
            } else {
                console.log('ℹ️ Race has no results, which is why shouldProcessRace returned false');
            }
        }
        
        // Check final state
        console.log('\n3️⃣ Final state check...');
        const finalBelgianGP = await RaceResult.findOne({ round: 13 });
        console.log('Final Belgian GP state:', {
            round: finalBelgianGP?.round,
            raceName: finalBelgianGP?.raceName,
            status: finalBelgianGP?.status,
            resultsCount: finalBelgianGP?.results?.length || 0,
            sprintResultsCount: finalBelgianGP?.sprintResults?.length || 0,
            teamResultsCount: finalBelgianGP?.teamResults?.length || 0
        });
        
    } catch (error) {
        console.error('❌ Error debugging Belgian GP scraping:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

// Run the script
debugBelgianGPScraping(); 