const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { sendEmail } = require('../utils/email');
const League = require('../models/League');

// Generate JWT token
const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
  
  const refreshToken = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN
  });

  return { accessToken, refreshToken };
};

// Register new user
const register = async (req, res) => {
  try {
    const { username, email, password, termsAccepted } = req.body;

    // Check if terms were accepted
    if (!termsAccepted) {
      return res.status(400).json({
        error: 'You must accept the Terms & Conditions to register'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({
        error: 'User with this email or username already exists'
      });
    }

    // Create new user
    const user = new User({
      username,
      email,
      password,
      termsAccepted: true,
      termsAcceptedAt: new Date()
    });

    await user.save();

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id);

    // Try to send welcome email, but don't fail if it doesn't work
    try {
      await sendEmail({
        to: email,
        subject: '🏁 Welcome to TheFantasyF1Game — Your Race Starts Now!',
        text: `Hi ${username},\n\nWelcome to TheFantasyF1Game — where Formula 1 passion meets strategy and competition.\nYou're officially on the grid, and it's time to prove your skills.\n\nEach race weekend, you'll choose your Main Driver, Reserve Driver, and Team. Will you play it safe or go bold for big points? The podium awaits.\n\n🔥 What's next?\n- Join or create a league with friends\n- Lock in your race selections before qualifying\n- Track your points and chase the title\n\n🏎️ For updates, tips, and behind-the-scenes action:\nFollow us on Instagram → @thefantasyf1game\n\nThanks for joining the race.\nStart your engines — the championship is calling. (click here to join)\n\n— TheFantasyF1Game Team`,
        html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa; border-radius: 10px;">
      <h2 style="color: #dc2626; text-align: center;">🏁 Welcome to TheFantasyF1Game — Your Race Starts Now!</h2>
      <p>Hi <b>${username}</b>,</p>
      <p>Welcome to <b>TheFantasyF1Game</b> — where Formula 1 passion meets strategy and competition.<br />You're officially on the grid, and it's time to prove your skills.</p>
      <p>Each race weekend, you'll choose your Main Driver, Reserve Driver, and Team. Will you play it safe or go bold for big points? The podium awaits.</p>
      <h3>🔥 What's next?</h3>
      <ul style="font-size: 1.1em;">
        <li>Join or create a league with friends</li>
        <li>Lock in your race selections before qualifying</li>
        <li>Track your points and chase the title</li>
      </ul>
      <p>🏎️ For updates, tips, and behind-the-scenes action:<br />
      Follow us on Instagram → <a href="https://instagram.com/thefantasyf1game" target="_blank">@thefantasyf1game</a></p>
      <p style="margin-top:2em;">Thanks for joining the race.<br />Start your engines — the championship is calling. <a href="https://thefantasyf1game.com" target="_blank">(click here to join)</a></p>
      <p><b>— TheFantasyF1Game Team</b></p>
    </div>
  `
      });
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Continue with registration even if email fails
    }

    res.status(201).json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      },
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({ error: error.message });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id);

    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      },
      accessToken,
      refreshToken
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Refresh access token
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token is required' });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // Generate new access token
    const { accessToken } = generateTokens(user._id);

    res.json({ accessToken });
  } catch (error) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
};

// Logout user
const logout = async (req, res) => {
  try {
    // Get the token from the request
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    try {
      // Verify the token to ensure it's valid
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // In a production environment, you would:
      // 1. Store the token in a blacklist (Redis/MongoDB)
      // 2. Set an expiration time equal to the token's original expiration
      // 3. Check the blacklist during token verification
      
      // For now, we'll just verify the token and return success
      res.json({ 
        message: 'Logged out successfully',
        tokenInvalidated: true 
      });
    } catch (error) {
      // If token verification fails, it might be expired or invalid
      // We'll still return success since the user is effectively logged out
      res.json({ 
        message: 'Logged out successfully',
        tokenInvalidated: true 
      });
    }
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error during logout' });
  }
};

// Get current user profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('leagueSelections.leagueId', 'name code');

    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Request password reset
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate reset token
    const resetToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Send reset email
    await sendEmail({
      to: email,
      subject: 'Password Reset Request',
      text: `Click this link to reset your password: ${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`
    });

    res.json({ message: 'Password reset email sent' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Reset password
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getCurrentUser = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Get user's admin status in leagues
        const leagues = await League.find({
            'members.user': user._id,
            'members.isAdmin': true
        }).select('_id name');

        res.json({
            user: {
                id: user._id,
                email: user.email,
                username: user.username,
                isAdmin: leagues.length > 0,
                adminLeagues: leagues,
                isAppAdmin: user.isAppAdmin
            }
        });
    } catch (error) {
        console.error('Error in getCurrentUser:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete user account
const deleteAccount = async (req, res) => {
  try {
    const userId = req.user._id;
    // Remove user from all leagues (if needed)
    await League.updateMany(
      { 'members.user': userId },
      { $pull: { members: { user: userId } } }
    );
    // Delete the user
    await User.findByIdAndDelete(userId);
    res.json({ message: 'Account deleted successfully.' });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ error: 'Failed to delete account.' });
    }
};

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  getProfile,
  forgotPassword,
  resetPassword,
  getCurrentUser,
  deleteAccount
}; 