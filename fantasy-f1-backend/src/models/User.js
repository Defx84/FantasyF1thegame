const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const selectionSchema = new mongoose.Schema({
  round: {
    type: Number,
    required: true
  },
  mainDriver: {
    type: String,
    required: true
  },
  reserveDriver: {
    type: String,
    required: true
  },
  team: {
    type: String,
    required: true
  },
  isAdminAssigned: {
    type: Boolean,
    default: false
  }
});

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  isAppAdmin: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date
  },
  leagueSelections: [{
    leagueId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'League',
      required: true
    },
    selections: [selectionSchema]
  }],
  raceHistory: [{
    round: Number,
    points: Number,
    breakdown: {
      mainDriver: Number,
      reserveDriver: Number,
      team: Number
    }
  }],
  switcheroos: {
    remaining: {
      type: Number,
      default: 3
    },
    used: [{
      round: Number,
      date: Date,
      leagueId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'League'
      },
      originalDriver: String,
      newDriver: String
    }]
  }
}, {
  timestamps: true
});

// Helper method to get selections for a specific league and round
userSchema.methods.getSelections = function(leagueId, round) {
  const leagueSelection = this.leagueSelections.find(
    ls => ls.leagueId.toString() === leagueId.toString()
  );
  if (!leagueSelection) return null;
  
  return leagueSelection.selections.find(s => s.round === round);
};

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User; 