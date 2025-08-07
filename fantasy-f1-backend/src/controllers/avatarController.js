const User = require('../models/User');
const helmetGenerator = require('../services/helmetGenerator');

/**
 * Get user's avatar configuration (admin only for now)
 */
const getUserAvatar = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Only allow admins to access avatar data for now
    if (!req.user.isAppAdmin) {
      return res.status(403).json({ 
        error: 'Access denied. Avatar feature is admin-only for testing.' 
      });
    }

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
 * Update user's avatar configuration (admin only for now)
 */
const updateUserAvatar = async (req, res) => {
  try {
    const { userId } = req.params;
    const { helmetTemplateId, helmetColors, helmetNumber, imageData } = req.body;

    // Only allow admins to update avatar data for now
    if (!req.user.isAppAdmin) {
      return res.status(403).json({ 
        error: 'Access denied. Avatar feature is admin-only for testing.' 
      });
    }

    // Validate input
    if (helmetTemplateId && ![1, 2, 3].includes(helmetTemplateId)) {
      return res.status(400).json({ error: 'Invalid helmet template. Must be 1, 2, or 3.' });
    }

    if (helmetNumber && (helmetNumber.length > 2 || !/^[A-Za-z0-9-]+$/.test(helmetNumber))) {
      return res.status(400).json({ error: 'Invalid helmet number. Must be 1-2 characters, letters, numbers, or dash only.' });
    }

    // Validate colors (basic hex validation)
    if (helmetColors) {
      const colorRegex = /^#[0-9A-Fa-f]{6}$/;
      if (helmetColors.primary && !colorRegex.test(helmetColors.primary)) {
        return res.status(400).json({ error: 'Invalid primary color format. Use hex format (e.g., #FF0000).' });
      }
      if (helmetColors.secondary && !colorRegex.test(helmetColors.secondary)) {
        return res.status(400).json({ error: 'Invalid secondary color format. Use hex format (e.g., #FF0000).' });
      }
      if (helmetColors.accent && !colorRegex.test(helmetColors.accent)) {
        return res.status(400).json({ error: 'Invalid accent color format. Use hex format (e.g., #FF0000).' });
      }
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update avatar configuration
    const updateData = {};
    if (helmetTemplateId !== undefined) {
      updateData['avatar.helmetTemplateId'] = helmetTemplateId;
    }
    if (helmetColors) {
      if (helmetColors.primary) updateData['avatar.helmetColors.primary'] = helmetColors.primary;
      if (helmetColors.secondary) updateData['avatar.helmetColors.secondary'] = helmetColors.secondary;
      if (helmetColors.accent) updateData['avatar.helmetColors.accent'] = helmetColors.accent;
    }
    if (helmetNumber !== undefined) {
      updateData['avatar.helmetNumber'] = helmetNumber;
    }
    if (imageData) {
      updateData['avatar.imageData'] = imageData;
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

    // Only allow admins to access helmet images for now
    if (!req.user.isAppAdmin) {
      return res.status(403).json({ 
        error: 'Access denied. Avatar feature is admin-only for testing.' 
      });
    }

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

    // Only allow admins to reset avatar data for now
    if (!req.user.isAppAdmin) {
      return res.status(403).json({ 
        error: 'Access denied. Avatar feature is admin-only for testing.' 
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