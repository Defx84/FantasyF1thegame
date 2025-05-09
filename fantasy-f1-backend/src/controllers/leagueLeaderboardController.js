const mongoose = require('mongoose');
const LeagueLeaderboard = require('../models/LeagueLeaderboard');
const RaceSelection = require('../models/RaceSelection');
const RaceResult = require('../models/RaceResult');
const { handleError } = require('../utils/errorHandler');
const League = require('../models/League');
const { initializeLeaderboard } = require('../utils/initializeLeaderboard');

/**
 * Update the league leaderboard with results from a new race
 */
const updateLeagueLeaderboard = async (leagueId, raceId, season) => {
    try {
        // Initialize or update the leaderboard
        const leaderboard = await initializeLeaderboard(leagueId, season);
        return leaderboard;
    } catch (error) {
        console.error('Error updating league leaderboard:', error);
        throw error;
    }
};

/**
 * Get the league leaderboard
 */
const getLeagueLeaderboard = async (req, res) => {
    try {
        const { id, season } = req.params;
        console.log('Getting leaderboard for league:', id, 'season:', season);

        // Verify the league exists first
        const league = await League.findById(id);
        if (!league) {
            console.error('League not found:', id);
            return res.status(404).json({ message: 'League not found' });
        }
        console.log('Found league:', league.name);

        // Try to get existing leaderboard
        let leaderboard = await LeagueLeaderboard.findOne({
            league: id,
            season: parseInt(season)
        }).populate('driverStandings.user constructorStandings.user', 'username');

        console.log('Existing leaderboard found:', !!leaderboard);

        // If no leaderboard exists or it needs updating, initialize it
        if (!leaderboard) {
            console.log('Initializing new leaderboard...');
            leaderboard = await initializeLeaderboard(id, parseInt(season));
        }

        if (!leaderboard) {
            console.error('Failed to create leaderboard');
            return res.status(404).json({ message: 'No leaderboard found for this league and season' });
        }

        // Format the response
        const formattedLeaderboard = {
            league: leaderboard.league,
            season: leaderboard.season,
            lastUpdated: leaderboard.lastUpdated,
            driverStandings: leaderboard.driverStandings.map(standing => ({
                user: {
                    _id: standing.user._id,
                    username: standing.username
                },
                totalPoints: standing.totalPoints,
                raceResults: standing.raceResults
            })),
            constructorStandings: leaderboard.constructorStandings.map(standing => ({
                user: {
                    _id: standing.user._id,
                    username: standing.username
                },
                totalPoints: standing.totalPoints,
                raceResults: standing.raceResults
            }))
        };

        res.json(formattedLeaderboard);
    } catch (error) {
        console.error('Error in getLeagueLeaderboard:', error);
        handleError(res, error);
    }
};

module.exports = {
    updateLeagueLeaderboard,
    getLeagueLeaderboard
};