const League = require('../models/League');
const LeagueLeaderboard = require('../models/LeagueLeaderboard');
const RaceResult = require('../models/RaceResult');
const RaceSelection = require('../models/RaceSelection');
const LeagueStatistics = require('../models/LeagueStatistics');
const User = require('../models/User');

/**
 * Aggregate all data needed for the season archive PDF
 * @param {string} leagueId
 * @param {number} season
 * @returns {Promise<{league, standings, races, raceSelections, stats}>}
 */
async function getSeasonArchiveData(leagueId, season) {
  // 1. League info
  const league = await League.findById(leagueId)
    .populate('owner', 'username email')
    .populate('members', 'username email');
  if (!league) throw new Error('League not found');

  // 2. Standings
  const leaderboard = await LeagueLeaderboard.findOne({ league: leagueId, season })
    .populate('driverStandings.user constructorStandings.user', 'username');

  // 3. Races (all RaceResult for this league/season)
  const races = await RaceResult.find({ season }).sort({ round: 1 });

  // 4. Selections for each race/user
  const raceSelections = await RaceSelection.find({ league: leagueId }).lean();

  // 5. Stats: Fetch all LeagueStatistics for this league
  const leagueStats = await LeagueStatistics.find({ leagueId })
    .populate('userId', 'username')
    .populate('highestPointsRaceId', 'name date')
    .sort({ totalPoints: -1 });

  // Highest single-race score
  let highestSingleRace = null;
  leagueStats.forEach(stat => {
    if (!highestSingleRace || stat.highestPointsInRace > highestSingleRace.points) {
      highestSingleRace = {
        user: stat.userId.username,
        points: stat.highestPointsInRace,
        race: stat.highestPointsRaceId?.name || '',
        raceDate: stat.highestPointsRaceId?.date || null
      };
    }
  });

  // Most improved player (biggest difference between first and last race points)
  let mostImproved = null;
  leagueStats.forEach(stat => {
    if (stat.racesParticipated > 1 && stat.raceHistory && stat.raceHistory.length > 1) {
      const improvement = stat.raceHistory[stat.raceHistory.length - 1].points - stat.raceHistory[0].points;
      if (!mostImproved || improvement > mostImproved.improvement) {
        mostImproved = {
          user: stat.userId.username,
          improvement,
          from: stat.raceHistory[0].points,
          to: stat.raceHistory[stat.raceHistory.length - 1].points
        };
      }
    }
  });

  const stats = {
    leagueStats,
    highestSingleRace,
    mostImproved
  };

  return {
    league,
    standings: leaderboard,
    races,
    raceSelections,
    stats
  };
}

module.exports = { getSeasonArchiveData }; 