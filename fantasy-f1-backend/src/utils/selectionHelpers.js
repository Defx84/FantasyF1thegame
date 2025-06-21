const { subMinutes } = require('date-fns');
const { F1_DRIVERS_2025 } = require('../constants/f1DriverData');
const { normalizedDrivers, driverToTeam } = require('../constants/validDrivers');
const { normalizedTeams, teamToDisplay } = require('../constants/validTeams');
const { normalizeDriverName } = require('../constants/driverNameNormalization');

/**
 * Checks if a race is locked based on its qualifying time
 * @param {Date} qualifyingTime - The race's qualifying time
 * @returns {boolean} - True if the race is locked (current time >= qualifying time - 5 minutes)
 */
const isRaceLocked = (qualifyingTime) => {
  if (!qualifyingTime) return false;
  
  const lockTime = subMinutes(new Date(qualifyingTime), 5);
  const currentTime = new Date();
  
  return currentTime >= lockTime;
};

/**
 * Checks if a driver can be reused based on past selections
 * @param {Array} pastSelections - Array of past selection objects
 * @param {string} driverName - Name of the driver to check
 * @returns {Object} - { canReuse: boolean, reason?: string }
 */
const checkDriverReuse = (pastSelections, driverName) => {
  if (!pastSelections || pastSelections.length === 0) {
    return { canReuse: true };
  }

  // Normalize driver name for comparison
  const normalizedDriver = driverName.toLowerCase();

  // Get all unique drivers used in past selections
  const uniqueDrivers = new Set();
  pastSelections.forEach(selection => {
    if (selection.mainDriver) uniqueDrivers.add(selection.mainDriver.toLowerCase());
    if (selection.reserveDriver) uniqueDrivers.add(selection.reserveDriver.toLowerCase());
  });

  // If all 20 drivers have been used, reset the list
  if (uniqueDrivers.size >= 20) {
    return { canReuse: true };
  }

  // Check if driver has been used before
  if (uniqueDrivers.has(normalizedDriver)) {
    return { 
      canReuse: false,
      reason: `Driver ${driverName} has already been used. You must use all 20 drivers before reusing.`
    };
  }

  return { canReuse: true };
};

/**
 * Checks if a team can be reused based on past selections
 * @param {Array} pastSelections - Array of past selection objects
 * @param {string} teamName - Name of the team to check
 * @returns {Object} - { canReuse: boolean, reason?: string }
 */
const checkTeamReuse = (pastSelections, teamName) => {
  if (!pastSelections || pastSelections.length === 0) {
    return { canReuse: true };
  }

  // Normalize team name for comparison
  const normalizedTeam = teamName.toLowerCase();

  // Get all unique teams used in past selections
  const uniqueTeams = new Set();
  pastSelections.forEach(selection => {
    if (selection.team) uniqueTeams.add(selection.team.toLowerCase());
  });

  // If all 10 teams have been used, reset the list
  if (uniqueTeams.size >= 10) {
    return { canReuse: true };
  }

  // Check if team has been used before
  if (uniqueTeams.has(normalizedTeam)) {
    return { 
      canReuse: false,
      reason: `Team ${teamToDisplay.get(normalizedTeam)} has already been used. You must use all 10 teams before reusing.`
    };
  }

  return { canReuse: true };
};

/**
 * Validates a selection against all rules
 * @param {Object} selection - The selection to validate
 * @param {Array} pastSelections - Array of past selection objects
 * @param {Date} qualifyingTime - The race's qualifying time
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
const validateSelection = (selection, pastSelections, qualifyingTime) => {
  const errors = [];

  // Check race lock time
  if (isRaceLocked(qualifyingTime)) {
    errors.push('Race is locked. Selections cannot be made after qualifying starts.');
  }

  // Check driver reuse
  const mainDriverCheck = checkDriverReuse(pastSelections, selection.mainDriver);
  if (!mainDriverCheck.canReuse) {
    errors.push(mainDriverCheck.reason);
  }

  const reserveDriverCheck = checkDriverReuse(pastSelections, selection.reserveDriver);
  if (!reserveDriverCheck.canReuse) {
    errors.push(reserveDriverCheck.reason);
  }

  // Check team reuse
  const teamCheck = checkTeamReuse(pastSelections, selection.team);
  if (!teamCheck.canReuse) {
    errors.push(teamCheck.reason);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Get all valid driver names (normalized)
// Note: normalizedDrivers is already imported from '../constants/validDrivers'
// const normalizedDrivers = Array.from(driverToTeam.keys());

// Helper functions
const getDriverTeam = (driver) => {
    if (!driver) return null;
    return driverToTeam.get(driver.toLowerCase());
};

const isValidDriver = (driver) => {
    if (!driver) return false;
    return driverToTeam.has(driver.toLowerCase());
};

module.exports = {
    normalizedDrivers,
    driverToTeam,
    getDriverTeam,
    isValidDriver,
    isRaceLocked,
    checkDriverReuse,
    checkTeamReuse,
    validateSelection
}; 