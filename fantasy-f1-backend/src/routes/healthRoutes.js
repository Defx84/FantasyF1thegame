const express = require('express');
const router = express.Router();
const { getHealthStatus } = require('../controllers/healthController');
const { generalLimiter } = require('../middleware/rateLimiter');

// Apply rate limiting to health check endpoint
router.use(generalLimiter);

// Health check endpoint
router.get('/', getHealthStatus);

module.exports = router; 