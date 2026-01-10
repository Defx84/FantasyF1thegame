const LeagueLeaderboard = require('../models/LeagueLeaderboard');
const League = require('../models/League');
const RaceSelection = require('../models/RaceSelection');
const RaceResult = require('../models/RaceResult');
const mongoose = require('mongoose');

/**
 * Initialize or update the leaderboard for a league
 * @param {string} leagueId - The ID of the league
 * @param {number} season - The season year
 */
const initializeLeaderboard = async (leagueId, season) => {
    try {
        // We don't need to connect here since the app should already be connected
        // Just verify the connection is active
        if (mongoose.connection.readyState !== 1) {
            throw new Error('MongoDB connection is not active');
        }

        console.log('Initializing leaderboard for league:', leagueId, 'season:', season);

        // Try to find the league using different ID formats
        let league;
        try {
            // First try with the ID as is and populate members with their usernames
            league = await League.findOne({ _id: leagueId }).populate({
                path: 'members',
                model: 'User',
                select: 'username'
            });
            
            // If not found, try converting to ObjectId
            if (!league && mongoose.Types.ObjectId.isValid(leagueId)) {
                league = await League.findOne({ 
                    _id: new mongoose.Types.ObjectId(leagueId) 
                }).populate({
                    path: 'members',
                    model: 'User',
                    select: 'username'
                });
            }
        } catch (error) {
            console.error('Error finding league:', error);
            throw new Error('Error finding league');
        }

        if (!league) {
            console.error('League not found with ID:', leagueId);
            throw new Error('League not found');
        }

        console.log('Found league:', league.name, 'with', league.members.length, 'members');

        // Get or create leaderboard
        let leaderboard = await LeagueLeaderboard.findOne({
            league: league._id,
            season: season
        });

        if (!leaderboard) {
            leaderboard = new LeagueLeaderboard({
                league: league._id,
                season: season,
                lastUpdated: new Date(),
                driverStandings: [],
                constructorStandings: []
            });
        }

        // Get all race results for this season only (CRITICAL: filter by season to avoid cross-season contamination)
        const raceResults = await RaceResult.find({ season: season }).sort({ round: 1 });

        // Initialize standings for each member
        for (const member of league.members) {
            // Initialize driver standings
            let driverStanding = leaderboard.driverStandings.find(
                standing => standing.user.toString() === member._id.toString()
            );

            if (!driverStanding && member._id && member.username) {
                driverStanding = {
                    user: member._id,
                    username: member.username,
                    totalPoints: 0,
                    raceResults: []
                };
                leaderboard.driverStandings.push(driverStanding);
            }

            // Initialize constructor standings
            let constructorStanding = leaderboard.constructorStandings.find(
                standing => standing.user.toString() === member._id.toString()
            );

            if (!constructorStanding && member._id && member.username) {
                constructorStanding = {
                    user: member._id,
                    username: member.username,
                    totalPoints: 0,
                    raceResults: []
                };
                leaderboard.constructorStandings.push(constructorStanding);
            }

            // Calculate points for each race
            for (const race of raceResults) {
                const selection = await RaceSelection.findOne({
                    user: member._id,
                    league: league._id,
                    round: race.round
                });
                if (!selection) continue;
                if (race.status !== 'completed') continue;
                if (!selection.mainDriver || !selection.reserveDriver || !selection.team) continue;

                // Use points and pointBreakdown from RaceSelection
                const points = selection.points || 0;
                const pb = selection.pointBreakdown || {};

                // Check if main driver didn't start the race
                const mainDriverDidNotStart = pb.mainDriverDidNotStart || false;
                const isSprintWeekend = pb.isSprintWeekend || false;
                
                // Add driver race result
                const driverRaceResult = {
                    round: race.round,
                    raceName: race.raceName,
                    mainDriver: selection.mainDriver,
                    reserveDriver: selection.reserveDriver,
                    points,
                    // For normal race: main driver points (or reserve if DNS)
                    // For sprint race: main driver points for main race
                    mainRacePoints: mainDriverDidNotStart ? (pb.reserveDriverPoints || 0) : (pb.mainDriverPoints || 0),
                    // For sprint race: reserve driver points for sprint
                    // For normal race: 0
                    sprintPoints: isSprintWeekend ? (pb.reserveDriverPoints || 0) : 0,
                    totalPoints: points
                };

                // Update or add driver race result
                const existingDriverResultIndex = driverStanding.raceResults.findIndex(
                    result => result.round === race.round
                );
                if (existingDriverResultIndex !== -1) {
                    driverStanding.raceResults[existingDriverResultIndex] = driverRaceResult;
                } else {
                    driverStanding.raceResults.push(driverRaceResult);
                }

                // Add constructor race result
                const teamMainRacePoints = pb.teamRacePoints ?? pb.teamPoints ?? 0;
                const teamSprintPoints = isSprintWeekend ? (pb.teamSprintPoints ?? 0) : 0;
                const constructorTotal = teamMainRacePoints + teamSprintPoints;
                const constructorRaceResult = {
                    round: race.round,
                    raceName: race.raceName,
                    team: selection.team,
                    mainRacePoints: teamMainRacePoints,
                    sprintPoints: teamSprintPoints,
                    totalPoints: constructorTotal
                };
                const existingConstructorResultIndex = constructorStanding.raceResults.findIndex(
                    result => result.round === race.round
                );
                if (existingConstructorResultIndex !== -1) {
                    constructorStanding.raceResults[existingConstructorResultIndex] = constructorRaceResult;
                } else {
                    constructorStanding.raceResults.push(constructorRaceResult);
                }
            }

            // Update total points
            driverStanding.totalPoints = driverStanding.raceResults.reduce(
                (sum, result) => sum + (result.mainRacePoints ?? 0) + (result.sprintPoints ?? 0),
                0
            );
            constructorStanding.totalPoints = constructorStanding.raceResults.reduce(
                (sum, result) => sum + (result.totalPoints ?? 0),
                0
            );
        }

        // Sort standings by total points
        leaderboard.driverStandings.sort((a, b) => b.totalPoints - a.totalPoints);
        leaderboard.constructorStandings.sort((a, b) => b.totalPoints - a.totalPoints);

        // Update last updated timestamp
        leaderboard.lastUpdated = new Date();

        // Save leaderboard with retry mechanism
        const maxRetries = 3;
        let retryCount = 0;
        let savedLeaderboard = null;

        while (retryCount < maxRetries) {
        try {
                savedLeaderboard = await leaderboard.save();
                break; // Success, exit the loop
        } catch (error) {
                // Handle duplicate key error
            if (error.name === 'MongoServerError' && error.code === 11000) {
                const existing = await LeagueLeaderboard.findOne({
                    league: league._id,
                    season: season
                });
                if (existing) return existing;
            }
                
                // Handle version error
                if (error.name === 'VersionError') {
                    retryCount++;
                    if (retryCount === maxRetries) {
                        throw new Error(`Failed to save leaderboard after ${maxRetries} retries due to version conflicts`);
        }
                    // Reload the leaderboard and try again
                    leaderboard = await LeagueLeaderboard.findOne({
                        league: league._id,
                        season: season
                    });
                    if (!leaderboard) {
                        throw new Error('Leaderboard not found during retry');
                    }
                    continue;
                }
                
                throw error; // Re-throw other errors
            }
        }

        return savedLeaderboard;
    } catch (error) {
        console.error('Error initializing leaderboard:', error);
        throw error;
    }
};

module.exports = {
    initializeLeaderboard
}; 