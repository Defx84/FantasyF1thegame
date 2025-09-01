const jwt = require('jsonwebtoken');
const User = require('../models/User');
const League = require('../models/League');
// Temporarily removed tokenUtils import to fix authentication issues
// const { verifyToken } = require('../utils/tokenUtils');

const auth = async (req, res, next) => {
  console.log('Auth middleware - Starting authentication check');
  try {
    console.log('Auth middleware - Headers:', req.headers);
    console.log('Auth middleware - Cookies:', req.cookies);
    
    // Check for token in Authorization header first, then cookies
    const headerToken = req.headers.authorization?.split(' ')[1];
    const cookieToken = req.cookies.accessToken;
    const token = headerToken || cookieToken;
    
    if (!token) {
      console.log('Auth middleware - No token found');
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Skip verification in test environment
    if (process.env.NODE_ENV === 'test') {
      const user = await User.findById(req.header('x-test-user-id'));
      if (!user) {
        return res.status(401).json({ message: 'Test user not found' });
      }
      req.user = user;
      req.token = token;
      return next();
    }

    console.log('Auth middleware - Verifying token');
    
    // Temporarily use standard JWT verification instead of tokenUtils
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Auth middleware - Decoded token:', decoded);

    const user = await User.findById(decoded.userId);
    console.log('Auth middleware - Found user:', user ? user._id : 'not found');

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Middleware to verify refresh token
const verifyRefreshToken = async (req, res, next) => {
  try {
    const refreshToken = req.body.refreshToken;
    
    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token required' });
    }

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;
    req.refreshToken = refreshToken;
    next();
  } catch (error) {
    console.error('Refresh token verification error:', error);
    return res.status(401).json({ message: 'Invalid refresh token' });
  }
};

// Middleware to check if user is admin of a specific league
const isLeagueAdmin = async (req, res, next) => {
  try {
    const { leagueId } = req.params;
    const userId = req.user._id;

    const league = await League.findById(leagueId);
    if (!league) {
      return res.status(404).json({ message: 'League not found' });
    }

    const isAdmin = league.owner.toString() === userId.toString() || 
                   league.members.some(member => 
                     member.user.toString() === userId.toString() && member.isAdmin
                   );

    if (!isAdmin) {
      return res.status(403).json({ message: 'Admin privileges required' });
    }

    next();
  } catch (error) {
    console.error('League admin verification error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  auth,
  verifyRefreshToken,
  isLeagueAdmin
}; 