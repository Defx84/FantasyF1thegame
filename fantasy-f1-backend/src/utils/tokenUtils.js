const jwt = require('jsonwebtoken');
const TokenBlacklist = require('../models/TokenBlacklist');

/**
 * Generate access and refresh tokens
 * @param {string} userId - User ID
 * @returns {Object} - Object containing accessToken and refreshToken
 */
const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: '2h' } // 2-hour access token for better user experience
  );

  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' } // Longer-lived refresh token
  );

  return { accessToken, refreshToken };
};

/**
 * Add token to blacklist
 * @param {string} token - JWT token to blacklist
 * @param {string} userId - User ID
 * @returns {Promise} - Promise that resolves when token is blacklisted
 */
const addToBlacklist = async (token, userId) => {
  try {
    const decoded = jwt.decode(token);
    const expiresAt = new Date(decoded.exp * 1000);

    await TokenBlacklist.create({
      token,
      userId,
      expiresAt
    });

    console.log(`Token blacklisted for user ${userId}`);
  } catch (error) {
    console.error('Error blacklisting token:', error);
    throw error;
  }
};

/**
 * Check if token is blacklisted
 * @param {string} token - JWT token to check
 * @returns {Promise<boolean>} - True if token is blacklisted
 */
const isTokenBlacklisted = async (token) => {
  try {
    const blacklistedToken = await TokenBlacklist.findOne({ token });
    return !!blacklistedToken;
  } catch (error) {
    console.error('Error checking token blacklist:', error);
    return false;
  }
};

/**
 * Verify token and check blacklist
 * @param {string} token - JWT token to verify
 * @param {string} secret - JWT secret
 * @returns {Promise<Object>} - Decoded token payload
 */
const verifyToken = async (token, secret) => {
  // First check if token is blacklisted
  const isBlacklisted = await isTokenBlacklisted(token);
  if (isBlacklisted) {
    throw new Error('Token has been revoked');
  }

  // Then verify the token
  return jwt.verify(token, secret);
};

/**
 * Clean up expired blacklisted tokens
 * @returns {Promise<number>} - Number of tokens removed
 */
const cleanupExpiredTokens = async () => {
  try {
    const result = await TokenBlacklist.deleteMany({
      expiresAt: { $lt: new Date() }
    });
    
    console.log(`Cleaned up ${result.deletedCount} expired blacklisted tokens`);
    return result.deletedCount;
  } catch (error) {
    console.error('Error cleaning up expired tokens:', error);
    return 0;
  }
};

module.exports = {
  generateTokens,
  addToBlacklist,
  isTokenBlacklisted,
  verifyToken,
  cleanupExpiredTokens
};


