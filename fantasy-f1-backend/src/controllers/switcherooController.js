const User = require('../models/User');
const RaceSelection = require('../models/RaceSelection');
const RaceResult = require('../models/RaceResult');
const Switcheroo = require('../models/Switcheroo');
const mongoose = require('mongoose');
const RaceCalendar = require('../models/RaceCalendar');

const MAX_SWITCHEROOS_PER_SEASON = 3;

/**
 * Get the number of remaining switcheroos for a user in a league
 */
const getRemainingSwitcheroos = async (req, res) => {
  try {
    const { leagueId } = req.query;
    if (!leagueId) {
      return res.status(400).json({ message: 'League ID is required' });
    }
    const switcherooCount = await Switcheroo.countDocuments({
      user: req.user._id,
      league: leagueId
    });
    return res.json({
      remaining: MAX_SWITCHEROOS_PER_SEASON - switcherooCount,
      total: MAX_SWITCHEROOS_PER_SEASON
    });
  } catch (error) {
    console.error('Error in getRemainingSwitcheroos:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get the switcheroo history for a user in a league
 */
const getSwitcherooHistory = async (req, res) => {
  try {
    const leagueId = req.params.leagueId;
    if (!leagueId) {
      return res.status(400).json({ message: 'League ID is required' });
    }
    const history = await Switcheroo.find({
      user: req.user._id,
      league: leagueId
    })
      .sort({ timeUsed: -1 })
      .populate('race', 'raceName date')
      .lean();
    return res.json(history);
  } catch (error) {
    console.error('Error in getSwitcherooHistory:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Perform a switcheroo for a user in a league
 */
const performSwitcheroo = async (req, res) => {
  try {
    const { raceId, leagueId, originalDriver, newDriver } = req.body;
    if (!raceId || !leagueId || !originalDriver || !newDriver) {
      return res.status(400).json({ message: 'Race ID, League ID, original driver, and new driver are required' });
    }
    // Check remaining switcheroos
    const switcherooCount = await Switcheroo.countDocuments({
      user: req.user._id,
      league: leagueId
    });
    if (switcherooCount >= MAX_SWITCHEROOS_PER_SEASON) {
      return res.status(400).json({ message: 'No switcheroos remaining' });
    }
    // Get user's selection
    const selection = await RaceSelection.findOne({
      user: req.user._id,
      league: leagueId,
      round: Number(raceId)
    });
    if (!selection) {
      return res.status(404).json({ message: 'Selection not found' });
    }
    // Verify original driver is in selection
    const hasDriver = selection.mainDriver === originalDriver || selection.reserveDriver === originalDriver;
    if (!hasDriver) {
      return res.status(400).json({ message: 'Original driver not found in selection' });
    }
    // Update selection with new driver
    if (selection.mainDriver === originalDriver) {
      selection.mainDriver = newDriver;
    } else {
      selection.reserveDriver = newDriver;
    }
    await selection.save();
    // Create switcheroo record
    const switcheroo = new Switcheroo({
      user: req.user._id,
      league: leagueId,
      race: raceId,
      originalDriver,
      newDriver,
      timeUsed: new Date()
    });
    await switcheroo.save();
    return res.json({
      message: 'Switcheroo performed successfully',
      remaining: MAX_SWITCHEROOS_PER_SEASON - (switcherooCount + 1)
    });
  } catch (error) {
    console.error('Error in performSwitcheroo:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const getSwitcherooWindowStatus = async (req, res) => {
  try {
    const { raceId } = req.query;
    if (!raceId) {
      return res.status(400).json({ message: 'raceId is required' });
    }
    // Use RaceCalendar for timing
    const race = await RaceCalendar.findOne({ round: Number(raceId) });
    if (!race) {
      return res.status(404).json({ message: 'Race not found' });
    }
    const now = new Date();
    let isSwitcherooAllowed = false;
    if (race.isSprintWeekend) {
      // Sprint weekend: between sprintQualifyingEnd (or start+1h) and 5 min before sprintStart
      let sprintQualifyingEnd = race.sprintQualifyingEnd;
      if (!sprintQualifyingEnd && race.sprintQualifyingStart) {
        sprintQualifyingEnd = new Date(race.sprintQualifyingStart.getTime() + 60 * 60 * 1000);
      }
      if (sprintQualifyingEnd && race.sprintStart) {
        const switcherooEnd = new Date(race.sprintStart.getTime() - 5 * 60 * 1000);
        isSwitcherooAllowed = now >= sprintQualifyingEnd && now <= switcherooEnd;
      }
    } else {
      // Regular weekend: between qualifyingEnd (or start+1h) and 5 min before raceStart
      let qualifyingEnd = race.qualifyingEnd;
      if (!qualifyingEnd && race.qualifyingStart) {
        qualifyingEnd = new Date(race.qualifyingStart.getTime() + 60 * 60 * 1000);
      }
      if (qualifyingEnd && race.raceStart) {
        const switcherooEnd = new Date(race.raceStart.getTime() - 5 * 60 * 1000);
        isSwitcherooAllowed = now >= qualifyingEnd && now <= switcherooEnd;
      }
    }
    res.json({ isSwitcherooAllowed });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getRemainingSwitcheroos,
  getSwitcherooHistory,
  performSwitcheroo,
  getSwitcherooWindowStatus
}; 