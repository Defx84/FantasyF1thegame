const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const leagueController = require('../controllers/leagueController');
const { getLeagueLeaderboard } = require('../controllers/leagueLeaderboardController');

// Debug log
console.log('leagueController:', leagueController);

// Public route to get league by code (must come before /:id)
router.get('/code/:code', leagueController.getLeagueByCode);

// Protected routes
router.post('/', auth, leagueController.createLeague);
router.post('/join', auth, leagueController.joinLeague);
router.get('/user/leagues', auth, leagueController.getUserLeagues);
router.get('/:id', auth, leagueController.getLeague);
router.get('/:id/members', auth, leagueController.getLeagueMembers);
router.get('/:id/selections', auth, leagueController.getLeagueSelections);
router.get('/:id/standings/:season', auth, getLeagueLeaderboard);

// Abandon league (user leaves league and deletes their data)
router.post('/:id/abandon', auth, leagueController.abandonLeague);

// Delete league
router.delete('/:id', auth, leagueController.deleteLeague);

module.exports = router; 