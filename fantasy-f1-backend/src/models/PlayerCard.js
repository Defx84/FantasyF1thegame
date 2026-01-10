const mongoose = require('mongoose');

const playerCardSchema = new mongoose.Schema({
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
  selected: {
    type: Boolean,
    default: false // true if part of player's 8-card (driver) or 6-card (team) deck
  }
}, {
  timestamps: true
});

// Compound index to ensure unique card per user/league/season
playerCardSchema.index({ user: 1, league: 1, season: 1, card: 1 }, { unique: true });

// Index for efficient queries
playerCardSchema.index({ user: 1, league: 1, season: 1, selected: 1 });
playerCardSchema.index({ user: 1, league: 1, season: 1, cardType: 1, selected: 1 });

const PlayerCard = mongoose.model('PlayerCard', playerCardSchema);

module.exports = PlayerCard;

