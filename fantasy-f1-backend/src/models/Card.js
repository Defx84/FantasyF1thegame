const mongoose = require('mongoose');

const cardSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['driver', 'team'],
    required: true
  },
  tier: {
    type: String,
    enum: ['gold', 'silver', 'bronze'],
    required: true
  },
  slotCost: {
    type: Number,
    required: true,
    min: 1,
    max: 4
  },
  effectType: {
    type: String,
    required: true
  },
  effectValue: {
    type: mongoose.Schema.Types.Mixed, // Can be number, string, or object
    default: null
  },
  description: {
    type: String,
    required: true
  },
  requiresTarget: {
    type: String,
    enum: ['player', 'driver', 'team', null],
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound unique index on name + type (allows same name for driver and team cards)
cardSchema.index({ name: 1, type: 1 }, { unique: true });

// Index for efficient queries
cardSchema.index({ type: 1, tier: 1 });
cardSchema.index({ isActive: 1 });

const Card = mongoose.model('Card', cardSchema);

module.exports = Card;

