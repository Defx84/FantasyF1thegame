const mongoose = require('mongoose');
const RaceResult = require('../src/models/RaceResult');
const RaceCalendar = require('../src/models/RaceCalendar');
require('dotenv').config({ path: '.env' });

async function fixIncorrectlyCompletedRaces() {
    try {
        console.log('🔧 Fixing incorrectly completed races...\n');
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        const now = new Date();
        console.log(`Current time: ${now.toISOString()}\n`);

        // Find all completed races
        const completedRaces = await RaceResult.find({ status: 'completed' })
            .sort({ round: 1 });

        console.log(`Found ${completedRaces.length} races marked as "completed"\n`);

        let fixedCount = 0;
        const fixedRaces = [];

        for (const race of completedRaces) {
            let shouldFix = false;
            const reasons = [];

            // Check if race is in the future based on calendar
            if (race.round) {
                const season = race.season || new Date().getFullYear();
                const calendarEntry = await RaceCalendar.findOne({ 
                    round: race.round, 
                    season: season 
                });
                
                if (calendarEntry && calendarEntry.raceStart) {
                    const calendarRaceStart = new Date(calendarEntry.raceStart);
                    if (calendarRaceStart > now) {
                        shouldFix = true;
                        const daysUntilRace = Math.ceil((calendarRaceStart - now) / (1000 * 60 * 60 * 24));
                        reasons.push(`Race is ${daysUntilRace} days in the future`);
                    }
                }
            }

            // Also check raceStart directly if calendar check didn't work
            if (!shouldFix && race.raceStart) {
                const raceStartDate = new Date(race.raceStart);
                if (raceStartDate > now) {
                    shouldFix = true;
                    const daysUntilRace = Math.ceil((raceStartDate - now) / (1000 * 60 * 60 * 24));
                    reasons.push(`Race start is ${daysUntilRace} days in the future`);
                }
            }

            if (shouldFix) {
                console.log(`Fixing: ${race.raceName} (Round ${race.round}, Season ${race.season || 'N/A'})`);
                console.log(`  Reasons: ${reasons.join(', ')}`);
                
                // Use findOneAndUpdate to only update the status field, bypassing validation
                await RaceResult.findOneAndUpdate(
                    { _id: race._id },
                    { $set: { status: 'scheduled' } },
                    { runValidators: false }
                );
                
                fixedRaces.push({
                    round: race.round,
                    raceName: race.raceName,
                    season: race.season,
                    reasons: reasons
                });
                fixedCount++;
            }
        }

        console.log('\n' + '='.repeat(100));
        console.log(`\n✅ Fixed ${fixedCount} races`);
        
        if (fixedRaces.length > 0) {
            console.log('\nFixed races:');
            fixedRaces.forEach(race => {
                console.log(`  - ${race.raceName} (Round ${race.round}, Season ${race.season || 'N/A'})`);
            });
        }

        console.log('\n💡 These races will no longer appear in standings until they are actually completed.');
        console.log('   Standings should now only show races that have actually happened.\n');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('✅ Disconnected from MongoDB');
    }
}

fixIncorrectlyCompletedRaces();

