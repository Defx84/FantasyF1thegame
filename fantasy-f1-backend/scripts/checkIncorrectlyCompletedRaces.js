const mongoose = require('mongoose');
const RaceResult = require('../src/models/RaceResult');
const RaceCalendar = require('../src/models/RaceCalendar');
require('dotenv').config({ path: '.env' });

async function checkIncorrectlyCompletedRaces() {
    try {
        console.log('🔍 Checking for incorrectly completed races...\n');
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        const now = new Date();
        console.log(`Current time: ${now.toISOString()}\n`);

        // Find all completed races
        const completedRaces = await RaceResult.find({ status: 'completed' })
            .sort({ round: 1 })
            .lean();

        console.log(`Found ${completedRaces.length} races marked as "completed"\n`);
        console.log('='.repeat(100));

        const issues = [];
        const validRaces = [];

        for (const race of completedRaces) {
            const issuesForRace = [];
            
            // Check 1: Is the race in the future?
            if (race.raceStart) {
                const raceStartDate = new Date(race.raceStart);
                if (raceStartDate > now) {
                    const daysUntilRace = Math.ceil((raceStartDate - now) / (1000 * 60 * 60 * 24));
                    issuesForRace.push({
                        type: 'FUTURE_RACE',
                        message: `Race is ${daysUntilRace} days in the future`,
                        raceStart: raceStartDate.toISOString()
                    });
                }
            }

            // Check 2: Does it have results?
            const hasResults = race.results && Array.isArray(race.results) && race.results.length > 0;
            if (!hasResults) {
                issuesForRace.push({
                    type: 'NO_RESULTS',
                    message: 'Race has no driver results'
                });
            } else {
                // Check if it has enough results (should have ~20 drivers)
                if (race.results.length < 15) {
                    issuesForRace.push({
                        type: 'INCOMPLETE_RESULTS',
                        message: `Only ${race.results.length} driver results (expected ~20)`
                    });
                }
            }

            // Check 3: Does it have team results?
            const hasTeamResults = race.teamResults && Array.isArray(race.teamResults) && race.teamResults.length > 0;
            if (!hasTeamResults) {
                issuesForRace.push({
                    type: 'NO_TEAM_RESULTS',
                    message: 'Race has no team results'
                });
            } else {
                // Check if it has enough team results (should have ~10 teams)
                if (race.teamResults.length < 8) {
                    issuesForRace.push({
                        type: 'INCOMPLETE_TEAM_RESULTS',
                        message: `Only ${race.teamResults.length} team results (expected ~10)`
                    });
                }
            }

            // Check 4: Get race calendar to compare dates
            let calendarEntry = null;
            if (race.round) {
                calendarEntry = await RaceCalendar.findOne({ round: race.round, season: race.season || new Date().getFullYear() });
                if (calendarEntry && calendarEntry.raceStart) {
                    const calendarRaceStart = new Date(calendarEntry.raceStart);
                    if (calendarRaceStart > now) {
                        const daysUntilRace = Math.ceil((calendarRaceStart - now) / (1000 * 60 * 60 * 24));
                        issuesForRace.push({
                            type: 'CALENDAR_FUTURE',
                            message: `Race calendar shows race is ${daysUntilRace} days in the future`,
                            calendarRaceStart: calendarRaceStart.toISOString()
                        });
                    }
                }
            }

            if (issuesForRace.length > 0) {
                issues.push({
                    race: {
                        round: race.round,
                        raceName: race.raceName,
                        season: race.season,
                        status: race.status,
                        raceStart: race.raceStart,
                        resultsCount: race.results?.length || 0,
                        teamResultsCount: race.teamResults?.length || 0
                    },
                    issues: issuesForRace
                });
            } else {
                validRaces.push({
                    round: race.round,
                    raceName: race.raceName,
                    season: race.season
                });
            }
        }

        // Display results
        if (issues.length > 0) {
            console.log(`\n⚠️  Found ${issues.length} races with issues:\n`);
            issues.forEach((item, index) => {
                console.log(`${index + 1}. ${item.race.raceName} (Round ${item.race.round}, Season ${item.race.season})`);
                console.log(`   Status: ${item.race.status}`);
                console.log(`   Race Start: ${item.race.raceStart ? new Date(item.race.raceStart).toISOString() : 'N/A'}`);
                console.log(`   Driver Results: ${item.race.resultsCount}`);
                console.log(`   Team Results: ${item.race.teamResultsCount}`);
                console.log(`   Issues:`);
                item.issues.forEach(issue => {
                    console.log(`     - [${issue.type}] ${issue.message}`);
                    if (issue.raceStart) console.log(`       Race Start: ${issue.raceStart}`);
                    if (issue.calendarRaceStart) console.log(`       Calendar Start: ${issue.calendarRaceStart}`);
                });
                console.log('');
            });

            console.log('\n' + '='.repeat(100));
            console.log('\n💡 Recommendation: These races should have their status changed from "completed" to "scheduled" or "upcoming"');
            console.log('   until the race actually happens and has proper results.\n');
        } else {
            console.log('\n✅ All completed races appear to be valid!');
        }

        if (validRaces.length > 0) {
            console.log(`\n✅ ${validRaces.length} races are correctly marked as completed:`);
            validRaces.forEach(race => {
                console.log(`   - ${race.raceName} (Round ${race.round}, Season ${race.season})`);
            });
        }

        // Summary
        console.log('\n' + '='.repeat(100));
        console.log('\n📊 Summary:');
        console.log(`   Total completed races: ${completedRaces.length}`);
        console.log(`   Valid races: ${validRaces.length}`);
        console.log(`   Races with issues: ${issues.length}`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n✅ Disconnected from MongoDB');
    }
}

checkIncorrectlyCompletedRaces();

