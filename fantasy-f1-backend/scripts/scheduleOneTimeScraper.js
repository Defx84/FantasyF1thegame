require('dotenv').config();
const mongoose = require('mongoose');
const { runScraper } = require('../src/scrapers/motorsportScraper');
const RaceResult = require('../src/models/RaceResult');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fantasy-f1';

async function scheduleOneTimeScraper() {
    try {
        console.log('⏰ Scheduling one-time scraper run for Dutch GP...\n');
        
        // Calculate run time: 5 minutes from now
        const now = new Date();
        const runTime = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes from now
        
        console.log(`📅 Current time: ${now.toLocaleString('en-GB', { timeZone: 'Europe/London' })}`);
        console.log(`⏰ Scraper will run at: ${runTime.toLocaleString('en-GB', { timeZone: 'Europe/London' })}`);
        console.log(`⏱️ Time until run: ${Math.round((runTime - now) / 1000 / 60)} minutes and ${Math.round(((runTime - now) / 1000) % 60)} seconds`);
        
        // Connect to MongoDB
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');
        
        // Check current Dutch GP status
        const round = 15;
        const currentRace = await RaceResult.findOne({ round });
        console.log('\n📊 Current Dutch GP status:');
        console.log(`   Status: ${currentRace?.status || 'Not found'}`);
        console.log(`   Results: ${currentRace?.results?.length || 0}`);
        console.log(`   Last updated: ${currentRace?.lastUpdated || 'Never'}`);
        
        // Schedule the scraper
        const timeUntilRun = runTime.getTime() - now.getTime();
        
        console.log(`\n🔄 Scheduling scraper to run in ${Math.round(timeUntilRun / 1000)} seconds...`);
        
        setTimeout(async () => {
            try {
                console.log('\n🏎 Running scheduled scraper for Dutch GP...');
                console.log(`⏰ Time: ${new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' })}`);
                
                // Run the scraper
                await runScraper();
                console.log('✅ Scraper completed successfully!');
                
                // Check the results
                const updatedRace = await RaceResult.findOne({ round });
                if (updatedRace) {
                    console.log('\n📊 Dutch GP after scraper run:');
                    console.log(`   Status: ${updatedRace.status}`);
                    console.log(`   Results: ${updatedRace.results?.length || 0}`);
                    console.log(`   Last updated: ${updatedRace.lastUpdated}`);
                    
                    if (updatedRace.results && updatedRace.results.length > 0) {
                        console.log('🎉 Success! Dutch GP now has race results!');
                        console.log('   Admin assignments should now work with real points!');
                    } else {
                        console.log('⚠️ Race updated but no results found');
                    }
                }
                
            } catch (error) {
                console.error('❌ Error during scheduled scraper run:', error);
            } finally {
                await mongoose.disconnect();
                console.log('🔌 Disconnected from MongoDB');
                process.exit(0);
            }
        }, timeUntilRun);
        
        console.log('✅ Scraper scheduled successfully!');
        console.log('⏳ Waiting for scheduled time...');
        console.log('💡 You can leave this running - it will execute automatically');
        
        // Keep the process alive
        process.on('SIGINT', async () => {
            console.log('\n🛑 Cancelling scheduled scraper...');
            await mongoose.disconnect();
            process.exit(0);
        });
        
    } catch (error) {
        console.error('❌ Error:', error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

// Run the script
scheduleOneTimeScraper();
