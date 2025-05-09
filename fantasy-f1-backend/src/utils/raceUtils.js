const RaceSelection = require('../models/RaceSelection');
const League = require('../models/League');
const RaceCalendar = require('../models/RaceCalendar');

/**
 * Initialize empty race selections for all members of a league for a specific race
 * @param {string} leagueId - The ID of the league
 * @param {string} raceId - The ID of the race
 * @param {number} round - The round number of the race
 */
const initializeRaceSelections = async (leagueId, raceId, round) => {
    try {
        // Get the league with its members
        const league = await League.findById(leagueId).lean();

        if (!league) {
            throw new Error(`League not found: ${leagueId}`);
        }

        // Get the race to verify it exists
        const race = await RaceCalendar.findById(raceId);
        if (!race) {
            throw new Error(`Race not found: ${raceId}`);
        }

        // Create empty selections for each member
        const bulkOps = league.members.map(memberId => ({
            updateOne: {
                filter: {
                    user: memberId,
                    league: leagueId,
                    race: raceId,
                    round: round
                },
                update: {
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
                upsert: true
            }
        }));

        if (bulkOps.length > 0) {
            await RaceSelection.bulkWrite(bulkOps);
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