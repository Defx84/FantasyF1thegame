const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { auth } = require('../middleware/auth');
const isAppAdmin = require('../middleware/isAppAdmin');
const { initializeLeaderboard } = require('../utils/initializeLeaderboard');
const League = require('../models/League');

// Apply auth middleware to all routes
router.use(auth);

// Assign selections for missed deadline
router.post('/assign-missed', adminController.assignMissedSelection);

// Assign selections for late joiners
router.post('/assign-late-join', adminController.assignLateJoinSelection);

// Get all admin assignments for a league
router.get('/assignments/:leagueId', adminController.getAdminAssignments);

// Add leaderboard initialization endpoint for app admins
router.post('/initialize-leaderboard/:leagueId/:season', isAppAdmin, async (req, res) => {
  try {
    const { leagueId, season } = req.params;
    await initializeLeaderboard(leagueId, parseInt(season));
    res.json({ message: 'Leaderboard initialized/updated.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all leagues (app admin only)
router.get('/all-leagues', isAppAdmin, async (req, res) => {
  try {
    const leagues = await League.find({}).sort({ createdAt: -1 });
    res.json(leagues);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router; 