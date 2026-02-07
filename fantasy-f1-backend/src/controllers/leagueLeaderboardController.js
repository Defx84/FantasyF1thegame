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
            // Ensure user is populated for card lookup (same as findOne path)
            if (leaderboard && leaderboard.driverStandings?.length > 0) {
                await leaderboard.populate('driverStandings.user constructorStandings.user', 'username');
            }
        }

        if (!leaderboard) {
            console.error('Failed to create leaderboard');
            return res.status(404).json({ message: 'No leaderboard found for this league and season' });
        }

        // For 2026+ seasons, enrich race results with card usage (driver/team card + targets)
        const requestedSeason = parseInt(season, 10) || league.season;
        let cardMap = new Map(); // key: `${userId}-${round}` -> { driverCard, teamCard, ... }
        if (requestedSeason >= 2026) {
            require('../models/Card'); // ensure Card model is registered for populate
            const RaceCardSelection = require('../models/RaceCardSelection');
            const cardSelections = await RaceCardSelection.find({ league: id })
                .populate('driverCard', 'name')
                .populate('teamCard', 'name')
                .populate('targetPlayer', 'username')
                .populate('mysteryTransformedCard', 'name')
                .populate('randomTransformedCard', 'name')
                .lean();
            cardSelections.forEach(cs => {
                const key = `${String(cs.user)}-${Number(cs.round)}`;
                cardMap.set(key, {
                    driverCard: cs.driverCard ? { name: cs.driverCard.name } : null,
                    teamCard: cs.teamCard ? { name: cs.teamCard.name } : null,
                    targetTeam: cs.targetTeam || null,
                    targetDriver: cs.targetDriver || null,
                    targetPlayer: cs.targetPlayer ? { username: cs.targetPlayer.username } : null,
                    mysteryTransformedCardName: cs.mysteryTransformedCard?.name || null,
                    randomTransformedCardName: cs.randomTransformedCard?.name || null
                });
            });
        }

        // Normalize userId and round for card lookup (works for both populated and non-populated user)
        const getCardsForResult = (standing, r) => {
            const userIdRaw = standing.user?._id ?? standing.user;
            const userIdStr = userIdRaw != null ? String(userIdRaw) : '';
            const roundNum = r.round != null ? Number(r.round) : r.round;
            return cardMap.get(`${userIdStr}-${roundNum}`);
        };

        // Format the response
        const formattedLeaderboard = {
            league: leaderboard.league,
            season: leaderboard.season,
            lastUpdated: leaderboard.lastUpdated,
            driverStandings: leaderboard.driverStandings.map(standing => ({
                user: {
                    _id: standing.user?._id ?? standing.user,
                    username: standing.username
                },
                totalPoints: standing.totalPoints,
                raceResults: (standing.raceResults || []).map(r => {
                    const cards = getCardsForResult(standing, r);
                    const result = r.toObject ? r.toObject() : { ...r };
                    return { ...result, cards: cards || null };
                })
            })),
            constructorStandings: leaderboard.constructorStandings.map(standing => ({
                user: {
                    _id: standing.user?._id ?? standing.user,
                    username: standing.username
                },
                totalPoints: standing.totalPoints,
                raceResults: (standing.raceResults || []).map(r => {
                    const cards = getCardsForResult(standing, r);
                    const result = r.toObject ? r.toObject() : { ...r };
                    return { ...result, cards: cards || null };
                })
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