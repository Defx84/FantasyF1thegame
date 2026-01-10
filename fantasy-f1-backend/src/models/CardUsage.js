const mongoose = require('mongoose');

const cardUsageSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  league: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'League',
    required: true
  },
  season: {
    type: Number,
    required: true
  },
  card: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Card',
    required: true
  },
  cardType: {
    type: String,
    enum: ['driver', 'team'],
    required: true
  },
  race: {
    type: Number, // round number
    required: true
  },
  usedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index to ensure one-time use per season
cardUsageSchema.index({ user: 1, league: 1, season: 1, card: 1 }, { unique: true });

// Index for efficient queries
cardUsageSchema.index({ user: 1, league: 1, season: 1, race: 1 });
cardUsageSchema.index({ user: 1, league: 1, season: 1, cardType: 1 });

const CardUsage = mongoose.model('CardUsage', cardUsageSchema);

module.exports = CardUsage;


