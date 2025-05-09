const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { auth } = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(auth);

// Assign selections for missed deadline
router.post('/assign-missed', adminController.assignMissedSelection);

// Assign selections for late joiners
router.post('/assign-late-join', adminController.assignLateJoinSelection);

// Get all admin assignments for a league
router.get('/assignments/:leagueId', adminController.getAdminAssignments);

module.exports = router; 