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
  round: {
    type: Number,
    required: true
  },
  mainDriver: {
    type: String,
    required: true
  },
  reserveDriver: {
    type: String,
    required: true
  },
  team: {
    type: String,
    required: true
  },
  lastMainDriverReset: Date,
  lastReserveDriverReset: Date,
  lastTeamReset: Date
}, { timestamps: true });

// Create a compound index to ensure one selection per user/league/round
usedSelectionSchema.index({ user: 1, league: 1, round: 1 }, { unique: true });

// Helper methods to check if a driver/team can be used
usedSelectionSchema.methods.canUseMainDriver = function(driver) {
  // Check if the driver has been used in any previous round
  return UsedSelection.find({
    user: this.user,
    league: this.league,
    round: { $lt: this.round },
    mainDriver: driver
  }).then(selections => selections.length === 0);
};

usedSelectionSchema.methods.canUseReserveDriver = function(driver) {
  // Check if the driver has been used in any previous round
  return UsedSelection.find({
    user: this.user,
    league: this.league,
    round: { $lt: this.round },
    reserveDriver: driver
  }).then(selections => selections.length === 0);
};

usedSelectionSchema.methods.canUseTeam = function(team) {
  // Check if the team has been used in any previous round
  return UsedSelection.find({
    user: this.user,
    league: this.league,
    round: { $lt: this.round },
    team: team
  }).then(selections => selections.length === 0);
};

// Method to add a used main driver
usedSelectionSchema.methods.addUsedMainDriver = function(driver) {
  try {
    if (!driver || driver === 'None') return;
    if (!isValidDriver(driver)) {
      throw new Error('Invalid driver name');
    }
    const normalizedDriver = normalizeDriverName(driver);
    if (!this.usedMainDrivers.includes(normalizedDriver)) {
      this.usedMainDrivers.push(normalizedDriver);
    }
  } catch (err) {
    console.error('Error in addUsedMainDriver:', err);
    throw err;
  }
};

// Method to add a used reserve driver
usedSelectionSchema.methods.addUsedReserveDriver = function(driver) {
  try {
    if (!driver || driver === 'None') return;
    if (!isValidDriver(driver)) {
      throw new Error('Invalid driver name');
    }
    const normalizedDriver = normalizeDriverName(driver);
    if (!this.usedReserveDrivers.includes(normalizedDriver)) {
      this.usedReserveDrivers.push(normalizedDriver);
    }
  } catch (err) {
    console.error('Error in addUsedReserveDriver:', err);
    throw err;
  }
};

// Method to add a used team
usedSelectionSchema.methods.addUsedTeam = function(team) {
  try {
    if (!team || team === 'None') return;
    if (!isValidTeam(team)) {
      throw new Error('Invalid team name');
    }
    const normalizedTeam = normalizeTeamName(team);
    if (!this.usedTeams.includes(normalizedTeam)) {
      this.usedTeams.push(normalizedTeam);
    }
  } catch (err) {
    console.error('Error in addUsedTeam:', err);
    throw err;
  }
};

// Method to get available drivers for main driver selection
usedSelectionSchema.methods.getAvailableMainDrivers = function() {
  if (this.usedMainDrivers.length >= 20) {
    return F1_DRIVERS_2025;
  }
  return F1_DRIVERS_2025.filter(driver => 
    !this.usedMainDrivers.includes(normalizeDriverName(driver))
  );
};

// Method to get available drivers for reserve driver selection
usedSelectionSchema.methods.getAvailableReserveDrivers = function() {
  if (this.usedReserveDrivers.length >= 20) {
    return F1_DRIVERS_2025;
  }
  return F1_DRIVERS_2025.filter(driver => 
    !this.usedReserveDrivers.includes(normalizeDriverName(driver))
  );
};

// Method to get available teams
usedSelectionSchema.methods.getAvailableTeams = function() {
  if (this.usedTeams.length >= 10) {
    return F1_TEAMS_2025;
  }
  return F1_TEAMS_2025.filter(team => 
    !this.usedTeams.includes(normalizeTeamName(team))
  );
};

const UsedSelection = mongoose.model('UsedSelection', usedSelectionSchema);

module.exports = UsedSelection; 