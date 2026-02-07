/**
 * Season-aware F1 Data Loader
 * Returns the appropriate season's driver and team data based on the season parameter
 * 
 * @param {number} season - The F1 season year (e.g., 2025, 2026)
 * @returns {Object} Object containing F1_DRIVERS, F1_TEAMS, and helper functions for that season
 */
const getF1Data = (season) => {
  switch (season) {
    case 2025:
      return require('./f1Data2025');
    case 2026:
      return require('./f1Data2026');
    default:
      // Test seasons (e.g., 3026) should use the latest available data
      if (season >= 2026) {
        return require('./f1Data2026');
      }
      // Default to current year, or fallback to most recent available season
      const currentYear = new Date().getFullYear();
      if (currentYear >= 2026) {
        return require('./f1Data2026');
      }
      return require('./f1Data2025');
  }
};

/**
 * Get F1 drivers for a specific season
 * @param {number} season - The F1 season year
 * @returns {Array} Array of driver objects
 */
const getF1Drivers = (season) => {
  const data = getF1Data(season);
  // Handle season-specific naming (F1_DRIVERS_2025, F1_DRIVERS_2026, etc.)
  if (data[`F1_DRIVERS_${season}`]) {
    return data[`F1_DRIVERS_${season}`];
  }
  // For test seasons (e.g., 3026), fall back to the latest available list
  if (season >= 2026 && data.F1_DRIVERS_2026) {
    return data.F1_DRIVERS_2026;
  }
  return data.F1_DRIVERS || [];
};

/**
 * Get F1 teams for a specific season
 * @param {number} season - The F1 season year
 * @returns {Array} Array of team objects
 */
const getF1Teams = (season) => {
  const data = getF1Data(season);
  // Handle season-specific naming (F1_TEAMS_2025, F1_TEAMS_2026, etc.)
  if (data[`F1_TEAMS_${season}`]) {
    return data[`F1_TEAMS_${season}`];
  }
  // For test seasons (e.g., 3026), fall back to the latest available list
  if (season >= 2026 && data.F1_TEAMS_2026) {
    return data.F1_TEAMS_2026;
  }
  return data.F1_TEAMS || [];
};

/**
 * Get validation functions for a specific season
 * @param {number} season - The F1 season year
 * @returns {Object} Object containing isValidDriver, isValidTeam, normalizeDriverName, normalizeTeamName
 */
const getF1Validation = (season) => {
  const data = getF1Data(season);
  return {
    isValidDriver: data.isValidDriver,
    isValidTeam: data.isValidTeam,
    normalizeDriverName: data.normalizeDriverName,
    normalizeTeamName: data.normalizeTeamName,
    getDriverTeam: data.getDriverTeam,
    getTeamDrivers: data.getTeamDrivers
  };
};

/**
 * Get all F1 data (drivers, teams, and validation functions) for a specific season
 * This is a convenience function that returns everything in one call
 * @param {number} season - The F1 season year
 * @returns {Object} Object containing drivers, teams, and validation functions
 */
const getAllF1Data = (season) => {
  const data = getF1Data(season);
  return {
    drivers: getF1Drivers(season),
    teams: getF1Teams(season),
    ...getF1Validation(season),
    // Also include the raw data object for advanced use cases
    raw: data
  };
};

module.exports = {
  getF1Data,
  getF1Drivers,
  getF1Teams,
  getF1Validation,
  getAllF1Data
};

