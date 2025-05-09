const User = require('../models/User');
const RaceSelection = require('../models/RaceSelection');
const RaceResult = require('../models/RaceResult');
const mongoose = require('mongoose');

const MAX_SWITCHEROOS_PER_SEASON = 3;

/**
 * Get the number of remaining switcheroos for a user
 */
const getRemainingSwitcheroos = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).lean();
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({
      remaining: user.switcheroos?.remaining ?? MAX_SWITCHEROOS_PER_SEASON,
      total: MAX_SWITCHEROOS_PER_SEASON
    });
  } catch (error) {
    console.error('Error in getRemainingSwitcheroos:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get the switcheroo history for a user
 */
const getSwitcherooHistory = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('switcheroos.used.leagueId', 'name')
      .lean();
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json(user.switcheroos?.used || []);
  } catch (error) {
    console.error('Error in getSwitcherooHistory:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Perform a switcheroo for a user in a league
 */
const performSwitcheroo = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { raceId, leagueId, originalDriver, newDriver } = req.body;

    // Validate required fields
    if (!raceId || !leagueId || !originalDriver || !newDriver) {
      return res.status(400).json({ 
        message: 'Race ID, League ID, original driver, and new driver are required' 
      });
    }

    // Get user with their switcheroo data
    const user = await User.findById(req.user._id).session(session);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check remaining switcheroos
    const remaining = user.switcheroos?.remaining ?? MAX_SWITCHEROOS_PER_SEASON;
    if (remaining <= 0) {
      return res.status(400).json({ message: 'No switcheroos remaining' });
    }

    // Check if race is locked
    const race = await RaceResult.findOne({ round: Number(raceId) }).lean();
    if (!race) {
      return res.status(404).json({ message: 'Race not found' });
    }
    if (race.isLocked) {
      return res.status(400).json({ message: 'Race is locked' });
    }

    // Check if switcheroo is allowed based on race timing
    const isSwitcherooWindow = race.isSwitcherooAllowed();
    if (!isSwitcherooWindow) {
      return res.status(400).json({ message: 'Switcheroo is not allowed at this time' });
    }

    // Get user's selection
    const selection = await RaceSelection.findOne({
      user: req.user._id,
      league: leagueId,
      round: Number(raceId)
    }).session(session);

    if (!selection) {
      return res.status(404).json({ message: 'Selection not found' });
    }

    // Update user's switcheroo count and history
    user.switcheroos.remaining = remaining - 1;
    user.switcheroos.used.push({
      round: race.round,
      date: new Date(),
      leagueId,
      originalDriver,
      newDriver
    });

    // Save all changes in a transaction
    await Promise.all([
      user.save({ session })
    ]);

    await session.commitTransaction();
    console.log('Transaction committed');
    session.endSession();

    // Re-fetch fresh selection from DB
    const updatedSelection = await RaceSelection.findById(selection._id);
    console.log('Re-fetched selection:', updatedSelection);
    res.status(200).json({
      message: 'Switcheroo performed successfully',
      updatedSelection,
      remainingSwitcheroos: user.switcheroos.remaining,
      switcherooHistory: user.switcheroos.used,
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Error in performSwitcheroo:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getRemainingSwitcheroos,
  getSwitcherooHistory,
  performSwitcheroo
}; 