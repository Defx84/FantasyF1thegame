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

        // Get all race results (shared, not filtered by league or season)
        const raceResults = await RaceResult.find({}).sort({ round: 1 });

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

                // Add driver race result
                const driverRaceResult = {
                    round: race.round,
                    raceName: race.raceName,
                    mainDriver: selection.mainDriver,
                    reserveDriver: selection.reserveDriver,
                    points,
                    mainRacePoints: pb.mainDriverPoints || 0,
                    sprintPoints: pb.reserveDriverPoints || 0,
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
                const teamSprintPoints = pb.teamSprintPoints ?? 0;
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
                (sum, result) => sum + (result.points ?? result.totalPoints ?? 0),
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

        // Save leaderboard
        try {
        await leaderboard.save();
        } catch (error) {
            // If duplicate key error, find and return the existing leaderboard
            if (error.name === 'MongoServerError' && error.code === 11000) {
                const existing = await LeagueLeaderboard.findOne({
                    league: league._id,
                    season: season
                });
                if (existing) return existing;
            }
            throw error;
        }

        return leaderboard;
    } catch (error) {
        console.error('Error initializing leaderboard:', error);
        throw error;
    }
};

module.exports = {
    initializeLeaderboard
}; 