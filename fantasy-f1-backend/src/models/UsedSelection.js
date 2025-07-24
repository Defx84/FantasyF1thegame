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
  console.log('[addUsedMainDriver] value received:', driver);
    if (!driver || driver === 'None') return;
  if (!isValidDriver(driver)) throw new Error('Invalid driver name');
  const normalizedDriver = normalizeDriverName(driver); // always short name
  let currentCycle = this.mainDriverCycles[this.mainDriverCycles.length - 1];
  console.log('[addUsedMainDriver] normalized to:', normalizedDriver);
  console.log('[addUsedMainDriver] current cycle before:', currentCycle);
  if (!currentCycle.includes(normalizedDriver)) {
    currentCycle.push(normalizedDriver);
    console.log('[addUsedMainDriver] added to cycle. cycle after:', currentCycle);
    if (currentCycle.length === 20) {
      this.mainDriverCycles.push([]); // Start new cycle immediately after 20th
      console.log('[addUsedMainDriver] 20 drivers used, new cycle started');
      currentCycle = this.mainDriverCycles[this.mainDriverCycles.length - 1];
    }
  } else {
    console.log('[addUsedMainDriver] already in cycle, not adding');
  }
};

// Method to add a used reserve driver
usedSelectionSchema.methods.addUsedReserveDriver = function(driver) {
  console.log('[addUsedReserveDriver] value received:', driver);
    if (!driver || driver === 'None') return;
  if (!isValidDriver(driver)) throw new Error('Invalid driver name');
  const normalizedDriver = normalizeDriverName(driver); // always short name
  let currentCycle = this.reserveDriverCycles[this.reserveDriverCycles.length - 1];
  if (!currentCycle.includes(normalizedDriver)) {
    currentCycle.push(normalizedDriver);
    if (currentCycle.length === 20) {
      this.reserveDriverCycles.push([]); // Start new cycle immediately after 20th
      currentCycle = this.reserveDriverCycles[this.reserveDriverCycles.length - 1];
    }
  }
};

// Method to add a used team
usedSelectionSchema.methods.addUsedTeam = function(team) {
  console.log('[addUsedTeam] value received:', team);
    if (!team || team === 'None') return;
  if (!isValidTeam(team)) throw new Error('Invalid team name');
  const normalizedTeam = normalizeTeamName(team); // always canonical name
  let currentCycle = this.teamCycles[this.teamCycles.length - 1];
  if (!currentCycle.includes(normalizedTeam)) {
    currentCycle.push(normalizedTeam);
    if (currentCycle.length === 10) {
      this.teamCycles.push([]); // Start new cycle immediately after 10th
      currentCycle = this.teamCycles[this.teamCycles.length - 1];
    }
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