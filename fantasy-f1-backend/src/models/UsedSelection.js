const mongoose = require('mongoose');
const { 
    F1_DRIVERS_2025,
    F1_TEAMS_2025,
    isValidDriver,
    isValidTeam,
    normalizeDriverName,
    normalizeTeamName
} = require('../constants/f1Data2025');

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
  mainDriverCycles: {
    type: [[String]], // Array of arrays of main driver short names
    default: [[]]
  },
  reserveDriverCycles: {
    type: [[String]], // Array of arrays of reserve driver short names
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
  if (!this.mainDriverCycles || this.mainDriverCycles.length === 0) {
    this.mainDriverCycles = [[]];
  }
  if (!this.reserveDriverCycles || this.reserveDriverCycles.length === 0) {
    this.reserveDriverCycles = [[]];
  }
  next();
});

// Helper methods to check if a driver/team can be used
usedSelectionSchema.methods.canUseMainDriver = function(driver) {
  if (!driver) return true;
  const normalizedDriver = normalizeDriverName(driver); // always short name
  const currentCycle = this.mainDriverCycles[this.mainDriverCycles.length - 1];
  return !currentCycle.includes(normalizedDriver);
};

usedSelectionSchema.methods.canUseReserveDriver = function(driver) {
  if (!driver) return true;
  const normalizedDriver = normalizeDriverName(driver); // always short name
  const currentCycle = this.reserveDriverCycles[this.reserveDriverCycles.length - 1];
  return !currentCycle.includes(normalizedDriver);
};

usedSelectionSchema.methods.canUseTeam = function(team) {
  if (!team) return true;
  const normalizedTeam = normalizeTeamName(team); // always canonical name
  const currentCycle = this.teamCycles[this.teamCycles.length - 1];
  return !currentCycle.includes(normalizedTeam);
};

// Method to add a used main driver
usedSelectionSchema.methods.addUsedMainDriver = function(driver) {
    if (!driver || driver === 'None') return;
  if (!isValidDriver(driver)) throw new Error('Invalid driver name');
  const normalizedDriver = normalizeDriverName(driver); // always short name
  let currentCycle = this.mainDriverCycles[this.mainDriverCycles.length - 1];
  if (!currentCycle.includes(normalizedDriver)) {
    currentCycle.push(normalizedDriver);
    if (currentCycle.length === 20) {
      // Create new empty cycle - the 20th driver should ONLY be in the completed cycle
      this.mainDriverCycles.push([]); // Start new cycle immediately after 20th
      // Defensive check: ensure the driver is NOT in the new cycle (should never happen, but safety check)
      const newCycle = this.mainDriverCycles[this.mainDriverCycles.length - 1];
      const driverIndex = newCycle.indexOf(normalizedDriver);
      if (driverIndex > -1) {
        console.error('[addUsedMainDriver] WARNING: Driver found in new cycle, removing it!');
        newCycle.splice(driverIndex, 1);
      }
    }
  }
};

// Method to add a used reserve driver
usedSelectionSchema.methods.addUsedReserveDriver = function(driver) {
    if (!driver || driver === 'None') return;
  if (!isValidDriver(driver)) throw new Error('Invalid driver name');
  const normalizedDriver = normalizeDriverName(driver); // always short name
  let currentCycle = this.reserveDriverCycles[this.reserveDriverCycles.length - 1];
  if (!currentCycle.includes(normalizedDriver)) {
    currentCycle.push(normalizedDriver);
    if (currentCycle.length === 20) {
      // Create new empty cycle - the 20th driver should ONLY be in the completed cycle
      this.reserveDriverCycles.push([]); // Start new cycle immediately after 20th
      // Defensive check: ensure the driver is NOT in the new cycle (should never happen, but safety check)
      const newCycle = this.reserveDriverCycles[this.reserveDriverCycles.length - 1];
      const driverIndex = newCycle.indexOf(normalizedDriver);
      if (driverIndex > -1) {
        console.error('[addUsedReserveDriver] WARNING: Driver found in new cycle, removing it!');
        newCycle.splice(driverIndex, 1);
      }
    }
  }
};

// Method to add a used team
usedSelectionSchema.methods.addUsedTeam = function(team) {
    if (!team || team === 'None') return;
  if (!isValidTeam(team)) throw new Error('Invalid team name');
  const normalizedTeam = normalizeTeamName(team); // always canonical name
  let currentCycle = this.teamCycles[this.teamCycles.length - 1];
  if (!currentCycle.includes(normalizedTeam)) {
    currentCycle.push(normalizedTeam);
    if (currentCycle.length === 10) {
      // Create new empty cycle - the 10th team should ONLY be in the completed cycle
      this.teamCycles.push([]); // Start new cycle immediately after 10th
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

// Method to remove a used main driver
usedSelectionSchema.methods.removeUsedMainDriver = function(driver) {
  if (!driver || driver === 'None') return;
  if (!isValidDriver(driver)) throw new Error('Invalid driver name');
  const normalizedDriver = normalizeDriverName(driver); // always short name
  let currentCycle = this.mainDriverCycles[this.mainDriverCycles.length - 1];
  
  const index = currentCycle.indexOf(normalizedDriver);
  if (index > -1) {
    currentCycle.splice(index, 1); // Remove from array
  }
};

// Method to remove a used reserve driver
usedSelectionSchema.methods.removeUsedReserveDriver = function(driver) {
  if (!driver || driver === 'None') return;
  if (!isValidDriver(driver)) throw new Error('Invalid driver name');
  const normalizedDriver = normalizeDriverName(driver); // always short name
  let currentCycle = this.reserveDriverCycles[this.reserveDriverCycles.length - 1];
  
  const index = currentCycle.indexOf(normalizedDriver);
  if (index > -1) {
    currentCycle.splice(index, 1); // Remove from array
  }
};

// Method to remove a used team
usedSelectionSchema.methods.removeUsedTeam = function(team) {
  if (!team || team === 'None') return;
  if (!isValidTeam(team)) throw new Error('Invalid team name');
  const normalizedTeam = normalizeTeamName(team); // always canonical name
  let currentCycle = this.teamCycles[this.teamCycles.length - 1];
  
  const index = currentCycle.indexOf(normalizedTeam);
  if (index > -1) {
    currentCycle.splice(index, 1); // Remove from array
  }
};

// Method to get available drivers for main driver selection
usedSelectionSchema.methods.getAvailableMainDrivers = function() {
  const currentCycle = this.mainDriverCycles[this.mainDriverCycles.length - 1];
  if (currentCycle.length >= 20) return [];
  return F1_DRIVERS_2025.map(d => d.shortName).filter(driver => !currentCycle.includes(driver));
};

// Method to get available drivers for reserve driver selection
usedSelectionSchema.methods.getAvailableReserveDrivers = function() {
  const currentCycle = this.reserveDriverCycles[this.reserveDriverCycles.length - 1];
  if (currentCycle.length >= 20) return [];
  return F1_DRIVERS_2025.map(d => d.shortName).filter(driver => !currentCycle.includes(driver));
};

// Method to get available teams
usedSelectionSchema.methods.getAvailableTeams = function() {
  const currentCycle = this.teamCycles[this.teamCycles.length - 1];
  if (currentCycle.length >= 10) return [];
  return F1_TEAMS_2025.map(t => t.name).filter(team => !currentCycle.includes(team));
};

const UsedSelection = mongoose.model('UsedSelection', usedSelectionSchema);

module.exports = UsedSelection; 