const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  register,
  login,
  refreshToken,
  logout,
  getProfile,
  forgotPassword,
  resetPassword,
  changePassword,
  getCurrentUser,
  deleteAccount
} = require('../controllers/authController');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refreshToken);
router.post('/logout', auth, logout);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/change-password', auth, changePassword);

// Protected routes
router.get('/me', auth, getCurrentUser);
router.get('/profile', auth, getProfile);
router.delete('/delete', auth, deleteAccount);

module.exports = router; 