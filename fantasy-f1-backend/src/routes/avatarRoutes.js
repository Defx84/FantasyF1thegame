const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const isAppAdmin = require('../middleware/isAppAdmin');
const {
  getUserAvatar,
  updateUserAvatar,
  getHelmetImage,
  getAllUsersAvatars,
  resetUserAvatar
} = require('../controllers/avatarController');

// Get all users with avatar data (admin only - for admin panel)
router.get('/users', auth, isAppAdmin, getAllUsersAvatars);

// Get specific user's avatar configuration (available to all authenticated users)
router.get('/users/:userId', auth, getUserAvatar);

// Update user's avatar configuration (available to all authenticated users)
router.put('/users/:userId', auth, updateUserAvatar);

// Reset user's avatar to default (available to all authenticated users)
router.delete('/users/:userId', auth, resetUserAvatar);

// Get helmet image for a user (available to all authenticated users)
router.get('/users/:userId/helmet', auth, getHelmetImage);

module.exports = router; 