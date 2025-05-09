const League = require('../models/League');

/**
 * Middleware to check if user is an admin of the specified league
 */
const isLeagueAdmin = async (req, res, next) => {
  try {
    const { leagueId } = req.params;
    const userId = req.user._id;

    const league = await League.findById(leagueId);
    if (!league) {
      return res.status(404).json({ message: 'League not found' });
    }

    const isAdmin = league.members.some(member => 
      member.user.toString() === userId.toString() && member.isAdmin
    );

    if (!isAdmin) {
      return res.status(403).json({ 
        message: 'Only league admins can perform this action' 
      });
    }

    next();
  } catch (error) {
    res.status(500).json({ 
      message: 'Error checking admin status',
      error: error.message 
    });
  }
};

/**
 * Middleware to check if user is an admin of any league
 */
const isAnyLeagueAdmin = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const adminLeagues = await League.find({
      'members.user': userId,
      'members.isAdmin': true
    });

    if (adminLeagues.length === 0) {
      return res.status(403).json({ 
        message: 'You must be an admin of at least one league to perform this action' 
      });
    }

    req.adminLeagues = adminLeagues;
    next();
  } catch (error) {
    res.status(500).json({ 
      message: 'Error checking admin status',
      error: error.message 
    });
  }
};

module.exports = {
  isLeagueAdmin,
  isAnyLeagueAdmin
}; 