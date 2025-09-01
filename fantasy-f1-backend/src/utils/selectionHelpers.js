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
 * Updated: Added trivial change to help with git operations
 */
const checkDriverReuse = (pastSelections, driverName) => {
  if (!pastSelections || pastSelections.length === 0) {
    return { canReuse: true };
  }

  // Normalize driver name for comparison
  const normalizedDriver = driverName.toLowerCase();

  // Get all unique drivers used in past selections (main + reserve)
  const allUsedDrivers = [];
  pastSelections.forEach(selection => {
    if (selection.mainDriver) allUsedDrivers.push(selection.mainDriver.toLowerCase());
    if (selection.reserveDriver) allUsedDrivers.push(selection.reserveDriver.toLowerCase());
  });
  const uniqueDrivers = [...new Set(allUsedDrivers)];

  // Only consider the current cycle
  const driverCycle = Math.floor(uniqueDrivers.length / 20);
  const currentCycleDriverStart = driverCycle * 20;
  const currentCycleDrivers = uniqueDrivers.slice(currentCycleDriverStart);

  // Check if driver has been used in the current cycle
  if (currentCycleDrivers.includes(normalizedDriver)) {
    return { 
      canReuse: false,
      reason: `Driver ${driverName} has already been used in this cycle. You must use all 20 drivers before reusing.`
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
  const uniqueTeams = [...new Set(pastSelections.map(s => s.team).filter(Boolean))];

  // Only consider the current cycle
  const teamCycle = Math.floor(uniqueTeams.length / 10);
  const currentCycleTeamStart = teamCycle * 10;
  const currentCycleTeams = uniqueTeams.slice(currentCycleTeamStart);

  // Check if team has been used in the current cycle
  if (currentCycleTeams.some(team => team.toLowerCase() === normalizedTeam)) {
    return { 
      canReuse: false,
      reason: `Team ${teamToDisplay.get(normalizedTeam)} has already been used in this cycle. You must use all 10 teams before reusing.`
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