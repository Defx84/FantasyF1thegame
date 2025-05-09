const League = require('../models/League');

const validateLeagueAdmin = async (req, res, next) => {
  try {
    const league = await League.findById(req.params.leagueId);
    
    if (!league) {
      return res.status(404).json({ error: 'League not found' });
    }

    if (league.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'You do not have permission to perform this action' });
    }

    req.league = league;
    next();
  } catch (error) {
    console.error('League admin validation error:', error);
    res.status(500).json({ error: 'Server error during league admin validation' });
  }
};

module.exports = validateLeagueAdmin; 