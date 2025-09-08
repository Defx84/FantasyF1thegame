const User = require('../models/User');
const { sendTestReminder } = require('../services/reminderService');
const { testEmailConnection } = require('../utils/email');

// Get user preferences
const getUserPreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findById(userId).select('emailRemindersEnabled lastReminderSent');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      emailRemindersEnabled: user.emailRemindersEnabled,
      lastReminderSent: user.lastReminderSent
    });
    
  } catch (error) {
    console.error('Error getting user preferences:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update user email reminder preference
const updateEmailReminders = async (req, res) => {
  try {
    const userId = req.user.id;
    const { emailRemindersEnabled } = req.body;
    
    // Validate input
    if (typeof emailRemindersEnabled !== 'boolean') {
      return res.status(400).json({ 
        error: 'emailRemindersEnabled must be a boolean value' 
      });
    }
    
    const user = await User.findByIdAndUpdate(
      userId,
      { emailRemindersEnabled },
      { new: true, select: 'emailRemindersEnabled lastReminderSent' }
    );
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      message: 'Email reminder preference updated successfully',
      emailRemindersEnabled: user.emailRemindersEnabled
    });
    
  } catch (error) {
    console.error('Error updating email reminders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get user profile (basic info)
const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findById(userId).select(
      'username email emailRemindersEnabled lastReminderSent createdAt lastLogin avatar'
    );
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      id: user._id,
      username: user.username,
      email: user.email,
      emailRemindersEnabled: user.emailRemindersEnabled,
      lastReminderSent: user.lastReminderSent,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
      avatar: user.avatar
    });
    
  } catch (error) {
    console.error('Error getting user profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Send test reminder email (admin only - for testing purposes)
const sendTestReminderEmail = async (req, res) => {
  try {
    console.log('🔧 Test reminder endpoint called');
    
    // Check if user is app admin
    if (!req.user.isAppAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    
    const result = await sendTestReminder(userId);
    
    res.json({
      message: 'Test reminder email sent successfully',
      result
    });
    
  } catch (error) {
    console.error('❌ Test reminder error:', error.message);
    res.status(500).json({ 
      error: 'Failed to send test reminder',
      details: error.message 
    });
  }
};

// Get all users (admin only - for test reminder dropdown)
const getAllUsers = async (req, res) => {
  try {
    // Check if user is app admin
    if (!req.user.isAppAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const users = await User.find({})
      .select('_id username email emailRemindersEnabled')
      .sort({ username: 1 });
    
    res.json({ users });
    
  } catch (error) {
    console.error('Error getting all users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Test email connection (admin only)
const testEmailConnectionEndpoint = async (req, res) => {
  try {
    // Check if user is app admin
    if (!req.user.isAppAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const isConnected = await testEmailConnection();
    
    res.json({
      message: isConnected ? 'Email connection successful' : 'Email connection failed',
      connected: isConnected
    });
    
  } catch (error) {
    console.error('Error testing email connection:', error);
    res.status(500).json({ 
      error: 'Failed to test email connection',
      details: error.message 
    });
  }
};

module.exports = {
  getUserPreferences,
  updateEmailReminders,
  getUserProfile,
  sendTestReminderEmail,
  getAllUsers,
  testEmailConnectionEndpoint
};
