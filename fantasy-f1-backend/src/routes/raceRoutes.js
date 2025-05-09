const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const validateServerKey = require('../middleware/validateServerKey');
const { getNextRaceTiming, getCurrentRaceStatus, getRaceStatus, updateRaceResults, getLeagueRaces, getRaceByLeagueAndRound } = require('../controllers/raceController');

// Debug logging
console.log('Loading race routes:', {
  auth: typeof auth,
  getNextRaceTiming: typeof getNextRaceTiming,
  getCurrentRaceStatus: typeof getCurrentRaceStatus,
  getRaceStatus: typeof getRaceStatus,
  updateRaceResults: typeof updateRaceResults,
  getLeagueRaces: typeof getLeagueRaces,
  getRaceByLeagueAndRound: typeof getRaceByLeagueAndRound
});

// Get all races for a league
router.get('/league/:leagueId', auth, getLeagueRaces);

// Get specific race by league and round
router.get('/league/:leagueId/round/:round', auth, getRaceByLeagueAndRound);

// Get next race timing information
router.get('/next-race', (req, res, next) => {
  console.log('✅ /next-race endpoint hit');
  next();
}, getNextRaceTiming);

// Get current race status
router.get('/current-race', getCurrentRaceStatus);

// Get specific race status
router.get('/race-status/:round', getRaceStatus);

// Post route for updating race results
router.post('/update-race-results/:round', validateServerKey, updateRaceResults);

module.exports = router; 