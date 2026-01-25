const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const League = require('../models/League');
const { sendEmail } = require('../utils/email');
const { generateTokens, addToBlacklist, verifyToken } = require('../utils/tokenUtils');

// Generate tokens helper function (keeping for backward compatibility)
const generateTokensHelper = (userId) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );

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
        subject: '🏁 Welcome to theFantasyF1game 2026',
        text: `Hi ${username},\n\nWelcome to theFantasyF1game 2026,\n\nThe new season is here, bringing a new Formula 1 era with updated cars, drivers, and strategies.\n\nWhether you are joining for the first time or returning for another season, theFantasyF1game is designed to make every race weekend matter. Every selection, every point, and every strategic choice can change the outcome of your league.\n\nWhat’s new for 2026\n\nHere is a quick overview of the main updates for the 2026 season:\n\n- All-new 2026 Formula 1 era\n- Updated driver lineup and teams\n- New selection system\n- New Power Cards system\n- More strategic decision making\n- Enhanced league experience\n- Clearer race history and results breakdowns\n- Improved admin tools to ensure fair play and consistency\n\nHow the game works (quick reminder)\n\n- Join or create a League\n- Build your Power Cards deck\n- Select one Main Driver, one Reserve Driver, and one Team for each race weekend\n- Use Power Cards strategically throughout the season\n- Compete in both the Driver Championship and Constructors Championship\n- Climb the leaderboard by outscoring your rivals\n\nYou can join or create a League now, and make your first selections for the season.\n\nGood luck,\n\ntheFantasyF1game Team\nhttps://thefantasyf1game.com`,
        html: `
    <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 24px; background-color: #f8f9fa; border-radius: 10px;">
      <div style="text-align: center; margin-bottom: 16px;">
        <img src="https://thefantasyf1game.com/App_Logo.png" alt="theFantasyF1game" style="max-width: 200px; height: auto;" />
      </div>
      <h2 style="color: #dc2626; text-align: center; margin-top: 0;">🏁 Welcome to theFantasyF1game 2026</h2>
      <p>Hi <b>${username}</b>,</p>
      <p>The new season is here, bringing a new Formula 1 era with updated cars, drivers, and strategies.</p>
      <p>Whether you are joining for the first time or returning for another season, <b>theFantasyF1game</b> is designed to make every race weekend matter. Every selection, every point, and every strategic choice can change the outcome of your league.</p>
      <h3 style="margin-bottom: 6px;">What’s new for 2026</h3>
      <p style="margin-top: 0;">Here is a quick overview of the main updates for the 2026 season:</p>
      <ul style="font-size: 1.05em;">
        <li>All-new 2026 Formula 1 era</li>
        <li>Updated driver lineup and teams</li>
        <li>New selection system</li>
        <li>New Power Cards system</li>
        <li>More strategic decision making</li>
        <li>Enhanced league experience</li>
        <li>Clearer race history and results breakdowns</li>
        <li>Improved admin tools to ensure fair play and consistency</li>
      </ul>
      <h3 style="margin-bottom: 6px;">How the game works (quick reminder)</h3>
      <ul style="font-size: 1.05em;">
        <li>Join or create a League</li>
        <li>Build your Power Cards deck</li>
        <li>Select one Main Driver, one Reserve Driver, and one Team for each race weekend</li>
        <li>Use Power Cards strategically throughout the season</li>
        <li>Compete in both the Driver Championship and Constructors Championship</li>
        <li>Climb the leaderboard by outscoring your rivals</li>
      </ul>
      <p>You can join or create a League now, and make your first selections for the season.</p>
      <p style="margin-top: 24px;">Good luck,<br /><b>theFantasyF1game Team</b></p>
      <p><a href="https://thefantasyf1game.com" target="_blank">www.thefantasyf1game.com</a></p>
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

    // Set httpOnly cookies
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'strict',
      maxAge: 2 * 60 * 60 * 1000, // 2 hours
      path: '/'
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/api/auth/refresh'
    });

    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      },
      accessToken, // Include accessToken for cross-domain compatibility
      refreshToken // Include refreshToken for cross-domain compatibility
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Refresh access token
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const cookieRefreshToken = req.cookies.refreshToken;

    // Use cookie token if body token not provided
    const tokenToUse = refreshToken || cookieRefreshToken;

    if (!tokenToUse) {
      return res.status(401).json({ error: 'Refresh token is required' });
    }

    const decoded = jwt.verify(tokenToUse, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // Generate new access token
    const { accessToken } = generateTokens(user._id);

    // Set new httpOnly cookie
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 2 * 60 * 60 * 1000, // 2 hours
      path: '/'
    });

    res.json({ 
      message: 'Token refreshed successfully',
      accessToken, // Include the new access token
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
};

// Logout user
const logout = async (req, res) => {
  try {
    // Get the token from the request
    const token = req.headers.authorization?.split(' ')[1];
    const cookieToken = req.cookies.accessToken;
    
    const tokenToUse = token || cookieToken;
    
    if (!tokenToUse) {
      return res.status(401).json({ error: 'No token provided' });
    }

    try {
      // Verify the token to ensure it's valid
      const decoded = jwt.verify(tokenToUse, process.env.JWT_SECRET);
      
      // Add token to blacklist
      await addToBlacklist(tokenToUse, decoded.userId);
      
      // Clear httpOnly cookies
      res.clearCookie('accessToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/'
      });
      
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/api/auth/refresh'
      });
      
      res.json({ 
        message: 'Logged out successfully',
        tokenInvalidated: true 
      });
    } catch (error) {
      // If token verification fails, still clear cookies
      res.clearCookie('accessToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/'
      });
      
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/api/auth/refresh'
      });
      
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

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    // Send reset email
    await sendEmail({
      to: email,
      subject: 'Password Reset Request',
      text: `Hi,\n\nWe received a request to reset your theFantasyF1game password.\n\nReset your password: ${resetUrl}\n\nIf you didn’t request this, you can safely ignore this email.\n\n— theFantasyF1game Team\nhttps://thefantasyf1game.com`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 24px; background-color: #f8f9fa; border-radius: 10px;">
          <div style="text-align: center; margin-bottom: 16px;">
            <img src="https://thefantasyf1game.com/App_Logo.png" alt="theFantasyF1game" style="max-width: 200px; height: auto;" />
          </div>
          <h2 style="color: #dc2626; text-align: center; margin-top: 0;">Password Reset Request</h2>
          <p>Hi,</p>
          <p>We received a request to reset your <b>theFantasyF1game</b> password.</p>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${resetUrl}" target="_blank" style="display: inline-block; padding: 12px 20px; background-color: #dc2626; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Reset your password
            </a>
          </div>
          <p>If you did not request this, you can safely ignore this email.</p>
          <p style="margin-top: 24px;">— theFantasyF1game Team</p>
          <p><a href="https://thefantasyf1game.com" target="_blank">www.thefantasyf1game.com</a></p>
        </div>
      `
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