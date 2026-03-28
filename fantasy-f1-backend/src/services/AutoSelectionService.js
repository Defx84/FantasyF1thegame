const RaceSelection = require('../models/RaceSelection');
const RaceCalendar = require('../models/RaceCalendar');
const League = require('../models/League');
const UsedSelection = require('../models/UsedSelection');
const { initializeRaceSelections } = require('../utils/raceUtils');

/**
 * Auto-assignment service for race selections
 * Automatically assigns the next available driver and team if a user hasn't made selections by the deadline
 */
class AutoSelectionService {
  /**
   * Automatically assign selections for all users who haven't made selections by the deadline
   * @param {number} round - The round number of the race
   * @param {string} raceId - The race calendar ID
   * @returns {Object} - Summary of auto-assignments
   */
  async autoAssignSelectionsForRace(round, raceId = null) {
    try {
      console.log(`[AutoSelection] Starting auto-assignment for round ${round}`);
      
      // Get the race from calendar
      let race;
      if (raceId) {
        race = await RaceCalendar.findById(raceId);
      } else {
        race = await RaceCalendar.findOne({ round: parseInt(round) });
      }
      
      if (!race) {
        throw new Error(`Race not found for round ${round}`);
      }

      // Check if lock time has passed (5 minutes before sprint qualifying if present, otherwise qualifying)
      const nowMs = Date.now();
      const deadline = race.sprintQualifyingStart || race.qualifyingStart;
      const lockTimeMs = new Date(deadline).getTime() - 5 * 60 * 1000;
      if (nowMs < lockTimeMs) {
        console.log(`[AutoSelection] Lock time has not passed yet for round ${round}. Lock time: ${new Date(lockTimeMs).toISOString()}`);
        return {
          success: false,
          message: 'Lock time has not passed yet',
          assigned: 0,
          skipped: 0
        };
      }

      console.log(`[AutoSelection] Deadline has passed. Processing auto-assignments for ${race.raceName}`);

      // Get all leagues (for the race's season)
      const leagues = await League.find({ season: race.season }).populate('members', 'username');
      
      let totalAssigned = 0;
      let totalSkipped = 0;
      const results = [];

      for (const league of leagues) {
        console.log(`[AutoSelection] Processing league: ${league.name} (${league.members.length} members)`);
        
        // Initialize selections for this league if they don't exist
        await initializeRaceSelections(league._id, race._id, parseInt(round));

        for (const member of league.members) {
          try {
            // Find existing selection
            let selection = await RaceSelection.findOne({
              user: member._id,
              league: league._id,
              round: parseInt(round)
            });

            // Skip if selection already exists and is not empty
            if (selection && selection.status !== 'empty' && 
                selection.mainDriver && selection.reserveDriver && selection.team) {
              console.log(`[AutoSelection] Skipping ${member.username} - already has valid selection`);
              totalSkipped++;
              continue;
            }

            // Get or create UsedSelection for this user/league
            let usedSelection = await UsedSelection.findOne({
              user: member._id,
              league: league._id
            });

            if (!usedSelection) {
              usedSelection = new UsedSelection({
                user: member._id,
                league: league._id,
                driverCycles: [[]],
                teamCycles: [[]],
                // Legacy fields for migration compatibility
                mainDriverCycles: [[]],
                reserveDriverCycles: [[]]
              });
              await usedSelection.save();
            }

            // Get available options (shared pool for both main and reserve)
            const availableDrivers = await usedSelection.getAvailableDrivers();
            const availableTeams = await usedSelection.getAvailableTeams();

            // Check if we have available options
            if (availableDrivers.length < 2 || availableTeams.length === 0) {
              console.log(`[AutoSelection] ⚠️ No available options for ${member.username}. Drivers: ${availableDrivers.length}, Teams: ${availableTeams.length}`);
              totalSkipped++;
              continue;
            }

            // Select first two different drivers from the shared pool
            let mainDriver = availableDrivers[0];
            let reserveDriver = availableDrivers[1]; // Always different since they're from same list

            const team = availableTeams[0];

            // Create or update selection
            if (!selection) {
              selection = new RaceSelection({
                user: member._id,
                league: league._id,
                race: race._id,
                round: parseInt(round),
                mainDriver: mainDriver,
                reserveDriver: reserveDriver,
                team: team,
                status: 'auto-assigned',
                isAdminAssigned: false,
                isAutoAssigned: true,
                assignedAt: new Date(),
                notes: 'Automatically assigned due to missed deadline',
                createdAt: new Date(),
                updatedAt: new Date()
              });
            } else {
              // Update existing empty selection
              selection.mainDriver = mainDriver;
              selection.reserveDriver = reserveDriver;
              selection.team = team;
              selection.status = 'auto-assigned';
              selection.isAdminAssigned = false;
              selection.isAutoAssigned = true;
              selection.notes = 'Automatically assigned due to missed deadline';
              selection.assignedAt = new Date();
              selection.updatedAt = new Date();
            }

            await selection.save();

            // Update UsedSelection cycles (unified driver cycle)
            await usedSelection.addUsedDriver(mainDriver);
            await usedSelection.addUsedDriver(reserveDriver);
            await usedSelection.addUsedTeam(team);
            await usedSelection.save();

            console.log(`[AutoSelection] ✅ Assigned for ${member.username}: Main=${mainDriver}, Reserve=${reserveDriver}, Team=${team}`);
            
            results.push({
              userId: member._id,
              username: member.username,
              leagueId: league._id,
              leagueName: league.name,
              mainDriver,
              reserveDriver,
              team
            });

            totalAssigned++;

          } catch (error) {
            console.error(`[AutoSelection] Error processing ${member.username}:`, error);
            totalSkipped++;
          }
        }
      }

      console.log(`[AutoSelection] ✅ Completed auto-assignment for round ${round}. Assigned: ${totalAssigned}, Skipped: ${totalSkipped}`);

      return {
        success: true,
        message: `Auto-assigned selections for ${totalAssigned} users`,
        assigned: totalAssigned,
        skipped: totalSkipped,
        results
      };

    } catch (error) {
      console.error('[AutoSelection] Error in autoAssignSelectionsForRace:', error);
      throw error;
    }
  }

  /**
   * Auto-assign selections for the next upcoming race
   * @returns {Object} - Summary of auto-assignments
   */
  async autoAssignSelectionsForNextRace(targetSeason = null) {
    try {
      const now = new Date();
      const graceEnd = new Date(now.getTime() + 5 * 60 * 1000);

      // Find the most recent race whose selection lock has passed (same anchor as autoAssignSelectionsForRace:
      // sprintQualifyingStart if present, else qualifyingStart; lock = that time minus 5 minutes).
      //
      // IMPORTANT: Do not sort by sprintQualifyingStart alone — non-sprint races have null there and sort
      // after sprint weekends, so findOne keeps returning an old sprint round (e.g. China) instead of Japan.
      const seasonFilter = targetSeason ? { season: targetSeason } : { season: { $gte: new Date().getFullYear() - 1 } };

      const candidates = await RaceCalendar.find({
        $or: [
          { sprintQualifyingStart: { $lte: graceEnd } },
          { qualifyingStart: { $lte: graceEnd } }
        ],
        ...seasonFilter
      })
        .sort({ qualifyingStart: -1, round: -1 })
        .lean();

      const nextRace =
        candidates.find((r) => {
          const anchor = r.sprintQualifyingStart || r.qualifyingStart;
          if (!anchor) return false;
          const lockMs = new Date(anchor).getTime() - 5 * 60 * 1000;
          return Date.now() >= lockMs;
        }) || null;

      if (!nextRace) {
        return {
          success: false,
          message: 'No race found with passed deadline',
          assigned: 0,
          skipped: 0
        };
      }

      // Run auto-assign for this round; autoAssignSelectionsForRace skips users who already have valid selections
      return await this.autoAssignSelectionsForRace(nextRace.round, nextRace._id);

    } catch (error) {
      console.error('[AutoSelection] Error in autoAssignSelectionsForNextRace:', error);
      throw error;
    }
  }
}

module.exports = AutoSelectionService;

