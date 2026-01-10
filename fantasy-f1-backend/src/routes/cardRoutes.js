const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const cardController = require('../controllers/cardController');

// Get all card definitions
router.get('/', cardController.getAllCards);

module.exports = router;

