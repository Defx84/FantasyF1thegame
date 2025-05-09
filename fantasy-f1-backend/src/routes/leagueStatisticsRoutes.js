const express = require('express');
const router = express.Router();
const leagueStatisticsController = require('../controllers/leagueStatisticsController');
const { auth } = require('../middleware/auth');
const { RaceResult } = require('../models/RaceResult');
const { User } = require('../models/User');
const { League } = require('../models/League');

// Debug logging
console.log({
  auth: typeof auth,
  getUserStatistics: typeof leagueStatisticsController.getUserStatistics,
  getLeagueStatistics: typeof leagueStatisticsController.getLeagueStatistics,
  updateLeagueStatistics: typeof leagueStatisticsController.updateLeagueStatistics
});

// Get statistics for a specific user in a league
router.get('/league/:leagueId/user/:userId', auth, leagueStatisticsController.getUserStatistics);

// Get all statistics for a league
router.get('/league/:leagueId', auth, leagueStatisticsController.getLeagueStatistics);

// Update statistics for all users in a league
router.post('/league/:leagueId/update', auth, leagueStatisticsController.updateLeagueStatistics);

// New routes
// Get user statistics
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get all race results for the user
    const raceResults = await RaceResult.find({ 'driverStandings.user': userId });
    
    // Calculate statistics
    const totalPoints = raceResults.reduce((sum, result) => {
      const userStanding = result.driverStandings.find(standing => standing.user.toString() === userId);
      return sum + (userStanding?.totalPoints || 0);
    }, 0);
    
    const averagePoints = raceResults.length > 0 ? totalPoints / raceResults.length : 0;
    
    const bestPerformance = Math.max(...raceResults.map(result => {
      const userStanding = result.driverStandings.find(standing => standing.user.toString() === userId);
      return userStanding?.totalPoints || 0;
    }));
    
    res.json({
      totalPoints,
      averagePoints,
      bestPerformance,
      raceHistory: raceResults.map(result => ({
        race: result.raceName,
        points: result.driverStandings.find(standing => standing.user.toString() === userId)?.totalPoints || 0,
        position: result.driverStandings.find(standing => standing.user.toString() === userId)?.position || 0
      }))
    });
  } catch (error) {
    console.error('Error fetching user statistics:', error);
    res.status(500).json({ error: 'Failed to fetch user statistics' });
  }
});

// Get driver and team statistics
router.get('/driver-team', auth, async (req, res) => {
  try {
    const raceResults = await RaceResult.find();
    if (!raceResults || raceResults.length === 0) {
      console.error('No race results found for driver-team statistics');
      return res.status(404).json({ error: 'No race results found' });
    }
    const driverStats = {};
    const teamStats = {};
    raceResults.forEach(result => {
      if (!result.driverStandings || !Array.isArray(result.driverStandings)) {
        console.error('Missing or malformed driverStandings in race result:', result._id, result);
        return;
      }
      result.driverStandings.forEach(standing => {
        if (!standing.driver || !standing.team) {
          console.error('Missing driver or team in standing:', standing);
          return;
        }
        // Update driver stats
        if (!driverStats[standing.driver]) {
          driverStats[standing.driver] = {
            totalPoints: 0,
            races: 0,
            averagePoints: 0
          };
        }
        driverStats[standing.driver].totalPoints += standing.totalPoints;
        driverStats[standing.driver].races += 1;
        driverStats[standing.driver].averagePoints = 
          driverStats[standing.driver].totalPoints / driverStats[standing.driver].races;
        // Update team stats
        if (!teamStats[standing.team]) {
          teamStats[standing.team] = {
            totalPoints: 0,
            races: 0,
            averagePoints: 0
          };
        }
        teamStats[standing.team].totalPoints += standing.totalPoints;
        teamStats[standing.team].races += 1;
        teamStats[standing.team].averagePoints = 
          teamStats[standing.team].totalPoints / teamStats[standing.team].races;
      });
    });
    res.json({
      drivers: driverStats,
      teams: teamStats
    });
  } catch (error) {
    console.error('Driver-Team Stats Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router; 