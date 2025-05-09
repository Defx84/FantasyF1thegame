const express = require('express');
const router = express.Router();
const { getUsedSelections, getCurrentSelections, saveSelections } = require('../controllers/selectionController');
const { auth } = require('../middleware/auth');
const selectionController = require('../controllers/selectionController');

// Get used selections for the current user
router.get('/used', auth, getUsedSelections);

// Get current selections for the next race
router.get('/current', auth, getCurrentSelections);

// Save selections for the current user
router.post('/save', auth, saveSelections);

// Get selections for a specific race in a league
router.get('/league/:leagueId/race/:round', auth, selectionController.getRaceSelections);

// Admin override for selections
router.post('/admin/override', auth, selectionController.adminOverrideSelection);

module.exports = router; 