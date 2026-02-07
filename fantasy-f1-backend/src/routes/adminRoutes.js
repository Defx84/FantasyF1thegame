const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { auth } = require('../middleware/auth');
const isAppAdmin = require('../middleware/isAppAdmin');
const { initializeLeaderboard } = require('../utils/initializeLeaderboard');
const League = require('../models/League');
const { processRace } = require('../services/updateRaceResultsService');

// Apply auth middleware to all routes
router.use(auth);
router.use(isAppAdmin);

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

// Add route for manually updating race results
router.post('/update-race-results/:round', async (req, res) => {
    try {
        const { round } = req.params;
        const raceName = req.body.raceName;
        const slug = req.body.slug;

        if (!raceName || !slug) {
            return res.status(400).json({ message: 'Race name and slug are required' });
        }

        await processRace(round, raceName, slug);
        res.json({ message: 'Race results updated successfully' });
    } catch (error) {
        console.error('Error updating race results:', error);
        res.status(500).json({ message: 'Failed to update race results', error: error.message });
    }
});

// Add route for triggering the scraper for all missing or incomplete race results
router.post('/scrape-missing-races', async (req, res) => {
    try {
        const { runScraper } = require('../scrapers/motorsportScraper');
        await runScraper();
        res.json({ message: 'Scraping triggered for all missing or incomplete race results.' });
    } catch (error) {
        console.error('Error triggering race results scraping:', error);
        res.status(500).json({ message: 'Failed to trigger race results scraping', error: error.message });
    }
});

// Manual scraper trigger for specific race
router.post('/trigger-scraper', adminController.triggerManualScraper);

// Assign real points to all users in a league for a given round
router.post('/assign-real-points-league', adminController.assignRealPointsToLeague);

// Manual race results entry endpoints
router.get('/races-list', adminController.getRacesList);
router.get('/drivers-teams/:season', adminController.getDriversAndTeams);
router.post('/manual-race-results', adminController.saveManualRaceResults);

// Cleanup test leagues
router.post('/cleanup-test-leagues', adminController.cleanupTestLeagues);

module.exports = router; 