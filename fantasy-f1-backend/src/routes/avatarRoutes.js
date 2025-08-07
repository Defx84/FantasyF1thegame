const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const isAppAdmin = require('../middleware/isAppAdmin');
const {
  getUserAvatar,
  updateUserAvatar,
  getHelmetImage,
  getAllUsersAvatars,
  resetUserAvatar
} = require('../controllers/avatarController');

// All routes require authentication and admin privileges
router.use(auth);
router.use(isAppAdmin);

// Get all users with avatar data (for admin testing)
router.get('/users', getAllUsersAvatars);

// Get specific user's avatar configuration
router.get('/users/:userId', getUserAvatar);

// Update user's avatar configuration
router.put('/users/:userId', updateUserAvatar);

// Reset user's avatar to default
router.delete('/users/:userId', resetUserAvatar);

// Get helmet image for a user
router.get('/users/:userId/helmet', getHelmetImage);

module.exports = router; 