const mongoose = require('mongoose');

const raceCardSelectionSchema = new mongoose.Schema({
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
  race: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RaceCalendar',
    required: true
  },
  round: {
    type: Number,
    required: true
  },
  driverCard: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Card',
    default: null
  },
  teamCard: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Card',
    default: null
  },
  // Special card targets
  targetPlayer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // For Mirror (driver) and Espionage (team) cards
  },
  targetDriver: {
    type: String,
    default: null // For Switcheroo card
  },
  targetTeam: {
    type: String,
    default: null // For Espionage card
  },
  // Mystery/Random card transformations (determined at activation time)
  mysteryTransformedCard: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Card',
    default: null // For Mystery Card (driver) - stores what it transformed into
  },
  randomTransformedCard: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Card',
    default: null // For Random card (team) - stores what it transformed into
  },
  selectedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index to ensure one card selection per race
raceCardSelectionSchema.index({ user: 1, league: 1, race: 1 }, { unique: true });

// Index for efficient queries
raceCardSelectionSchema.index({ user: 1, league: 1, round: 1 });
raceCardSelectionSchema.index({ race: 1 });

const RaceCardSelection = mongoose.model('RaceCardSelection', raceCardSelectionSchema);

module.exports = RaceCardSelection;

