const mongoose = require('mongoose');
const { F1_DRIVERS_2025 } = require('../constants/f1DriverData');
const { normalizeDriverName } = require('../constants/driverNameNormalization');
const { normalizedTeams } = require('../constants/validTeams');

// Create a set of all valid driver names
const normalizedDrivers = new Set();
F1_DRIVERS_2025.forEach(driver => {
    normalizedDrivers.add(driver.name.toLowerCase());
    normalizedDrivers.add(driver.shortName.toLowerCase());
    driver.alternateNames.forEach(name => {
        normalizedDrivers.add(name.toLowerCase());
    });
});

const raceResultSchema = new mongoose.Schema({
  round: {
    type: Number,
    required: true
  },
  raceName: {
    type: String,
    required: true
  },
  circuit: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  // Timing fields
  raceStart: {
    type: Date,
    required: true
  },
  raceEnd: {
    type: Date
  },
  qualifyingStart: {
    type: Date
  },
  qualifyingEnd: {
    type: Date
  },
  sprintQualifyingStart: {
    type: Date
  },
  sprintQualifyingEnd: {
    type: Date
  },
  sprintStart: {
    type: Date
  },
  sprintEnd: {
    type: Date
  },
  status: {
    type: String,
    enum: ['scheduled', 'qualifying', 'sprint_qualifying', 'sprint', 'in_progress', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  isSprintWeekend: {
    type: Boolean,
    default: false
  },
  season: {
    type: Number,
    required: true
  },
  // Results fields
  results: [{
    driver: {
      type: String,
      required: true
    },
    team: {
      type: String,
      required: true
    },
    carNumber: {
      type: String
    },
    position: {
      type: Number,
      required: false,
      default: null
    },
    points: {
      type: Number,
      default: 0
    },
    laps: {
      type: String
    },
    time: {
      type: String
    },
    didNotFinish: {
      type: Boolean,
      default: false
    },
    didNotStart: {
      type: Boolean,
      default: false
    },
    disqualified: {
      type: Boolean,
      default: false
    }
  }],
  sprintResults: [{
    driver: {
      type: String,
      required: true
    },
    team: {
      type: String,
      required: true
    },
    carNumber: {
      type: String
    },
    position: {
      type: mongoose.Schema.Types.Mixed,
      required: false,
      get: function(v) {
        if (v === null || v === undefined) return null;
        if (typeof v === 'number') return v;
        return v.toLowerCase();
      },
      set: function(v) {
        if (v === null || v === undefined) return null;
        if (typeof v === 'number') return v;
        const pos = v.toLowerCase();
        if (['dnf', 'dns', 'dsq', 'dq'].includes(pos)) return pos;
        const num = parseInt(v);
        return isNaN(num) ? v : num;
      }
    },
    points: {
      type: Number,
      default: 0
    },
    laps: {
      type: String
    },
    time: {
      type: String
    },
    didNotFinish: {
      type: Boolean,
      default: false
    },
    didNotStart: {
      type: Boolean,
      default: false
    },
    disqualified: {
      type: Boolean,
      default: false
    }
  }],
  teamResults: [{
    team: {
      type: String,
      required: true
    },
    position: {
      type: Number,
      required: true
    },
    racePoints: {
      type: Number,
      default: 0
    },
    sprintPoints: {
      type: Number,
      default: 0
    },
    totalPoints: {
      type: Number,
      required: true
    }
  }]
}, {
  timestamps: true
});

// Indexes for faster queries
raceResultSchema.index({ round: 1 });
raceResultSchema.index({ date: 1 });
raceResultSchema.index({ status: 1 });
raceResultSchema.index({ season: 1, round: 1 }, { unique: true });

// Virtual property to check if race is locked (no more selections/switcheroos allowed)
raceResultSchema.virtual('isLocked').get(function() {
  const now = new Date();
  return now >= this.qualifyingStart;
});

// Method to check if switcheroo is allowed
raceResultSchema.methods.isSwitcherooAllowed = function() {
  const now = new Date();
  if (this.isSprintWeekend) {
    // Sprint weekend: between sprint qualifying end (or start+1h) and 5 minutes before sprint race
    let sprintQualifyingEnd = this.sprintQualifyingEnd;
    if (!sprintQualifyingEnd && this.sprintQualifyingStart) {
      sprintQualifyingEnd = new Date(this.sprintQualifyingStart.getTime() + 60 * 60 * 1000); // +1 hour
    }
    if (!sprintQualifyingEnd || !this.sprintStart) {
      return false;
    }
    const switcherooEnd = new Date(this.sprintStart);
    switcherooEnd.setMinutes(switcherooEnd.getMinutes() - 5);
    return now >= sprintQualifyingEnd && now <= switcherooEnd;
  } else {
    // Regular weekend: between qualifying end (or start+1h) and 5 minutes before race
    let qualifyingEnd = this.qualifyingEnd;
    if (!qualifyingEnd && this.qualifyingStart) {
      qualifyingEnd = new Date(this.qualifyingStart.getTime() + 60 * 60 * 1000); // +1 hour
    }
    if (!qualifyingEnd || !this.raceStart) {
      return false;
    }
    const switcherooEnd = new Date(this.raceStart);
    switcherooEnd.setMinutes(switcherooEnd.getMinutes() - 5);
    return now >= qualifyingEnd && now <= switcherooEnd;
  }
};

// Method to get driver result by name
raceResultSchema.methods.getDriverResult = function(driverName, type = 'race') {
  const normalizedName = normalizedDrivers[driverName.toLowerCase()] || driverName.toLowerCase();
  const results = type === 'sprint' ? this.sprintResults : this.results;
  return results.find(result => {
    const resultDriverName = result.driver?.toLowerCase();
    return resultDriverName === normalizedName;
  });
};

// Method to check if driver finished the race by name
raceResultSchema.methods.didDriverFinish = function(driverName, type = 'race') {
  const result = this.getDriverResult(driverName, type);
  if (!result) return false;
  return !result.didNotFinish && !result.didNotStart && !result.disqualified;
};

// Method to get driver points by name
raceResultSchema.methods.getDriverPoints = function(driverName, isSprint = false) {
  const result = this.getDriverResult(driverName, isSprint ? 'sprint' : 'race');
  if (!result) return 0;
  return result.points;
};

// Method to get team result
raceResultSchema.methods.getTeamResult = function(teamName) {
  const normalizedName = normalizedTeams[teamName.toLowerCase()] || teamName.toLowerCase();
  return this.teamResults.find(result => {
    const resultTeamName = result.team?.toLowerCase();
    return resultTeamName === normalizedName;
  });
};

// Method to get team points
raceResultSchema.methods.getTeamPoints = function(teamName) {
  const result = this.getTeamResult(teamName);
  if (!result) return 0;
  return result.totalPoints;
};

// Update status based on timing
raceResultSchema.pre('save', function(next) {
  const now = new Date();

  if (this.raceStart && now >= this.raceStart) {
    this.status = 'in_progress';
  } else if (this.sprintStart && now >= this.sprintStart) {
    this.status = 'sprint';
  } else if (this.sprintQualifyingStart && now >= this.sprintQualifyingEnd) {
    this.status = 'sprint_qualifying';
  } else if (this.qualifyingStart && now >= this.qualifyingEnd) {
    this.status = 'qualifying';
  } else {
    this.status = 'scheduled';
  }

  next();
});

const RaceResult = mongoose.model('RaceResult', raceResultSchema);

module.exports = RaceResult;
