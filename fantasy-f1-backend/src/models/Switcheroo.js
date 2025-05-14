const mongoose = require('mongoose');

const switcherooSchema = new mongoose.Schema({
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
    ref: 'RaceResult',
    required: true
  },
  originalDriver: {
    type: String,
    required: true
  },
  newDriver: {
    type: String,
    required: true
  },
  timeUsed: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient querying of switcheroos by user and league
switcherooSchema.index({ user: 1, league: 1 });

const Switcheroo = mongoose.model('Switcheroo', switcherooSchema);

module.exports = Switcheroo; 