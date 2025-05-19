const mongoose = require('mongoose');
const RaceSelection = require('../models/RaceSelection');
const RaceResult = require('../models/RaceResult');
const League = require('../models/League');
const UsedSelection = require('../models/UsedSelection');
const { normalizedDrivers, normalizedTeams } = require('../utils/validation');
const { handleError } = require('../utils/errorHandler');

// Helper function to check if a driver/team can be reused
const canReuseSelection = async (userId, leagueId, mainDriver, reserveDriver, team) => {
  const usedSelection = await UsedSelection.findOne({ user: userId, league: leagueId });
  if (!usedSelection) return true;

  const canReuseMainDriver = !mainDriver || mainDriver === 'None' || !usedSelection.usedMainDrivers.includes(mainDriver.toLowerCase());
  const canReuseReserveDriver = !reserveDriver || reserveDriver === 'None' || !usedSelection.usedReserveDrivers.includes(reserveDriver.toLowerCase());
  const canReuseTeam = !team || !usedSelection.usedTeams.includes(team.toLowerCase());

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
        league: leagueId,
        usedMainDrivers: [],
        usedReserveDrivers: [],
        usedTeams: []
      });
    }
    usedSelection.addUsedMainDriver(driver);
    usedSelection.addUsedTeam(team);
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
      if (!selection) continue;
      // Only update if not already assigned real points
      if (!selection.pointBreakdown || selection.status === 'empty') {
        const pointsData = scoringService.calculateRacePoints({
          mainDriver: selection.mainDriver,
          reserveDriver: selection.reserveDriver,
          team: selection.team
        }, raceResult);
        selection.points = pointsData.totalPoints;
        selection.pointBreakdown = pointsData.breakdown;
        selection.status = 'admin-assigned';
        selection.isAdminAssigned = true;
        selection.assignedAt = new Date();
        await selection.save();
        updatedCount++;
      }
    }
    // Update leaderboard for the league
    await leaderboardService.updateStandings(leagueId);
    res.json({ message: `Assigned real points to ${updatedCount} users in league for round ${round}` });
  } catch (error) {
    console.error('Error in assignRealPointsToLeague:', error);
    res.status(500).json({ message: 'Error assigning real points to league', error: error.message });
  }
}; 