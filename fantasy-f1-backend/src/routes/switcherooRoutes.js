const express = require('express');
const { auth } = require('../middleware/auth');
const switcherooController = require('../controllers/switcherooController');
const { validateObjectId } = require('../middleware/validationUtils');
const { validateSwitcherooInput } = require('../middleware/validationUtils');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(auth);

// Get remaining switcheroos for a user
router.get('/remaining', switcherooController.getRemainingSwitcheroos);

// Get switcheroo history for a league
router.get('/:leagueId/history', validateObjectId, switcherooController.getSwitcherooHistory);

// Perform a switcheroo
router.post('/', validateSwitcherooInput, switcherooController.performSwitcheroo);

module.exports = router; 