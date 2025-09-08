const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { getUserPreferences, updateEmailReminders, getUserProfile, sendTestReminderEmail, getAllUsers } = require('../controllers/userController');

// All routes require authentication
router.use(auth);

// GET /api/users/profile - Get user profile
router.get('/profile', getUserProfile);

// GET /api/users/preferences - Get user preferences
router.get('/preferences', getUserPreferences);

// PUT /api/users/preferences/reminders - Update email reminder preference
router.put('/preferences/reminders', updateEmailReminders);

// GET /api/users/all - Get all users (admin only)
router.get('/all', getAllUsers);

// POST /api/users/test-reminder - Send test reminder email (admin only)
router.post('/test-reminder', sendTestReminderEmail);

module.exports = router;
