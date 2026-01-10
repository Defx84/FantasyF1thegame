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

      // Check if deadline has passed (qualifying start time)
      const now = new Date();
      if (now < race.qualifyingStart) {
        console.log(`[AutoSelection] Deadline has not passed yet for round ${round}. Deadline: ${race.qualifyingStart}`);
        return {
          success: false,
          message: 'Deadline has not passed yet',
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
                status: 'admin-assigned',
                isAdminAssigned: true,
                notes: 'Automatically assigned due to missed deadline',
                createdAt: new Date(),
                updatedAt: new Date()
              });
            } else {
              // Update existing empty selection
              selection.mainDriver = mainDriver;
              selection.reserveDriver = reserveDriver;
              selection.team = team;
              selection.status = 'admin-assigned';
              selection.isAdminAssigned = true;
              selection.notes = 'Automatically assigned due to missed deadline';
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
  async autoAssignSelectionsForNextRace() {
    try {
      const now = new Date();
      
      // Find the next race whose deadline has passed
      const nextRace = await RaceCalendar.findOne({
        qualifyingStart: { $lte: now },
        season: { $gte: new Date().getFullYear() - 1 }
      }).sort({ qualifyingStart: -1 });

      if (!nextRace) {
        return {
          success: false,
          message: 'No race found with passed deadline',
          assigned: 0,
          skipped: 0
        };
      }

      // Check if we've already processed this race
      const existingSelections = await RaceSelection.find({
        round: nextRace.round,
        status: 'admin-assigned',
        isAdminAssigned: true
      });

      if (existingSelections.length > 0) {
        console.log(`[AutoSelection] Race ${nextRace.round} (${nextRace.raceName}) already has auto-assigned selections`);
      }

      return await this.autoAssignSelectionsForRace(nextRace.round, nextRace._id);

    } catch (error) {
      console.error('[AutoSelection] Error in autoAssignSelectionsForNextRace:', error);
      throw error;
    }
  }
}

module.exports = AutoSelectionService;

