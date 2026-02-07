const mongoose = require('mongoose');
const { normalizeDriverName } = require('../constants/driverNameNormalization');
const { getF1Validation } = require('../constants/f1DataLoader');
const RaceCalendar = require('./RaceCalendar');
const RaceCardSelection = require('./RaceCardSelection');

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
  }],
  manuallyEntered: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for faster queries
raceResultSchema.index({ round: 1 });
raceResultSchema.index({ date: 1 });
raceResultSchema.index({ status: 1 });
raceResultSchema.index({ season: 1, round: 1 }, { unique: true });

// Virtual property to check if race is locked (no more selections allowed)
raceResultSchema.virtual('isLocked').get(function() {
  const now = new Date();
  return now >= this.qualifyingStart;
});

// Method to get driver result by name
raceResultSchema.methods.getDriverResult = function(driverName, type = 'race') {
  const season = this.season || new Date().getFullYear();
  const { normalizeDriverName: normalizeDriver } = getF1Validation(season);
  const normalizedName = normalizeDriver(driverName).toLowerCase();
  const results = type === 'sprint' ? this.sprintResults : this.results;
  return results.find(result => {
    const resultDriverName = normalizeDriver(result.driver).toLowerCase();
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
  const season = this.season || new Date().getFullYear();
  const { normalizeTeamName } = getF1Validation(season);
  const normalizedName = normalizeTeamName(teamName).toLowerCase();
  return this.teamResults.find(result => {
    const resultTeamName = normalizeTeamName(result.team).toLowerCase();
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

    const RaceSelection = mongoose.model('RaceSelection');
    const RaceCalendar = mongoose.model('RaceCalendar');
    const calendarRace = await RaceCalendar.findOne({
      season: doc.season,
      round: doc.round
    }).select('_id');

    if (!calendarRace) {
      console.error(`[RaceResult Post-Save] RaceCalendar not found for season ${doc.season}, round ${doc.round}. Skipping points assignment.`);
      return;
    }

    // Find all leagues for this season
    const leagues = await mongoose.model('League')
      .find({ season: doc.season })
      .populate('members');
    
    console.log(`[RaceResult Post-Save] Found ${leagues.length} leagues to process for season ${doc.season}, round ${doc.round}`);

    let totalUpdated = 0;
    for (const league of leagues) {
      if (!league) {
        console.error('[RaceResult Post-Save] League not found in season query');
        continue;
      }

      let updatedCount = 0;
      let noSelectionCount = 0;
      
      for (const member of league.members) {
        // Find by (league, user, round) so we get the selection regardless of calendar _id.
        // If calendar was ever recreated, selections can point to old race _id; we heal below.
        const roundSelections = await RaceSelection.find({
          user: member._id,
          league: league._id,
          round: doc.round
        });
        // Prefer the one that has picks (mainDriver, reserveDriver, team)
        let selection = roundSelections.find(s => s.mainDriver && s.reserveDriver && s.team) || roundSelections[0];

        if (!selection) {
          noSelectionCount++;
          continue;
        }

        // Skip empty selections (no drivers or team selected)
        if (!selection.mainDriver || !selection.reserveDriver || !selection.team) {
          noSelectionCount++;
          continue;
        }

        // Heal race ref: if this selection points to a different calendar entry (e.g. calendar was recreated),
        // point it to the current one so points and leaderboard stay correct.
        if (selection.race && selection.race.toString() !== calendarRace._id.toString()) {
          const selectionDoc = await RaceSelection.findById(selection._id);
          if (selectionDoc) {
            // Remove any other selection for (user, league, round) that already has race = calendarRace._id
            // to avoid unique index (user, league, race) violation when we update.
            await RaceSelection.deleteMany({
              league: league._id,
              user: member._id,
              round: doc.round,
              race: calendarRace._id,
              _id: { $ne: selection._id }
            });
            selectionDoc.race = calendarRace._id;
            await selectionDoc.save();
            selection = selectionDoc;
          }
        }

        // Get race card selection if season is 2026+
        let raceCardSelection = null;
        if (doc.season >= 2026) {
          raceCardSelection = await RaceCardSelection.findOne({
            user: member._id,
            league: league._id,
            race: calendarRace._id
          }).populate('driverCard teamCard');
        }

        // Calculate new points (with card effects if applicable)
        const pointsData = await scoringService.calculateRacePoints({
          mainDriver: selection.mainDriver,
          reserveDriver: selection.reserveDriver,
          team: selection.team
        }, doc, raceCardSelection, {
          userId: member._id,
          leagueId: league._id
        });

        // Validate points against race results
        const mainDriverResult = doc.getDriverResult(selection.mainDriver);
        const reserveDriverResult = doc.getDriverResult(selection.reserveDriver);
        const teamResult = doc.getTeamResult(selection.team);

        // Verify base points match what's in race results (before card effects)
        // Note: Final points may differ due to card effects
        const expectedBasePoints = {
          mainDriver: mainDriverResult?.points || 0,
          reserveDriver: reserveDriverResult?.points || 0,
          team: teamResult?.totalPoints || 0
        };

        // Check base points (before card effects) if available
        const basePoints = pointsData.breakdown.basePoints;
        if (basePoints) {
          if (basePoints.mainDriverPoints !== expectedBasePoints.mainDriver ||
              basePoints.reserveDriverPoints !== expectedBasePoints.reserveDriver ||
              basePoints.teamPoints !== expectedBasePoints.team) {
            console.error(`[Validation] Base points mismatch for user ${member._id} in race ${doc.round}:`, {
              mainDriver: {
                expected: expectedBasePoints.mainDriver,
                calculated: basePoints.mainDriverPoints
              },
              reserveDriver: {
                expected: expectedBasePoints.reserveDriver,
                calculated: basePoints.reserveDriverPoints
              },
              team: {
                expected: expectedBasePoints.team,
                calculated: basePoints.teamPoints
              }
            });
          }
        } else {
          // Fallback for 2025 seasons (no card effects)
          if (pointsData.breakdown.mainDriverPoints !== expectedBasePoints.mainDriver ||
              pointsData.breakdown.reserveDriverPoints !== expectedBasePoints.reserveDriver ||
              pointsData.breakdown.teamPoints !== expectedBasePoints.team) {
            console.error(`[Validation] Points mismatch for user ${member._id} in race ${doc.round}:`, {
              mainDriver: {
                expected: expectedBasePoints.mainDriver,
                calculated: pointsData.breakdown.mainDriverPoints
              },
              reserveDriver: {
                expected: expectedBasePoints.reserveDriver,
                calculated: pointsData.breakdown.reserveDriverPoints
              },
              team: {
                expected: expectedBasePoints.team,
                calculated: pointsData.breakdown.teamPoints
              }
            });
          }
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
            leagueId: league._id,
            points: pointsData.totalPoints,
            pointBreakdown: pointsData.breakdown,
            updateReason: selection.pointBreakdown ? 'scraper_update' : 'initial'
          });

          selection.points = pointsData.totalPoints;
          const breakdown = pointsData.breakdown;
          const bp = breakdown.basePoints;
          const driverCardPoints = bp ? Math.max(0, (breakdown.mainDriverPoints + breakdown.reserveDriverPoints) - (bp.mainDriverPoints + bp.reserveDriverPoints)) : 0;
          const teamCardPoints = bp ? Math.max(0, (breakdown.teamPoints || 0) - (bp.teamPoints || 0)) : 0;
          selection.pointBreakdown = { ...breakdown, driverCardPoints, teamCardPoints };
          // Do not change status when only assigning points; leave as user-submitted / auto-assigned / etc.
          selection.isAutoAssigned = false; // Points from manual results/scraper = not "Auto" on Grid
          selection.assignedAt = new Date();
          await selection.save();
          updatedCount++;

          // Update usage tracking
          let usedSelection = await UsedSelection.findOne({
            user: member._id,
            league: league._id
          });

          if (!usedSelection) {
            usedSelection = new UsedSelection({
              user: member._id,
              league: league._id,
              teamCycles: [[]],
              mainDriverCycles: [[]],
              reserveDriverCycles: [[]]
            });
          }

          // Add the selections to the current cycles
          await usedSelection.addUsedMainDriver(selection.mainDriver);
          await usedSelection.addUsedReserveDriver(selection.reserveDriver);
          await usedSelection.addUsedTeam(selection.team);
          await usedSelection.save();
        }
      }

      // Always rebuild leaderboard for this season so standings reflect current RaceResult + RaceSelection
      // (even when no selection was updated, e.g. re-save or calendar _id mismatch)
      await leaderboardService.updateStandings(league._id);
      if (updatedCount > 0) {
        console.log(`[RaceResult Post-Save] League ${league.name}: Updated ${updatedCount} users, ${noSelectionCount} without selections for round ${doc.round}`);
        totalUpdated += updatedCount;
      } else if (noSelectionCount > 0) {
        console.log(`[RaceResult Post-Save] League ${league.name}: No selection updates, ${noSelectionCount} users without selections for round ${doc.round}; leaderboard refreshed.`);
      } else {
        console.log(`[RaceResult Post-Save] League ${league.name}: Leaderboard refreshed for round ${doc.round}.`);
      }
    }

    if (totalUpdated > 0) {
      console.log(`[RaceResult Post-Save] Total users updated for round ${doc.round}: ${totalUpdated}`);
    } else {
      console.log(`[RaceResult Post-Save] No points changes detected for round ${doc.round}`);
    }

    // Note: Season completion and PDF generation is now handled by a scheduled job
    // that runs every Monday at 8am UK time (see server.js)

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
