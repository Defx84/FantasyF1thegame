const mongoose = require('mongoose');
const RaceSelection = require('../models/RaceSelection');
const RaceResult = require('../models/RaceResult');
const RaceCalendar = require('../models/RaceCalendar');
const League = require('../models/League');
const UsedSelection = require('../models/UsedSelection');
const { normalizedDrivers, normalizedTeams } = require('../utils/validation');
const { handleError } = require('../utils/errorHandler');
const { getAllF1Data } = require('../constants/f1DataLoader');
const { calculateTeamPoints } = require('../utils/scoringUtils');

// Helper function to get driver's team
function getDriverTeam(driverName, season) {
  try {
    const f1Data = getAllF1Data(season);
    const driver = f1Data.drivers.find(d => 
      d.name === driverName || 
      d.shortName === driverName ||
      (d.alternateNames && d.alternateNames.includes(driverName))
    );
    return driver?.team || null;
  } catch (error) {
    console.error('Error getting driver team:', error);
    return null;
  }
}

// Cleanup test leagues (Comprehensive Season Test leagues)
exports.cleanupTestLeagues = async (req, res) => {
  try {
    const RaceSelection = require('../models/RaceSelection');
    const LeagueLeaderboard = require('../models/LeagueLeaderboard');
    const UsedSelection = require('../models/UsedSelection');

    // Find all test leagues with various naming patterns
    const testLeaguePatterns = [
      /^Comprehensive Season Test/i,
      /^Multi-Player Season Test/i,
      /^Season Test League/i,
      /^Full Season Test/i,
      /^Mystery Test League/i,
      /^Test Card League/i,
      /test.*league/i,
      /.*test.*season/i
    ];
    
    // Build query to match any test pattern
    const testLeagues = await League.find({
      $or: testLeaguePatterns.map(pattern => ({
        name: { $regex: pattern }
      }))
    });

    if (testLeagues.length === 0) {
      return res.json({ 
        message: 'No test leagues found.',
        deletedCount: 0 
      });
    }

    let deletedCount = 0;
    let errorCount = 0;
    const errors = [];

    for (const league of testLeagues) {
      try {
        const leagueId = league._id.toString();
        
        // Delete all related data
        await Promise.all([
          RaceSelection.deleteMany({ league: leagueId }),
          LeagueLeaderboard.deleteMany({ league: leagueId }),
          UsedSelection.deleteMany({ league: leagueId })
        ]);

        // Delete the league itself
        await League.findByIdAndDelete(leagueId);
        
        deletedCount++;
      } catch (error) {
        console.error(`Error deleting league ${league.name}:`, error);
        errors.push({ league: league.name, error: error.message });
        errorCount++;
      }
    }

    res.json({ 
      message: `Cleanup complete. Deleted ${deletedCount} test league(s).`,
      deletedCount,
      errorCount,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Error in cleanupTestLeagues:', error);
    res.status(500).json({ 
      message: 'Error cleaning up test leagues', 
      error: error.message 
    });
  }
};

// Helper function to check if a driver/team can be reused
const canReuseSelection = async (userId, leagueId, mainDriver, reserveDriver, team) => {
  const usedSelection = await UsedSelection.findOne({ user: userId, league: leagueId });
  if (!usedSelection) return true;

  const canReuseMainDriver = !mainDriver || mainDriver === 'None' || await usedSelection.canUseMainDriver(mainDriver);
  const canReuseReserveDriver = !reserveDriver || reserveDriver === 'None' || await usedSelection.canUseReserveDriver(reserveDriver);
  const canReuseTeam = !team || await usedSelection.canUseTeam(team);

  return canReuseMainDriver && canReuseReserveDriver && canReuseTeam;
};

// Assign a selection for a user who missed the deadline
exports.assignMissedSelection = async (req, res) => {
  try {
    const { leagueId, userId, raceId, mainDriver, reserveDriver, team } = req.body;
    const adminId = req.user._id;

    // Check if admin has permission
    const league = await League.findById(leagueId);
    if (!league) {
      return res.status(404).json({ message: 'League not found' });
    }

    const isAdmin = league.members.some(member => 
      member.user.toString() === adminId.toString() && member.isAdmin
    );

    if (!isAdmin) {
      return res.status(403).json({ message: 'Not authorized as league admin' });
    }

    // Check if race exists and is not locked
    const race = await RaceResult.findById(raceId);
    if (!race) {
      return res.status(404).json({ message: 'Race not found' });
    }

    if (race.isLocked) {
      return res.status(400).json({ message: 'Race has already started' });
    }

    // Check if drivers and team can be reused
    const canReuse = await canReuseSelection(userId, leagueId, mainDriver, reserveDriver, team);
    if (!canReuse) {
      return res.status(400).json({ message: 'Driver or team has already been used' });
    }

    // Create or update selection
    const selection = await RaceSelection.findOneAndUpdate(
      { user: userId, league: leagueId, race: raceId },
      {
        mainDriver,
        reserveDriver,
        team,
        isAdminAssigned: true,
        assignedBy: adminId,
        assignedAt: new Date()
      },
      { upsert: true, new: true }
    );

    res.status(200).json({
      message: 'Selection assigned successfully',
      selection
    });
  } catch (error) {
    console.error('Error in assignMissedSelection:', error);
    res.status(500).json({ message: 'Error assigning selection', error: error.message });
  }
};

// Assign a selection for a late joiner with actual points
exports.assignLateJoinSelection = async (req, res) => {
  try {
    const { leagueId, userId, raceId, driver, team } = req.body;

    // Check if user is a league admin
    const league = await League.findById(leagueId);
    if (!league) {
      return res.status(404).json({ message: 'League not found' });
    }

    const isAdmin = league.members.some(member => 
      member.user.toString() === req.user._id.toString() && member.isAdmin
    );

    if (!isAdmin) {
      return res.status(403).json({ message: 'Only league admins can assign selections' });
    }

    // Get race results to calculate points
    const race = await RaceResult.findById(raceId);
    if (!race) {
      return res.status(404).json({ message: 'Race not found' });
    }

    // Calculate points based on race results
    const driverResult = race.results.find(r => r.driver === driver);
    const points = driverResult ? driverResult.points : 0;

    // Check if selection can be reused
    const canReuse = await canReuseSelection(userId, leagueId, driver, 'None', team);
    if (!canReuse) {
      return res.status(400).json({ message: 'Driver or team has already been used in this league' });
    }

    // Find existing selection or create new one
    let selection = await RaceSelection.findOne({
      league: leagueId,
      user: userId,
      race: raceId
    });

    if (selection) {
      // Update existing selection
      selection.mainDriver = driver;
      selection.reserveDriver = 'None';
      selection.team = team;
      selection.points = points;
      selection.isAdminAssigned = true;
      selection.isLateJoin = true;
      selection.assignedBy = req.user._id;
      await selection.save();
    } else {
      // Create new selection
      selection = await RaceSelection.create({
        league: leagueId,
        user: userId,
        race: raceId,
        mainDriver: driver,
        reserveDriver: 'None',
        team: team,
        points: points,
        isAdminAssigned: true,
        isLateJoin: true,
        assignedBy: req.user._id
      });
    }

    // Update UsedSelection
    let usedSelection = await UsedSelection.findOne({ user: userId, league: leagueId });
    if (!usedSelection) {
      usedSelection = new UsedSelection({
        user: userId,
        league: leagueId
      });
    }
    await usedSelection.addUsedMainDriver(driver);
    await usedSelection.addUsedReserveDriver('None');
    await usedSelection.addUsedTeam(team);
    await usedSelection.save();

    res.status(200).json({
      message: 'Selection assigned successfully with actual points',
      selection
    });
  } catch (error) {
    console.error('Error in assignLateJoinSelection:', error);
    res.status(500).json({ message: 'Error assigning selection', error: error.message });
  }
};

// Get all admin-assigned selections for a league
exports.getAdminAssignments = async (req, res) => {
  try {
    const { leagueId } = req.params;

    // Check if user is a league admin
    const league = await League.findById(leagueId);
    if (!league) {
      return res.status(404).json({ message: 'League not found' });
    }

    const isAdmin = league.members.some(member => 
      member.user.toString() === req.user._id.toString() && member.isAdmin
    );

    if (!isAdmin) {
      return res.status(403).json({ message: 'Only league admins can view assignments' });
    }

    const assignments = await RaceSelection.find({
      league: leagueId,
      isAdminAssigned: true
    })
    .populate('user', 'username')
    .populate('race', 'raceName date')
    .populate('assignedBy', 'username');

    res.status(200).json(assignments);
  } catch (error) {
    console.error('Error in getAdminAssignments:', error);
    res.status(500).json({ message: 'Error getting assignments', error: error.message });
  }
};

// Get all races
exports.getAllRaces = async (req, res) => {
  try {
    const races = await RaceResult.find().sort({ date: 1 });
    res.json(races);
  } catch (error) {
    handleError(res, error);
  }
};

// Get a specific race
exports.getRace = async (req, res) => {
  try {
    const race = await RaceResult.findById(req.params.id);
    if (!race) {
      return res.status(404).json({ message: 'Race not found' });
    }
    res.json(race);
  } catch (error) {
    handleError(res, error);
  }
};

// Create a new race
exports.createRace = async (req, res) => {
  try {
    const race = await RaceResult.create(req.body);
    res.status(201).json(race);
  } catch (error) {
    console.error('Error in createRace:', error);
    res.status(500).json({ message: 'Error creating race', error: error.message });
  }
};

// Update a race
exports.updateRace = async (req, res) => {
  try {
    const race = await RaceResult.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!race) {
      return res.status(404).json({ message: 'Race not found' });
    }
    res.status(200).json(race);
  } catch (error) {
    console.error('Error in updateRace:', error);
    res.status(500).json({ message: 'Error updating race', error: error.message });
  }
};

// Delete a race
exports.deleteRace = async (req, res) => {
  try {
    const race = await RaceResult.findByIdAndDelete(req.params.id);
    if (!race) {
      return res.status(404).json({ message: 'Race not found' });
    }
    res.status(200).json({ message: 'Race deleted successfully' });
  } catch (error) {
    console.error('Error in deleteRace:', error);
    res.status(500).json({ message: 'Error deleting race', error: error.message });
  }
}; 

// Assign real points to all users in a league for a given round
exports.assignRealPointsToLeague = async (req, res) => {
  try {
    const { leagueId, round } = req.body;
    if (!leagueId || typeof round === 'undefined') {
      return res.status(400).json({ message: 'leagueId and round are required' });
    }

    const league = await require('../models/League').findById(leagueId).populate('members');
    if (!league) {
      return res.status(404).json({ message: 'League not found' });
    }

    const raceResult = await require('../models/RaceResult').findOne({ round });
    if (!raceResult) {
      return res.status(404).json({ message: 'RaceResult not found for this round' });
    }

    // Check if race is completed
    if (raceResult.status !== 'completed') {
      console.log(`[Admin Points] Race ${raceResult.raceName} (round ${round}) is not completed (status: ${raceResult.status})`);
      return res.status(400).json({ 
        message: `Cannot assign points - race is not completed (current status: ${raceResult.status})` 
      });
    }

    const RaceSelection = require('../models/RaceSelection');
    const ScoringService = require('../services/ScoringService');
    const scoringService = new ScoringService();
    const LeaderboardService = require('../services/LeaderboardService');
    const leaderboardService = new LeaderboardService();

    let updatedCount = 0;
    for (const member of league.members) {
      let selection = await RaceSelection.findOne({
        user: member._id,
        league: leagueId,
        race: raceResult._id
      });
      if (!selection) {
        console.log(`[Admin Points] No selection found for user ${member.username} in league ${league.name} for round ${round}`);
        continue;
      }
      // Only update if not already assigned real points
      if (!selection.pointBreakdown || selection.status === 'empty' || selection.status === 'user-submitted') {
        console.log(`[Admin Points] Assigning points for user ${member.username} in league ${league.name} for round ${round}`);
        
        // Get race card selection if season is 2026+
        let raceCardSelection = null;
        if (raceResult.season >= 2026) {
          const RaceCardSelection = require('../models/RaceCardSelection');
          raceCardSelection = await RaceCardSelection.findOne({
            user: member._id,
            league: leagueId,
            round: round
          }).populate('driverCard teamCard');
        }

        const pointsData = await scoringService.calculateRacePoints({
          mainDriver: selection.mainDriver,
          reserveDriver: selection.reserveDriver,
          team: selection.team
        }, raceResult, raceCardSelection, {
          userId: member._id,
          leagueId: leagueId
        });
        selection.points = pointsData.totalPoints;
        selection.pointBreakdown = pointsData.breakdown;
        selection.status = 'admin-assigned';
        selection.isAdminAssigned = true;
        selection.assignedAt = new Date();
        await selection.save();
        updatedCount++;
        console.log(`[Admin Points] Assigned ${pointsData.totalPoints} points to user ${member.username}`);

        // Update usage tracking
        const UsedSelection = require('../models/UsedSelection');
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
        await usedSelection.addUsedMainDriver(selection.mainDriver);
        await usedSelection.addUsedReserveDriver(selection.reserveDriver);
        await usedSelection.addUsedTeam(selection.team);
        await usedSelection.save();

        console.log(`[Admin Points] Updated usage tracking for user ${member.username} in league ${league.name}`);
      } else {
        console.log(`[Admin Points] Skipping user ${member.username} - points already assigned (status: ${selection.status})`);
      }
    }
    // Update leaderboard for the league
    await leaderboardService.updateStandings(leagueId);
    console.log(`[Admin Points] Updated leaderboard for league ${league.name}`);
    res.json({ message: `Assigned real points to ${updatedCount} users in league for round ${round}` });
  } catch (error) {
    console.error('Error in assignRealPointsToLeague:', error);
    res.status(500).json({ message: 'Error assigning real points to league', error: error.message });
  }
};

// Manually trigger scraper for a specific race
exports.triggerManualScraper = async (req, res) => {
  try {
    const { round, raceName } = req.body;
    
    if (!round || !raceName) {
      return res.status(400).json({ 
        message: 'round and raceName are required' 
      });
    }

    // Check if user is an admin (you can add more specific admin checks here)
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    console.log(`[Manual Scraper] Admin ${req.user.username} triggered scraper for ${raceName} (round ${round})`);

    // Import scraper functions
    const { runScraper, scrapeMotorsportResultsByType, loadSlugsFromFile } = require('../scrapers/motorsportScraper');
    
    // Load slugs to get the correct slug for the race
    const slugs = await loadSlugsFromFile();
    const slug = slugs[raceName];
    
    if (!slug) {
      return res.status(400).json({ 
        message: `No slug found for race: ${raceName}`,
        availableRaces: Object.keys(slugs)
      });
    }

    console.log(`[Manual Scraper] Found slug: ${slug} for ${raceName}`);

    // Run the scraper
    console.log(`[Manual Scraper] Starting scraper for ${raceName}...`);
    await runScraper();
    
    console.log(`[Manual Scraper] Scraper completed for ${raceName}`);

    // Get updated race result
    const RaceResult = require('../models/RaceResult');
    const updatedRace = await RaceResult.findOne({ round });
    
    if (updatedRace) {
      console.log(`[Manual Scraper] Race ${raceName} updated:`, {
        status: updatedRace.status,
        resultsCount: updatedRace.results?.length || 0,
        lastUpdated: updatedRace.lastUpdated
      });
    }

    res.json({ 
      message: `Manual scraper triggered successfully for ${raceName} (round ${round})`,
      race: updatedRace ? {
        status: updatedRace.status,
        resultsCount: updatedRace.results?.length || 0,
        lastUpdated: updatedRace.lastUpdated
      } : null
    });

  } catch (error) {
    console.error('Error in triggerManualScraper:', error);
    res.status(500).json({ 
      message: 'Error triggering manual scraper', 
      error: error.message 
    });
  }
};

// Get list of races for manual entry dropdown
exports.getRacesList = async (req, res) => {
  try {
    const { season } = req.query;
    const seasonYear = season ? parseInt(season) : new Date().getFullYear();
    
    // Get races from RaceCalendar (scheduled races) instead of RaceResult (races with results)
    // This ensures we show all races for the season, not just those with results
    const calendarRaces = await RaceCalendar.find({ season: seasonYear })
      .sort({ round: 1 })
      .select('round raceName date status season isSprintWeekend _id');
    
    // Also get existing race results to merge status information
    const raceResults = await RaceResult.find({ season: seasonYear })
      .select('round status manuallyEntered');
    
    // Create a map of round -> race result status
    const resultStatusMap = {};
    raceResults.forEach(result => {
      resultStatusMap[result.round] = {
        status: result.status,
        manuallyEntered: result.manuallyEntered
      };
    });
    
    // Merge calendar races with result status
    const races = calendarRaces.map(race => ({
      _id: race._id,
      round: race.round,
      raceName: race.raceName,
      date: race.date,
      season: race.season,
      isSprintWeekend: race.isSprintWeekend,
      status: resultStatusMap[race.round]?.status || 'scheduled',
      manuallyEntered: resultStatusMap[race.round]?.manuallyEntered || false
    }));
    
    res.json({ races });
  } catch (error) {
    console.error('Error in getRacesList:', error);
    res.status(500).json({ 
      message: 'Error fetching races list', 
      error: error.message 
    });
  }
};

// Get drivers and teams for a season
exports.getDriversAndTeams = async (req, res) => {
  try {
    const { season } = req.params;
    const seasonYear = parseInt(season) || new Date().getFullYear();
    
    const f1Data = getAllF1Data(seasonYear);
    const drivers = f1Data.drivers || [];
    const teams = f1Data.teams || [];
    
    res.json({ 
      drivers: drivers.map(d => ({
        name: d.name,
        shortName: d.shortName,
        team: d.team
      })),
      teams: teams.map(t => ({
        name: t.name,
        shortName: t.shortName,
        displayName: t.displayName
      }))
    });
  } catch (error) {
    console.error('Error in getDriversAndTeams:', error);
    res.status(500).json({ 
      message: 'Error fetching drivers and teams', 
      error: error.message 
    });
  }
};

// Save manual race results
exports.saveManualRaceResults = async (req, res) => {
  try {
    const { round, season, driverResults, teamResults, sprintResults, sprintTeamResults } = req.body;
    
    // Validate required fields
    if (!round || !season || !driverResults || !teamResults) {
      return res.status(400).json({ 
        message: 'Missing required fields: round, season, driverResults, teamResults' 
      });
    }
    
    // Validate driver count (22 drivers)
    if (driverResults.length !== 22) {
      return res.status(400).json({ 
        message: `Expected 22 drivers, received ${driverResults.length}` 
      });
    }
    
    // Validate team count (11 teams)
    if (teamResults.length !== 11) {
      return res.status(400).json({ 
        message: `Expected 11 teams, received ${teamResults.length}` 
      });
    }
    
    // Validate sprint results if provided
    if (sprintResults && sprintResults.length !== 22) {
      return res.status(400).json({ 
        message: `Expected 22 drivers for sprint, received ${sprintResults.length}` 
      });
    }
    
    if (sprintTeamResults && sprintTeamResults.length !== 11) {
      return res.status(400).json({ 
        message: `Expected 11 teams for sprint, received ${sprintTeamResults.length}` 
      });
    }
    
    // Get existing race to preserve metadata
    const existingRace = await RaceResult.findOne({ round, season });
    const raceName = existingRace?.raceName || `Race ${round}`;
    const isSprintWeekend = existingRace?.isSprintWeekend || (sprintResults ? true : false);
    
    // Process driver results - convert to format expected by saveRaceResults
    const processedDriverResults = driverResults.map(result => ({
      driver: result.driver,
      team: result.team || getDriverTeam(result.driver, season),
      position: result.position || null,
      rawPoints: result.points || 0,
      points: result.points || 0,
      status: result.status || 'Finished',
      didNotFinish: result.status === 'DNF',
      didNotStart: result.status === 'DNS',
      disqualified: result.status === 'DSQ'
    }));
    
    // Process sprint results if provided
    const processedSprintResults = sprintResults ? sprintResults.map(result => ({
      driver: result.driver,
      team: result.team || getDriverTeam(result.driver, season),
      position: result.position || null,
      rawPoints: result.points || 0,
      points: result.points || 0,
      status: result.status || 'Finished',
      didNotFinish: result.status === 'DNF',
      didNotStart: result.status === 'DNS',
      disqualified: result.status === 'DSQ'
    })) : null;
    
    // Calculate team points using existing utility
    const calculatedTeamResults = calculateTeamPoints(processedDriverResults, [], season);
    const calculatedSprintTeamResults = processedSprintResults 
      ? calculateTeamPoints(processedSprintResults, [], season)
      : null;
    
    // Use manually provided team results if available, otherwise use calculated
    let finalTeamResults = calculatedTeamResults;
    if (teamResults && teamResults.length > 0) {
      // Use provided team results, but ensure sprint points are included
      finalTeamResults = teamResults.map((tr) => {
        const racePoints = tr.racePoints || tr.points || 0;
        // Try to find matching sprint team result
        const matchingSprintTeam = calculatedSprintTeamResults?.find(t => {
          // Try exact match first, then normalized comparison
          return t.team === tr.team || 
                 t.team.toLowerCase() === tr.team.toLowerCase() ||
                 (tr.sprintPoints !== undefined && tr.sprintPoints !== null);
        });
        const sprintPoints = tr.sprintPoints !== undefined && tr.sprintPoints !== null 
          ? tr.sprintPoints 
          : (matchingSprintTeam?.sprintPoints || 0);
        const totalPoints = racePoints + sprintPoints;
        
        // Find position from calculated results if available
        const calculatedTeam = calculatedTeamResults.find(t => 
          t.team === tr.team || t.team.toLowerCase() === tr.team.toLowerCase()
        );
        
        return {
          team: tr.team,
          position: calculatedTeam?.position || 1,
          racePoints: racePoints,
          sprintPoints: sprintPoints,
          totalPoints: totalPoints
        };
      });
      
      // Sort by total points descending to set correct positions
      finalTeamResults.sort((a, b) => b.totalPoints - a.totalPoints);
      finalTeamResults = finalTeamResults.map((tr, index) => ({
        ...tr,
        position: index + 1
      }));
    }
    
    // Prepare race data
    const raceData = {
      round,
      raceName,
      season,
      results: processedDriverResults,
      teamResults: finalTeamResults,
      sprintResults: processedSprintResults,
      sprintTeamResults: calculatedSprintTeamResults,
      status: 'completed', // CRITICAL: Triggers post-save hook for point calculation
      isSprintWeekend,
      manuallyEntered: true,
      lastUpdated: new Date()
    };
    
    // Check if race already exists and warn
    if (existingRace && existingRace.status === 'completed') {
      console.warn(`[Manual Entry] Overwriting existing completed race results for ${raceName} (round ${round})`);
    }
    
    // Save race results
    const race = await RaceResult.findOneAndUpdate(
      { round, season },
      raceData,
      { upsert: true, new: true }
    );
    
    console.log(`[Manual Entry] ✅ Saved manual race results for ${raceName} (round ${round}, season ${season})`);
    console.log(`[Manual Entry] 🎯 Post-save hook will trigger automatic points calculation with power cards`);
    
    res.json({ 
      message: 'Manual race results saved successfully. Points calculation triggered.',
      race: {
        round: race.round,
        raceName: race.raceName,
        status: race.status,
        manuallyEntered: race.manuallyEntered,
        resultsCount: race.results?.length || 0,
        teamResultsCount: race.teamResults?.length || 0
      }
    });
    
  } catch (error) {
    console.error('Error in saveManualRaceResults:', error);
    res.status(500).json({ 
      message: 'Error saving manual race results', 
      error: error.message 
    });
  }
}; 