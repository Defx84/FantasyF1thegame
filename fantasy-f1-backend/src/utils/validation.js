const {
    F1_DRIVERS_2025,
    F1_TEAMS_2025,
    isValidDriver,
    isValidTeam,
    normalizedDriverNames,
    normalizedTeamNames
} = require('../constants/f1Data2025');
const { normalizeDriver, normalizeTeam } = require('../../shared/normalization');

// Export the lists for compatibility
const drivers = F1_DRIVERS_2025.map(d => d.name);
const teams = F1_TEAMS_2025.map(t => t.name);

module.exports = {
    drivers,
    teams,
    normalizedDrivers: normalizedDriverNames,
    normalizedTeams: normalizedTeamNames,
    isValidDriver,
    isValidTeam,
    normalizeDriver,
    normalizeTeam
}; 