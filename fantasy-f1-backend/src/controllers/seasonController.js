const mongoose = require('mongoose');
const LeagueLeaderboard = require('../models/LeagueLeaderboard');
const League = require('../models/League');
const { handleError } = require('../utils/errorHandler');
const RaceResult = require('../models/RaceResult');
const { getSeasonArchiveData } = require('../utils/seasonArchiveData');
const { generateSeasonArchivePdf } = require('../utils/seasonArchivePdf');
const { sendSeasonArchiveToLeague } = require('../utils/email');

/**
 * Check if a season is complete
 */
const isSeasonComplete = async (season) => {
    try {
        // Get all races for the season
        const races = await RaceResult.find({ season });
        
        // Check if all races are completed
        return races.every(race => race.status === 'completed');
    } catch (error) {
        console.error('Error checking season completion:', error);
        throw error;
    }
};

/**
 * Get final standings for a league
 */
const getFinalStandings = async (leagueId, season) => {
    try {
        // Get the final leaderboard
        const leaderboard = await LeagueLeaderboard.findOne({
            league: leagueId,
            season: season
        }).populate('driverStandings.user constructorStandings.user', 'username');

        if (!leaderboard) {
            throw new Error('No leaderboard found for this league and season');
        }

        // Check if season is complete
        const seasonComplete = await isSeasonComplete(season);
        if (!seasonComplete) {
            throw new Error('Season is not yet complete');
        }

        // Format the final standings
        const finalStandings = {
            league: leaderboard.league,
            season: season,
            lastUpdated: leaderboard.lastUpdated,
            driverChampionship: {
                champion: leaderboard.driverStandings[0],
                second: leaderboard.driverStandings[1],
                third: leaderboard.driverStandings[2],
                standings: leaderboard.driverStandings.map((standing, index) => ({
                    position: index + 1,
                    user: standing.user,
                    username: standing.username,
                    totalPoints: standing.totalPoints
                }))
            },
            constructorChampionship: {
                champion: leaderboard.constructorStandings[0],
                second: leaderboard.constructorStandings[1],
                third: leaderboard.constructorStandings[2],
                standings: leaderboard.constructorStandings.map((standing, index) => ({
                    position: index + 1,
                    user: standing.user,
                    username: standing.username,
                    totalPoints: standing.totalPoints
                }))
            }
        };

        return finalStandings;
    } catch (error) {
        console.error('Error getting final standings:', error);
        throw error;
    }
};

/**
 * Update league with final standings
 * @param {string} leagueId - The league ID
 * @param {number} season - The season year
 * @param {boolean} skipEmail - If true, skip PDF generation and email sending (default: false)
 */
const updateLeagueWithFinalStandings = async (leagueId, season, skipEmail = false) => {
    try {
        // Get final standings
        const finalStandings = await getFinalStandings(leagueId, season);

        // Update league with final standings
        const league = await League.findByIdAndUpdate(
            leagueId,
            {
                $set: {
                    'seasonStatus': 'completed',
                    'finalStandings': finalStandings,
                    'lastUpdated': new Date()
                }
            },
            { new: true }
        );

        // --- Generate and email season archive PDF (unless skipped) ---
        if (!skipEmail) {
            try {
                const seasonData = await getSeasonArchiveData(leagueId, season);
                const pdfBuffer = await generateSeasonArchivePdf(seasonData.league, seasonData);
                await sendSeasonArchiveToLeague(seasonData.league, pdfBuffer);
                console.log(`[Season Archive] PDF sent to league members for league ${league.name} (season ${season})`);
            } catch (archiveErr) {
                console.error('[Season Archive] Failed to generate or send PDF:', archiveErr);
            }
        } else {
            console.log(`[Season Archive] Skipping PDF generation and email for league ${league.name} (season ${season})`);
        }
        // --- END PDF/Email logic ---

        return league;
    } catch (error) {
        console.error('Error updating league with final standings:', error);
        throw error;
    }
};

/**
 * Get final standings for a league
 */
const getFinalStandingsController = async (req, res) => {
    try {
        const { leagueId, season } = req.params;
        const finalStandings = await getFinalStandings(leagueId, season);
        res.json(finalStandings);
    } catch (error) {
        handleError(res, error);
    }
};

/**
 * Update league with final standings
 */
const updateLeagueWithFinalStandingsController = async (req, res) => {
    try {
        const { leagueId, season } = req.params;
        const updatedLeague = await updateLeagueWithFinalStandings(leagueId, season);
        res.json(updatedLeague);
    } catch (error) {
        handleError(res, error);
    }
};

module.exports = {
    isSeasonComplete,
    getFinalStandings,
    updateLeagueWithFinalStandings,
    getFinalStandingsController,
    updateLeagueWithFinalStandingsController
}; 