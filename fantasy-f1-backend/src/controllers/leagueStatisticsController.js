const LeagueStatistics = require('../models/LeagueStatistics');
const League = require('../models/League');
const RaceResult = require('../models/RaceResult');
const RaceSelection = require('../models/RaceSelection');
const { handleError } = require('../utils/errorHandler');
const LeagueLeaderboard = require('../models/LeagueLeaderboard');

/**
 * Calculate and update statistics for a user in a league
 */
const updateUserStatistics = async (leagueId, userId) => {
    try {
        // Get all races for the league
        const races = await RaceResult.find({ leagueId });
        
        // Get user's selections and points for each race
        let totalPoints = 0;
        let highestPoints = 0;
        let highestPointsRaceId = null;
        let racesParticipated = 0;
        let totalSuccessRate = 0;

        for (const race of races) {
            const userSelection = race.selections.find(s => s.userId.toString() === userId.toString());
            if (userSelection) {
                racesParticipated++;
                totalPoints += userSelection.points || 0;
                
                // Track highest points in a race
                if (userSelection.points > highestPoints) {
                    highestPoints = userSelection.points;
                    highestPointsRaceId = race._id;
                }

                // Calculate success rate for this race
                const driverPerformance = await calculateDriverPerformance(race, userSelection);
                totalSuccessRate += driverPerformance;
            }
        }

        const averagePointsPerRace = racesParticipated > 0 ? totalPoints / racesParticipated : 0;
        const successRate = racesParticipated > 0 ? totalSuccessRate / racesParticipated : 0;

        // Update or create statistics
        const statistics = await LeagueStatistics.findOneAndUpdate(
            { leagueId, userId },
            {
                totalPoints,
                racesParticipated,
                averagePointsPerRace,
                highestPointsInRace: highestPoints,
                highestPointsRaceId,
                successRate,
                lastUpdated: new Date()
            },
            { upsert: true, new: true }
        );

        return statistics;
    } catch (error) {
        throw error;
    }
};

/**
 * Calculate driver performance for a specific race selection
 */
const calculateDriverPerformance = async (race, userSelection) => {
    try {
        // Get all selections for this race
        const allSelections = race.selections;
        
        // Calculate average points for the selected driver
        const driverSelections = allSelections.filter(s => 
            s.driverId.toString() === userSelection.driverId.toString()
        );
        
        const totalDriverPoints = driverSelections.reduce((sum, s) => sum + (s.points || 0), 0);
        const averageDriverPoints = driverSelections.length > 0 ? 
            totalDriverPoints / driverSelections.length : 0;
        
        // Calculate success rate
        if (averageDriverPoints === 0) return 0;
        return (userSelection.points || 0) / averageDriverPoints;
    } catch (error) {
        throw error;
    }
};

/**
 * Get statistics for a specific user in a league
 */
const getUserStatistics = async (req, res) => {
    try {
        const { leagueId, userId } = req.params;
        // Get the current season (assume current year)
        const season = new Date().getFullYear();
        // Fetch the leaderboard for this league and season
        const leaderboard = await LeagueLeaderboard.findOne({
            league: leagueId,
            season: season
        });
        let driverPoints = 0;
        let teamPoints = 0;
        let driverAverages = [];
        let teamAverages = [];
        if (leaderboard) {
            const driverStanding = leaderboard.driverStandings.find(s => s.user.toString() === userId);
            const constructorStanding = leaderboard.constructorStandings.find(s => s.user.toString() === userId);
            if (driverStanding) {
                driverPoints = driverStanding.totalPoints;
                // Compute progressive driver averages
                let cumulativeDriverPoints = 0;
                driverStanding.raceResults.forEach((result, index) => {
                    cumulativeDriverPoints += result.totalPoints;
                    driverAverages.push(cumulativeDriverPoints / (index + 1));
                });
            }
            if (constructorStanding) {
                teamPoints = constructorStanding.totalPoints;
                // Compute progressive team averages
                let cumulativeTeamPoints = 0;
                constructorStanding.raceResults.forEach((result, index) => {
                    cumulativeTeamPoints += result.totalPoints;
                    teamAverages.push(cumulativeTeamPoints / (index + 1));
                });
            }
        }
        
        // Get the main statistics document
        const statistics = await LeagueStatistics.findOne({ leagueId, userId })
            .populate('highestPointsRaceId', 'name date')
            .populate('userId', 'username');

        // Get the user's race-by-race history for this league
        const raceHistory = await RaceSelection.find({ league: leagueId, user: userId })
            .sort({ round: 1 })
            .select('round points mainDriver reserveDriver team status')
            .lean();

        // Best Race (full details)
        let bestRace = null;
        if (raceHistory.length > 0) {
            bestRace = raceHistory.reduce((best, curr) => (curr.points > (best?.points || -Infinity) ? curr : best), null);
        }

        // Success Rate: % of races above league average
        let successCount = 0;
        let comebackCount = 0;
        let comebackRounds = [];
        let prevPoints = null;
        let totalPoints = 0;
        let leagueAverages = [];
        for (const race of raceHistory) {
            // Calculate league average for this round
            const allSelections = await RaceSelection.find({ league: leagueId, round: race.round });
            const avg = allSelections.length > 0 ? allSelections.reduce((sum, s) => sum + (s.points || 0), 0) / allSelections.length : 0;
            leagueAverages.push(avg);
            if (race.points > avg) successCount++;
            // Comeback: improved after a "bad" race (below user's average so far)
            if (prevPoints !== null && race.points > prevPoints && prevPoints < avg) {
                comebackCount++;
                comebackRounds.push(race.round);
            }
            prevPoints = race.points;
            totalPoints += race.points;
        }
        const successRate = raceHistory.length > 0 ? (successCount / raceHistory.length) * 100 : 0;

        // Return empty stats if no statistics
        if (!statistics) {
            return res.json({
                totalPoints: totalPoints,
                averagePoints: raceHistory.length > 0 ? totalPoints / raceHistory.length : 0,
                raceHistory: raceHistory,
                bestRace: bestRace,
                successRate: successRate,
                comebackCount: comebackCount,
                comebackRounds: comebackRounds,
                driverPoints: driverPoints,
                teamPoints: teamPoints,
                driverAverages: driverAverages,
                teamAverages: teamAverages,
                worstRace: null,
            });
        }

        res.json({
            ...statistics.toObject(),
            raceHistory,
            bestRace,
            successRate,
            comebackCount,
            comebackRounds,
            driverPoints,
            teamPoints,
            driverAverages,
            teamAverages
        });
    } catch (error) {
        handleError(res, error);
    }
};

/**
 * Get all statistics for a league
 */
const getLeagueStatistics = async (req, res) => {
    try {
        const { leagueId } = req.params;
        
        const statistics = await LeagueStatistics.find({ leagueId })
            .populate('userId', 'username')
            .populate('highestPointsRaceId', 'name date')
            .sort({ totalPoints: -1 });

        res.json(statistics);
    } catch (error) {
        handleError(res, error);
    }
};

/**
 * Update statistics for all users in a league
 */
const updateLeagueStatistics = async (req, res) => {
    try {
        const { leagueId } = req.params;
        
        // Get all users in the league
        const league = await League.findById(leagueId).populate('members');
        if (!league) {
            return res.status(404).json({ message: 'League not found' });
        }

        // Update statistics for each user
        const updates = league.members.map(member => 
            updateUserStatistics(leagueId, member._id)
        );
        
        await Promise.all(updates);

        res.json({ message: 'League statistics updated successfully' });
    } catch (error) {
        handleError(res, error);
    }
};

module.exports = {
    getUserStatistics,
    getLeagueStatistics,
    updateLeagueStatistics,
    updateUserStatistics
}; 