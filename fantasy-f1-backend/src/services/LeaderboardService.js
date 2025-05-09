const LeagueLeaderboard = require('../models/LeagueLeaderboard');
const RaceSelection = require('../models/RaceSelection');
const League = require('../models/League');
const User = require('../models/User');
const RaceResult = require('../models/RaceResult');

class LeaderboardService {
    /**
     * Update standings for a league after point assignment
     * @param {string} leagueId - The ID of the league to update
     * @param {string} raceId - Optional: specific race ID that triggered the update
     */
    async updateStandings(leagueId, raceId = null) {
        try {
            // Get all members of the league
            const league = await League.findById(leagueId);
            if (!league) {
                throw new Error('League not found');
            }

            // Get all members with their user data
            const members = await User.find({
                _id: { $in: league.members }
            }, 'username');

            // Get ALL race selections for the league (each league is unique to a single season)
            const selections = await RaceSelection.find({ league: leagueId })
                .populate('user', 'username')
                .populate('race', 'round raceName');

            // Get or create leaderboard
            let leaderboard = await LeagueLeaderboard.findOne({
                league: leagueId,
                season: new Date().getFullYear()
            });

            if (!leaderboard) {
                leaderboard = new LeagueLeaderboard({
                    league: leagueId,
                    season: new Date().getFullYear(),
                    lastUpdated: new Date(),
                    driverStandings: [],
                    constructorStandings: []
                });
            }

            // Process each member's standings
            for (const member of members) {
                // Get ALL member's selections
                const memberSelections = selections.filter(
                    selection => selection.user._id.toString() === member._id.toString()
                );

                // Calculate total points and prepare race results
                const driverRaceResults = [];
                const constructorRaceResults = [];
                let driverTotalPoints = 0;
                let constructorTotalPoints = 0;

                for (const selection of memberSelections) {
                    // Only process if all required fields are present
                    if (!selection.mainDriver || !selection.reserveDriver || !selection.team) continue;
                    // Only process if the race is completed (check RaceResult)
                    const raceResult = await RaceResult.findOne({ round: selection.round });
                    if (!raceResult || raceResult.status !== "completed") continue;

                    // Always create a pointBreakdown object, even if null
                    const pb = selection.pointBreakdown || {
                        mainDriver: selection.mainDriver,
                        reserveDriver: selection.reserveDriver,
                        team: selection.team,
                        mainDriverPoints: 0,
                        reserveDriverPoints: 0,
                        teamPoints: 0,
                        isSprintWeekend: false,
                        mainDriverStatus: 'FINISHED'
                    };

                    console.log('Processing selection:', {
                        round: selection.round,
                        raceName: selection.race.raceName,
                        mainDriver: selection.mainDriver,
                        reserveDriver: selection.reserveDriver,
                        team: selection.team,
                        pointBreakdown: pb
                    });

                    // Driver race result - always create an entry
                    const driverResult = {
                        round: selection.round,
                        raceName: selection.race.raceName,
                        mainDriver: selection.mainDriver,
                        reserveDriver: selection.reserveDriver,
                        mainRacePoints: pb.mainDriverPoints || 0,
                        sprintPoints: pb.reserveDriverPoints || 0,
                        totalPoints: (pb.mainDriverPoints || 0) + (pb.reserveDriverPoints || 0),
                        isSprintWeekend: pb.isSprintWeekend || false,
                        mainDriverStatus: pb.mainDriverStatus || 'FINISHED'
                    };
                    console.log('Driver result:', driverResult);
                    driverRaceResults.push(driverResult);
                    driverTotalPoints += driverResult.totalPoints;

                    // Constructor race result - always create an entry
                    const constructorResult = {
                        round: selection.round,
                        raceName: selection.race.raceName,
                        team: selection.team,
                        mainRacePoints: pb.teamPoints || 0,
                        sprintPoints: 0,
                        totalPoints: pb.teamPoints || 0,
                        isSprintWeekend: pb.isSprintWeekend || false
                    };
                    console.log('Constructor result:', constructorResult);
                    constructorRaceResults.push(constructorResult);
                    constructorTotalPoints += constructorResult.totalPoints;
                }

                // Sort race results by round
                driverRaceResults.sort((a, b) => a.round - b.round);
                constructorRaceResults.sort((a, b) => a.round - b.round);

                // Update or create driver standing
                let driverStanding = leaderboard.driverStandings.find(
                    standing => standing.user.toString() === member._id.toString()
                );

                if (!driverStanding) {
                    driverStanding = {
                        user: member._id,
                        username: member.username,
                        totalPoints: driverTotalPoints,
                        raceResults: driverRaceResults
                    };
                    leaderboard.driverStandings.push(driverStanding);
                } else {
                    driverStanding.totalPoints = driverTotalPoints;
                    driverStanding.raceResults = driverRaceResults;
                }

                // Update or create constructor standing
                let constructorStanding = leaderboard.constructorStandings.find(
                    standing => standing.user.toString() === member._id.toString()
                );

                if (!constructorStanding) {
                    constructorStanding = {
                        user: member._id,
                        username: member.username,
                        totalPoints: constructorTotalPoints,
                        raceResults: constructorRaceResults
                    };
                    leaderboard.constructorStandings.push(constructorStanding);
                } else {
                    constructorStanding.totalPoints = constructorTotalPoints;
                    constructorStanding.raceResults = constructorRaceResults;
                }
            }

            // Sort standings by total points
            leaderboard.driverStandings.sort((a, b) => b.totalPoints - a.totalPoints);
            leaderboard.constructorStandings.sort((a, b) => b.totalPoints - a.totalPoints);

            // Update last updated timestamp
            leaderboard.lastUpdated = new Date();

            // Save the updated leaderboard
            await leaderboard.save();

            return {
                driverStandings: leaderboard.driverStandings,
                constructorStandings: leaderboard.constructorStandings
            };
        } catch (error) {
            console.error('Error updating standings:', error);
            throw error;
        }
    }

    /**
     * Get current standings for a league
     * @param {string} leagueId - The ID of the league
     */
    async getStandings(leagueId) {
        try {
            const leaderboard = await LeagueLeaderboard.findOne({ league: leagueId })
                .populate('driverStandings.user constructorStandings.user', 'username');

            if (!leaderboard) {
                return {
                    driverStandings: [],
                    constructorStandings: []
                };
            }

            return {
                driverStandings: leaderboard.driverStandings,
                constructorStandings: leaderboard.constructorStandings
            };
        } catch (error) {
            console.error('Error getting standings:', error);
            throw error;
        }
    }

    /**
     * Get detailed race-by-race breakdown for a user in a league
     * @param {string} leagueId - The ID of the league
     * @param {string} userId - The ID of the user
     */
    async getUserRaceBreakdown(leagueId, userId) {
        try {
            const selections = await RaceSelection.find({
                league: leagueId,
                user: userId
            })
            .populate('race', 'round raceName date')
            .sort('race.round');

            return selections.map(selection => ({
                round: selection.race.round,
                raceName: selection.race.raceName,
                date: selection.race.date,
                mainDriver: selection.mainDriver,
                reserveDriver: selection.reserveDriver,
                team: selection.team,
                points: selection.points,
                breakdown: selection.pointBreakdown
            }));
        } catch (error) {
            console.error('Error getting user race breakdown:', error);
            throw error;
        }
    }
}

module.exports = LeaderboardService; 