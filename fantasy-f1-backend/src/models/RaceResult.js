const mongoose = require('mongoose');
const { F1_DRIVERS_2025 } = require('../constants/f1DriverData');
const { normalizeDriverName } = require('../constants/driverNameNormalization');
const { normalizedTeams } = require('../constants/validTeams');
const RaceCalendar = require('./RaceCalendar');

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
raceResultSchema.pre('save', async function(next) {
  const now = new Date();
  const oldStatus = this.status;

  // Fetch missing timing fields from RaceCalendar
  if (!this.raceStart || !this.qualifyingStart) {
    try {
      const calendar = await RaceCalendar.findOne({ round: this.round });
      if (calendar) {
        if (!this.raceStart) this.raceStart = calendar.raceStart;
        if (!this.qualifyingStart) this.qualifyingStart = calendar.qualifyingStart;
      }
    } catch (err) {
      console.error(`[Race Status] Error fetching RaceCalendar for round ${this.round}:`, err);
    }
  }

  // Add buffer time to prevent premature status changes
  const BUFFER_MINUTES = 5;
  const bufferTime = new Date(now.getTime() + BUFFER_MINUTES * 60 * 1000);
  // Calculate race end time (3 hours after race start)
  const RACE_DURATION_HOURS = 3;
  const raceEndTime = this.raceStart ? new Date(this.raceStart.getTime() + RACE_DURATION_HOURS * 60 * 60 * 1000) : null;

  // Add debug logging
  console.log('[DEBUG] now:', now.toISOString());
  console.log('[DEBUG] bufferTime:', bufferTime?.toISOString());
  console.log('[DEBUG] raceStart:', this.raceStart?.toISOString());
  console.log('[DEBUG] raceEndTime:', raceEndTime?.toISOString());

  // Don't change status if it's already completed
  if (this.status === 'completed') {
    console.log(`[Race Status] Preserving completed status for race ${this.raceName} (round ${this.round})`);
    return next();
  }

  if (raceEndTime && bufferTime > raceEndTime) {
    this.status = 'completed';
  } else if (this.raceStart && bufferTime >= this.raceStart) {
    this.status = 'in_progress';
  } else if (this.sprintStart && bufferTime >= this.sprintStart) {
    this.status = 'sprint';
  } else if (this.sprintQualifyingStart && bufferTime >= this.sprintQualifyingStart) {
    this.status = 'sprint_qualifying';
  } else if (this.qualifyingStart && bufferTime >= this.qualifyingStart) {
    this.status = 'qualifying';
  } else {
    this.status = 'scheduled';
  }

  // Log status changes
  if (oldStatus !== this.status) {
    console.log(`[Race Status] Race ${this.raceName} (round ${this.round}) status changed from ${oldStatus} to ${this.status}`);
    console.log(`[Race Status] Current time: ${now.toISOString()}, Buffer time: ${bufferTime.toISOString()}`);
    console.log(`[Race Status] Qualifying start: ${this.qualifyingStart?.toISOString()}, Race start: ${this.raceStart?.toISOString()}, Race end: ${raceEndTime?.toISOString()}`);
  }

  next();
});

// Add post-save hook to trigger points assignment when race is completed
raceResultSchema.post('save', async function(doc) {
  try {
    console.log(`[RaceResult Post-Save] Hook triggered for race ${doc.raceName} (round ${doc.round}) with status: ${doc.status}`);
    
    // Only proceed if the race is completed
    if (doc.status !== 'completed') {
      console.log(`[RaceResult Post-Save] Race ${doc.raceName} (round ${doc.round}) is not completed, skipping points assignment.`);
      return;
    }

    console.log(`[RaceResult Post-Save] Processing race ${doc.raceName} (round ${doc.round})...`);
    console.log(`[RaceResult Post-Save] Race data:`, {
      isSprintWeekend: doc.isSprintWeekend,
      resultsCount: doc.results?.length || 0,
      sprintResultsCount: doc.sprintResults?.length || 0,
      teamResultsCount: doc.teamResults?.length || 0
    });

    // ENHANCED SAFEGUARD: Check if race results are actually available
    if (!doc.results || doc.results.length === 0) {
      console.error(`[RaceResult Post-Save] ⚠️ Race ${doc.raceName} (round ${doc.round}) marked as completed but has no results! Skipping points assignment.`);
      return;
    }

    if (!doc.teamResults || doc.teamResults.length === 0) {
      console.error(`[RaceResult Post-Save] ⚠️ Race ${doc.raceName} (round ${doc.round}) marked as completed but has no team results! Skipping points assignment.`);
      return;
    }

    // ENHANCED SAFEGUARD: Validate minimum expected results
    const expectedDriverCount = 20; // F1 has 20 drivers
    const expectedTeamCount = 10;   // F1 has 10 teams
    
    if (doc.results.length < expectedDriverCount) {
      console.warn(`[RaceResult Post-Save] ⚠️ Race ${doc.raceName} (round ${doc.round}) has only ${doc.results.length} driver results (expected ${expectedDriverCount}). Results may be incomplete.`);
    }
    
    if (doc.teamResults.length < expectedTeamCount) {
      console.warn(`[RaceResult Post-Save] ⚠️ Race ${doc.raceName} (round ${doc.round}) has only ${doc.teamResults.length} team results (expected ${expectedTeamCount}). Results may be incomplete.`);
    }

    console.log(`[RaceResult Post-Save] ✅ Race data validation passed. Proceeding with points assignment.`);

    // Initialize services
    const scoringService = new (require('../services/ScoringService'))();
    const leaderboardService = new (require('../services/LeaderboardService'))();
    const PointsUpdateLog = require('./PointsUpdateLog');
    const UsedSelection = require('./UsedSelection');

    // Find all leagues with selections for this round
    const leagues = await mongoose.model('League').find({}).distinct('_id');
    const RaceSelection = mongoose.model('RaceSelection');
    
    console.log(`[RaceResult Post-Save] Found ${leagues.length} leagues to process for round ${doc.round}`);

    let totalUpdated = 0;
    for (const leagueId of leagues) {
      const league = await mongoose.model('League').findById(leagueId).populate('members');
      if (!league) {
        console.error(`[RaceResult Post-Save] League not found: ${leagueId}`);
        continue;
      }

      let updatedCount = 0;
      let noSelectionCount = 0;
      
      for (const member of league.members) {
        let selection = await RaceSelection.findOne({
          user: member._id,
          league: leagueId,
          round: doc.round
        });
        
        if (!selection) {
          noSelectionCount++;
          continue;
        }

        // Calculate new points
        const pointsData = scoringService.calculateRacePoints({
          mainDriver: selection.mainDriver,
          reserveDriver: selection.reserveDriver,
          team: selection.team
        }, doc);

        // Validate points against race results
        const mainDriverResult = doc.getDriverResult(selection.mainDriver);
        const reserveDriverResult = doc.getDriverResult(selection.reserveDriver);
        const teamResult = doc.getTeamResult(selection.team);

        // Verify points match what's in race results
        const expectedPoints = {
          mainDriver: mainDriverResult?.points || 0,
          reserveDriver: reserveDriverResult?.points || 0,
          team: teamResult?.totalPoints || 0
        };

        // Log any discrepancies
        if (pointsData.breakdown.mainDriver !== expectedPoints.mainDriver ||
            pointsData.breakdown.reserveDriver !== expectedPoints.reserveDriver ||
            pointsData.breakdown.team !== expectedPoints.team) {
          console.error(`[Validation] Points mismatch for user ${member._id} in race ${doc.round}:`, {
            mainDriver: {
              expected: expectedPoints.mainDriver,
              calculated: pointsData.breakdown.mainDriver
            },
            reserveDriver: {
              expected: expectedPoints.reserveDriver,
              calculated: pointsData.breakdown.reserveDriver
            },
            team: {
              expected: expectedPoints.team,
              calculated: pointsData.breakdown.team
            }
          });
        }

        // Check if points have changed
        const pointsChanged = 
          selection.points !== pointsData.totalPoints || 
          JSON.stringify(selection.pointBreakdown) !== JSON.stringify(pointsData.breakdown);

        // FIXED: Handle both 'empty' and 'user-submitted' statuses for automation
        const shouldUpdate = pointsChanged || 
          !selection.pointBreakdown || 
          selection.status === 'empty' || 
          selection.status === 'user-submitted';

        if (shouldUpdate) {
          // Log the points update
          await PointsUpdateLog.create({
            round: doc.round,
            raceName: doc.raceName,
            userId: member._id,
            leagueId: leagueId,
            points: pointsData.totalPoints,
            pointBreakdown: pointsData.breakdown,
            updateReason: selection.pointBreakdown ? 'scraper_update' : 'initial'
          });

          selection.points = pointsData.totalPoints;
          selection.pointBreakdown = pointsData.breakdown;
          selection.status = 'admin-assigned';
          selection.isAdminAssigned = true;
          selection.assignedAt = new Date();
          await selection.save();
          updatedCount++;

          // Update usage tracking
          let usedSelection = await UsedSelection.findOne({
            user: member._id,
            league: leagueId
          });

          if (!usedSelection) {
            usedSelection = new UsedSelection({
              user: member._id,
              league: leagueId,
              teamCycles: [[]],
              mainDriverCycles: [[]],
              reserveDriverCycles: [[]]
            });
          }

          // Add the selections to the current cycles
          usedSelection.addUsedMainDriver(selection.mainDriver);
          usedSelection.addUsedReserveDriver(selection.reserveDriver);
          usedSelection.addUsedTeam(selection.team);
          await usedSelection.save();
        }
      }

      if (updatedCount > 0) {
        await leaderboardService.updateStandings(leagueId);
        console.log(`[RaceResult Post-Save] League ${league.name}: Updated ${updatedCount} users, ${noSelectionCount} without selections for round ${doc.round}`);
        totalUpdated += updatedCount;
      } else if (noSelectionCount > 0) {
        console.log(`[RaceResult Post-Save] League ${league.name}: No updates needed, ${noSelectionCount} users without selections for round ${doc.round}`);
      }
    }

    if (totalUpdated > 0) {
      console.log(`[RaceResult Post-Save] Total users updated for round ${doc.round}: ${totalUpdated}`);
    } else {
      console.log(`[RaceResult Post-Save] No points changes detected for round ${doc.round}`);
    }
  } catch (error) {
    console.error('[RaceResult Post-Save] Error assigning points:', error);
    console.error('[RaceResult Post-Save] Error details:', {
      raceName: doc.raceName,
      round: doc.round,
      status: doc.status,
      errorMessage: error.message,
      errorStack: error.stack
    });
  }
});

const RaceResult = mongoose.model('RaceResult', raceResultSchema);

module.exports = RaceResult;
