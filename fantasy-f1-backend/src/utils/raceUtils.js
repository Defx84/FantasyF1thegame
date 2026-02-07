const RaceSelection = require('../models/RaceSelection');
const League = require('../models/League');
const RaceCalendar = require('../models/RaceCalendar');

/**
 * Initialize empty race selections for all members of a league for a specific race.
 * If a member already has a selection for this (league, round) with a different race _id
 * (e.g. calendar was wiped and re-created), we heal it to the current raceId instead of
 * creating a duplicate, so we avoid orphaned refs and unique-index violations.
 */
const initializeRaceSelections = async (leagueId, raceId, round) => {
    try {
        const league = await League.findById(leagueId).lean();
        if (!league) {
            throw new Error(`League not found: ${leagueId}`);
        }

        const race = await RaceCalendar.findById(raceId);
        if (!race) {
            throw new Error(`Race not found: ${raceId}`);
        }

        for (const memberId of league.members) {
            const existing = await RaceSelection.findOne({
                league: leagueId,
                user: memberId,
                round: round
            });

            if (existing) {
                if (existing.race && existing.race.toString() !== raceId.toString()) {
                    existing.race = raceId;
                    await existing.save();
                }
            } else {
                await RaceSelection.updateOne(
                    { user: memberId, league: leagueId, race: raceId, round: round },
                    {
                        $setOnInsert: {
                            mainDriver: null,
                            reserveDriver: null,
                            team: null,
                            points: 0,
                            status: 'empty',
                            isAdminAssigned: false,
                            notes: ''
                        }
                    },
                    { upsert: true }
                );
            }
        }

        return true;
    } catch (error) {
        console.error('Error initializing race selections:', error);
        throw error;
    }
};

/**
 * Initialize empty race selections for all races in a league
 * @param {string} leagueId - The ID of the league
 */
const initializeAllRaceSelections = async (leagueId) => {
    try {
        // Get all races from the calendar
        const races = await RaceCalendar.find({})
            .select('_id round')
            .lean();

        // Initialize selections for each race
        for (const race of races) {
            await initializeRaceSelections(leagueId, race._id, race.round);
        }

        return true;
    } catch (error) {
        console.error('Error initializing all race selections:', error);
        throw error;
    }
};

module.exports = {
    initializeRaceSelections,
    initializeAllRaceSelections
}; 