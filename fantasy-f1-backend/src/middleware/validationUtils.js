const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');
const { normalizedDrivers, normalizedTeams } = require('../utils/validation');

// Validate MongoDB ObjectId
const validateObjectId = (paramName) => {
  return (req, res, next) => {
    const id = req.params[paramName] || req.query[paramName] || req.body[paramName];
    
    if (!id) {
      return res.status(400).json({ message: `${paramName} is required` });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: `Invalid ${paramName}` });
    }

    next();
  };
};

// Validate league name
const validateLeagueName = [
  body('leagueName')
    .trim()
    .notEmpty()
    .withMessage('League name is required')
    .isLength({ min: 3, max: 50 })
    .withMessage('League name must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9\s]+$/)
    .withMessage('League name can only contain letters, numbers, and spaces')
];

// Validate league code
const validateLeagueCode = [
  body('code')
    .trim()
    .notEmpty()
    .withMessage('League code is required')
    .isLength({ min: 6, max: 6 })
    .withMessage('League code must be exactly 6 characters')
    .matches(/^[A-Z0-9]+$/)
    .withMessage('League code must contain only uppercase letters and numbers')
];

// Validate selection input
const validateSelectionInput = [
  body('mainDriver')
    .trim()
    .notEmpty()
    .withMessage('Main driver is required')
    .custom((value) => {
      const normalized = value.toLowerCase();
      return normalizedDrivers.some(driver => driver.toLowerCase() === normalized);
    })
    .withMessage('Invalid main driver'),
  body('reserveDriver')
    .trim()
    .notEmpty()
    .withMessage('Reserve driver is required')
    .custom((value) => {
      if (value === 'None') return true;
      const normalized = value.toLowerCase();
      return normalizedDrivers.some(driver => driver.toLowerCase() === normalized);
    })
    .withMessage('Invalid reserve driver'),
  body('team')
    .trim()
    .notEmpty()
    .withMessage('Team is required')
    .custom((value) => {
      const normalized = value.toLowerCase();
      return normalizedTeams.some(team => team.toLowerCase() === normalized);
    })
    .withMessage('Invalid team'),
  body('round')
    .isInt({ min: 1, max: 24 })
    .withMessage('Round must be between 1 and 24')
];

// Validate admin selection
const validateAdminSelection = [
  ...validateSelectionInput,
  body('applyRealScoring')
    .optional()
    .isBoolean()
    .withMessage('applyRealScoring must be a boolean')
];

// Validate driver reuse
const validateDriverReuse = async (req, res, next) => {
  try {
    const { selections } = req.body;
    if (!selections || !Array.isArray(selections)) {
      return res.status(400).json({ message: 'Invalid selections format' });
    }

    const usedDrivers = new Set();
    for (const selection of selections) {
      const normalizedDriver = selection.mainDriver.toLowerCase();
      if (usedDrivers.has(normalizedDriver)) {
        return res.status(400).json({ 
          message: `Driver ${selection.mainDriver} has already been used` 
        });
      }
      usedDrivers.add(normalizedDriver);
    }

    next();
  } catch (error) {
    console.error('Driver reuse validation error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Validate switcheroo input
const validateSwitcherooInput = [
  body('raceId')
    .trim()
    .notEmpty()
    .withMessage('Race ID is required')
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage('Invalid race ID'),
  body('leagueId')
    .trim()
    .notEmpty()
    .withMessage('League ID is required')
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage('Invalid league ID'),
  body('originalDriver')
    .trim()
    .notEmpty()
    .withMessage('Original driver is required')
    .custom((value) => {
      const normalized = value.toLowerCase();
      return normalizedDrivers.some(driver => driver.toLowerCase() === normalized);
    })
    .withMessage('Invalid original driver'),
  body('newDriver')
    .trim()
    .notEmpty()
    .withMessage('New driver is required')
    .custom((value) => {
      const normalized = value.toLowerCase();
      return normalizedDrivers.some(driver => driver.toLowerCase() === normalized);
    })
    .withMessage('Invalid new driver')
];

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

module.exports = {
  validateObjectId,
  validateLeagueName,
  validateLeagueCode,
  validateSelectionInput,
  validateAdminSelection,
  validateDriverReuse,
  handleValidationErrors,
  validateSwitcherooInput
}; 