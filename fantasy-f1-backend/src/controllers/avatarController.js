const User = require('../models/User');
const helmetGenerator = require('../services/helmetGenerator');

/**
 * Get user's avatar configuration (admin only for now)
 */
const getUserAvatar = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Anyone can view avatars (for standings, leaderboards, etc.)
    // Only editing/updating requires ownership or admin privileges

    const user = await User.findById(userId).select('avatar username');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      avatar: user.avatar,
      username: user.username
    });
  } catch (error) {
    console.error('Error getting user avatar:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Update user's avatar configuration
 */
const updateUserAvatar = async (req, res) => {
  try {
    const { userId } = req.params;
    const { helmetPresetId, helmetNumber } = req.body;

    // Users can only update their own avatar (admins can update any)
    if (!req.user.isAppAdmin && req.user.id !== userId) {
      return res.status(403).json({ 
        error: 'Access denied. You can only update your own avatar.' 
      });
    }

    // Validate input
    if (helmetPresetId !== undefined && (helmetPresetId < 1 || helmetPresetId > 30)) {
      return res.status(400).json({ error: 'Invalid helmet preset. Must be between 1 and 30.' });
    }

    if (helmetNumber && (helmetNumber.length > 2 || !/^[A-Za-z0-9-]+$/.test(helmetNumber))) {
      return res.status(400).json({ error: 'Invalid helmet number. Must be 1-2 characters, letters, numbers, or dash only.' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update avatar configuration
    const updateData = {};
    if (helmetPresetId !== undefined) {
      updateData['avatar.helmetPresetId'] = helmetPresetId;
    }
    if (helmetNumber !== undefined) {
      updateData['avatar.helmetNumber'] = helmetNumber;
    }

    // Mark as customized if any changes are made
    if (Object.keys(updateData).length > 0) {
      updateData['avatar.isCustomized'] = true;
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true }
    ).select('avatar username');

    res.json({
      message: 'Avatar updated successfully',
      avatar: updatedUser.avatar,
      username: updatedUser.username
    });
  } catch (error) {
    console.error('Error updating user avatar:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get helmet image (admin only for now)
 */
const getHelmetImage = async (req, res) => {
  try {
    const { userId } = req.params;
    const { size = 128 } = req.query;

    // Anyone can view helmet images (for standings, leaderboards, etc.)
    // Only editing/updating requires ownership or admin privileges

    const user = await User.findById(userId).select('avatar');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate helmet SVG
    const helmetSVG = helmetGenerator.generateHelmetSVG(user.avatar);

    // Set response headers
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    res.send(helmetSVG);
  } catch (error) {
    console.error('Error generating helmet image:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get all users with avatar data (admin only)
 */
const getAllUsersAvatars = async (req, res) => {
  try {
    // Only allow admins to access avatar data for now
    if (!req.user.isAppAdmin) {
      return res.status(403).json({ 
        error: 'Access denied. Avatar feature is admin-only for testing.' 
      });
    }

    const users = await User.find({}).select('username avatar').limit(50);
    
    res.json({
      users: users.map(user => ({
        id: user._id,
        username: user.username,
        avatar: user.avatar
      }))
    });
  } catch (error) {
    console.error('Error getting all users avatars:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Reset user's avatar to default (admin only)
 */
const resetUserAvatar = async (req, res) => {
  try {
    const { userId } = req.params;

    // Users can only reset their own avatar (admins can reset any)
    if (!req.user.isAppAdmin && req.user.id !== userId) {
      return res.status(403).json({ 
        error: 'Access denied. You can only reset your own avatar.' 
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Reset to default values
    const defaultAvatar = helmetGenerator.getDefaultHelmet();
    
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        $set: { 
          avatar: defaultAvatar
        } 
      },
      { new: true }
    ).select('avatar username');

    res.json({
      message: 'Avatar reset to default successfully',
      avatar: updatedUser.avatar,
      username: updatedUser.username
    });
  } catch (error) {
    console.error('Error resetting user avatar:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getUserAvatar,
  updateUserAvatar,
  getHelmetImage,
  getAllUsersAvatars,
  resetUserAvatar
}; 