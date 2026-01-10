const mongoose = require('mongoose');
const { getAllF1Data } = require('../constants/f1DataLoader');
const League = require('./League');

const usedSelectionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  league: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'League',
    required: true
  },
  teamCycles: {
    type: [[String]], // Array of arrays of team names
    default: [[]]
  },
  driverCycles: {
    type: [[String]], // Array of arrays of driver short names (shared for main and reserve)
    default: [[]]
  },
  // Legacy fields - kept for migration compatibility, will be removed in future
  mainDriverCycles: {
    type: [[String]],
    default: [[]]
  },
  reserveDriverCycles: {
    type: [[String]],
    default: [[]]
  },
}, { timestamps: true });

// Create a compound index to ensure one selection per user/league
usedSelectionSchema.index({ user: 1, league: 1 }, { unique: true });

// Pre-save hook to ensure cycles are initialized
usedSelectionSchema.pre('save', function(next) {
  if (!this.teamCycles || this.teamCycles.length === 0) {
    this.teamCycles = [[]];
  }
  if (!this.driverCycles || this.driverCycles.length === 0) {
    this.driverCycles = [[]];
  }
  // Legacy: ensure old fields exist for migration compatibility
  if (!this.mainDriverCycles || this.mainDriverCycles.length === 0) {
    this.mainDriverCycles = [[]];
  }
  if (!this.reserveDriverCycles || this.reserveDriverCycles.length === 0) {
    this.reserveDriverCycles = [[]];
  }
  next();
});

// Helper method to get F1 data for this league's season
usedSelectionSchema.methods.getF1DataForSeason = async function() {
  const league = await League.findById(this.league);
  if (!league) {
    throw new Error('League not found');
  }
  return getAllF1Data(league.season);
};

// Unified method to check if a driver can be used (for both main and reserve)
usedSelectionSchema.methods.canUseDriver = async function(driver) {
  if (!driver || driver === 'None') return true;
  const { normalizeDriverName } = await this.getF1DataForSeason();
  const normalizedDriver = normalizeDriverName(driver); // always short name
  const currentCycle = this.driverCycles[this.driverCycles.length - 1];
  return !currentCycle.includes(normalizedDriver);
};

// Legacy methods - kept for backward compatibility, now use unified method
usedSelectionSchema.methods.canUseMainDriver = async function(driver) {
  return this.canUseDriver(driver);
};

usedSelectionSchema.methods.canUseReserveDriver = async function(driver) {
  return this.canUseDriver(driver);
};

usedSelectionSchema.methods.canUseTeam = async function(team) {
  if (!team) return true;
  const { normalizeTeamName } = await this.getF1DataForSeason();
  const normalizedTeam = normalizeTeamName(team); // always canonical name
  const currentCycle = this.teamCycles[this.teamCycles.length - 1];
  return !currentCycle.includes(normalizedTeam);
};

// Unified method to add a used driver (for both main and reserve)
usedSelectionSchema.methods.addUsedDriver = async function(driver) {
  if (!driver || driver === 'None') return;
  const { isValidDriver, normalizeDriverName } = await this.getF1DataForSeason();
  if (!isValidDriver(driver)) throw new Error('Invalid driver name');
  const normalizedDriver = normalizeDriverName(driver); // always short name
  let currentCycle = this.driverCycles[this.driverCycles.length - 1];
  if (!currentCycle.includes(normalizedDriver)) {
    currentCycle.push(normalizedDriver);
    // Get the number of drivers for this season to determine cycle length
    const { drivers } = await this.getF1DataForSeason();
    const maxDrivers = drivers.length;
    if (currentCycle.length >= maxDrivers) {
      // Create new empty cycle - the last driver should ONLY be in the completed cycle
      this.driverCycles.push([]); // Start new cycle immediately after max drivers
      // Defensive check: ensure the driver is NOT in the new cycle (should never happen, but safety check)
      const newCycle = this.driverCycles[this.driverCycles.length - 1];
      const driverIndex = newCycle.indexOf(normalizedDriver);
      if (driverIndex > -1) {
        console.error('[addUsedDriver] WARNING: Driver found in new cycle, removing it!');
        newCycle.splice(driverIndex, 1);
      }
    }
  }
};

// Legacy methods - kept for backward compatibility, now use unified method
usedSelectionSchema.methods.addUsedMainDriver = async function(driver) {
  return this.addUsedDriver(driver);
};

usedSelectionSchema.methods.addUsedReserveDriver = async function(driver) {
  return this.addUsedDriver(driver);
};

// Method to add a used team
usedSelectionSchema.methods.addUsedTeam = async function(team) {
    if (!team || team === 'None') return;
  const { isValidTeam, normalizeTeamName } = await this.getF1DataForSeason();
  if (!isValidTeam(team)) throw new Error('Invalid team name');
  const normalizedTeam = normalizeTeamName(team); // always canonical name
  let currentCycle = this.teamCycles[this.teamCycles.length - 1];
  if (!currentCycle.includes(normalizedTeam)) {
    currentCycle.push(normalizedTeam);
    // Get the number of teams for this season to determine cycle length
    const { teams } = await this.getF1DataForSeason();
    const maxTeams = teams.length;
    if (currentCycle.length >= maxTeams) {
      // Create new empty cycle - the last team should ONLY be in the completed cycle
      this.teamCycles.push([]); // Start new cycle immediately after max teams
      // Defensive check: ensure the team is NOT in the new cycle (should never happen, but safety check)
      const newCycle = this.teamCycles[this.teamCycles.length - 1];
      const teamIndex = newCycle.indexOf(normalizedTeam);
      if (teamIndex > -1) {
        console.error('[addUsedTeam] WARNING: Team found in new cycle, removing it!');
        newCycle.splice(teamIndex, 1);
      }
    }
  }
};

// Unified method to remove a used driver (for both main and reserve)
usedSelectionSchema.methods.removeUsedDriver = async function(driver) {
  if (!driver || driver === 'None') return;
  const { isValidDriver, normalizeDriverName } = await this.getF1DataForSeason();
  if (!isValidDriver(driver)) throw new Error('Invalid driver name');
  const normalizedDriver = normalizeDriverName(driver); // always short name
  let currentCycle = this.driverCycles[this.driverCycles.length - 1];
  
  const index = currentCycle.indexOf(normalizedDriver);
  if (index > -1) {
    currentCycle.splice(index, 1); // Remove from array
  }
};

// Legacy methods - kept for backward compatibility, now use unified method
usedSelectionSchema.methods.removeUsedMainDriver = async function(driver) {
  return this.removeUsedDriver(driver);
};

usedSelectionSchema.methods.removeUsedReserveDriver = async function(driver) {
  return this.removeUsedDriver(driver);
};

// Method to remove a used team
usedSelectionSchema.methods.removeUsedTeam = async function(team) {
  if (!team || team === 'None') return;
  const { isValidTeam, normalizeTeamName } = await this.getF1DataForSeason();
  if (!isValidTeam(team)) throw new Error('Invalid team name');
  const normalizedTeam = normalizeTeamName(team); // always canonical name
  let currentCycle = this.teamCycles[this.teamCycles.length - 1];
  
  const index = currentCycle.indexOf(normalizedTeam);
  if (index > -1) {
    currentCycle.splice(index, 1); // Remove from array
  }
};

// Unified method to get available drivers (shared for both main and reserve)
usedSelectionSchema.methods.getAvailableDrivers = async function() {
  const { drivers } = await this.getF1DataForSeason();
  const currentCycle = this.driverCycles[this.driverCycles.length - 1];
  const maxDrivers = drivers.length;
  if (currentCycle.length >= maxDrivers) return [];
  return drivers.map(d => d.shortName).filter(driver => !currentCycle.includes(driver));
};

// Legacy methods - kept for backward compatibility, now use unified method
usedSelectionSchema.methods.getAvailableMainDrivers = async function() {
  return this.getAvailableDrivers();
};

usedSelectionSchema.methods.getAvailableReserveDrivers = async function() {
  return this.getAvailableDrivers();
};

// Method to get available teams
usedSelectionSchema.methods.getAvailableTeams = async function() {
  const { teams } = await this.getF1DataForSeason();
  const currentCycle = this.teamCycles[this.teamCycles.length - 1];
  const maxTeams = teams.length;
  if (currentCycle.length >= maxTeams) return [];
  return teams.map(t => t.name).filter(team => !currentCycle.includes(team));
};

const UsedSelection = mongoose.model('UsedSelection', usedSelectionSchema);

module.exports = UsedSelection; 