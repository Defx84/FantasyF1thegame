const mongoose = require('mongoose');

const leagueSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  season: {
    type: Number,
    required: true
  },
  seasonStatus: {
    type: String,
    enum: ['active', 'completed'],
    default: 'active'
  },
  finalStandings: {
    driverChampionship: {
      champion: {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        username: String,
        totalPoints: Number
      },
      second: {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        username: String,
        totalPoints: Number
      },
      third: {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        username: String,
        totalPoints: Number
      },
      standings: [{
        position: Number,
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        username: String,
        totalPoints: Number
      }]
    },
    constructorChampionship: {
      champion: {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        username: String,
        totalPoints: Number
      },
      second: {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        username: String,
        totalPoints: Number
      },
      third: {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        username: String,
        totalPoints: Number
      },
      standings: [{
        position: Number,
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        username: String,
        totalPoints: Number
      }]
    }
  },
  settings: {
    maxMembers: {
      type: Number,
      default: 20
    },
    scoringRules: {
      type: String,
      enum: ['standard', 'custom'],
      default: 'standard'
    }
  }
}, {
  timestamps: true
});

// Create index for efficient querying
leagueSchema.index({ owner: 1 });
leagueSchema.index({ members: 1 });
leagueSchema.index({ season: 1 });

const League = mongoose.model('League', leagueSchema);

module.exports = League; 