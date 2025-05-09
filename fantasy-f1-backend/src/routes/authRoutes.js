const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { 
    register, 
    login, 
    getProfile, 
    forgotPassword, 
    resetPassword,
    getCurrentUser 
} = require('../controllers/authController');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected routes
router.get('/me', authenticate, getCurrentUser);
router.get('/profile', authenticate, getProfile);

module.exports = router; 