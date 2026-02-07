const mongoose = require('mongoose');
const { normalizeDriver, normalizeTeam, F1_DRIVERS_2025, F1_TEAMS_2025 } = require('../../shared/normalization');
const UsedSelection = require('./UsedSelection');

// Helper function to normalize driver names (now uses shared)
function normalizeDriverName(name) {
  return normalizeDriver(name);
}

// Helper function to normalize team names (now uses shared)
function normalizeTeamName(name) {
  return normalizeTeam(name);
}

const basePointsSchema = new mongoose.Schema({
  mainDriverPoints: Number,
  reserveDriverPoints: Number,
  teamPoints: Number,
  total: Number
}, { _id: false });

const pointBreakdownSchema = new mongoose.Schema({
  mainDriver: String,
  reserveDriver: String,
  team: String,
  isSprintWeekend: Boolean,
  mainDriverPoints: Number,
  reserveDriverPoints: Number,
  teamPoints: Number,
  /** Points gained from driver card effects (driver+reserve final - base) for statistics */
  driverCardPoints: Number,
  /** Points gained from team card effects (team final - base) for statistics */
  teamCardPoints: Number,
  /** Base points before card effects (for debug and display) */
  basePoints: basePointsSchema
}, { _id: false });

const raceSelectionSchema = new mongoose.Schema({
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
  mainDriver: {
    type: String,
    default: null
  },
  reserveDriver: {
    type: String,
    default: null
  },
  team: {
    type: String,
    default: null
  },
  points: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['empty', 'user-submitted', 'admin-assigned', 'auto-assigned'],
    default: 'empty'
  },
  isAdminAssigned: {
    type: Boolean,
    default: false
  },
  /** True only when selection was auto-assigned due to missed deadline (Grid shows "Auto") */
  isAutoAssigned: {
    type: Boolean,
    default: false
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  assignedAt: {
    type: Date,
    default: null
  },
  notes: {
    type: String,
    default: ''
  },
  pointBreakdown: {
    type: pointBreakdownSchema,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index to ensure unique selections per user per race per league
raceSelectionSchema.index({ user: 1, race: 1, league: 1 }, { unique: true });

// Update timestamps and normalize names on save
raceSelectionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Normalize driver and team names
  if (this.isModified('mainDriver')) {
    this.mainDriver = normalizeDriverName(this.mainDriver);
  }
  if (this.isModified('reserveDriver')) {
    this.reserveDriver = normalizeDriverName(this.reserveDriver);
  }
  if (this.isModified('team')) {
    this.team = normalizeTeamName(this.team);
  }
  
  next();
});

// Validate that the assignedBy user is an admin of the league
raceSelectionSchema.pre('save', async function(next) {
  if (this.isAdminAssigned && !this.assignedBy) {
    throw new Error('Admin assignment requires assignedBy field');
  }

  if (this.isAdminAssigned) {
    const League = mongoose.model('League');
    const league = await League.findById(this.league).populate('members.user');
    
    if (!league) {
      throw new Error('League not found');
    }

    // Check if user is owner or admin member
    const isOwner = league.owner && this.assignedBy && league.owner.toString() === this.assignedBy.toString();
    const isAdminMember = league.members.some(member => 
      member.user && member.isAdmin && member.user.toString() === this.assignedBy.toString()
    );

    if (!isOwner && !isAdminMember) {
      throw new Error('Only league admins can assign selections');
    }

    this.assignedAt = new Date();
  }

  next();
});

const RaceSelection = mongoose.model('RaceSelection', raceSelectionSchema);

module.exports = RaceSelection; 