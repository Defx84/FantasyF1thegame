const mongoose = require('mongoose');

const tokenBlacklistSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 } // Auto-delete expired tokens
  },
  blacklistedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
tokenBlacklistSchema.index({ token: 1 });
tokenBlacklistSchema.index({ userId: 1 });

module.exports = mongoose.model('TokenBlacklist', tokenBlacklistSchema);


