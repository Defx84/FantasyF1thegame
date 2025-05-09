const mongoose = require('mongoose');

const raceCalendarSchema = new mongoose.Schema({
  round: { 
    type: Number, 
    required: true,
    unique: true 
  },
  season: { 
    type: Number, 
    required: true 
  },
  raceName: { 
    type: String, 
    required: true 
  },
  circuit: { 
    type: String, 
    required: true 
  },
  country: { 
    type: String, 
    required: true 
  },
  raceStart: { 
    type: Date, 
    required: true 
  },
  date: { 
    type: Date, 
    required: true 
  },
  qualifyingStart: { 
    type: Date, 
    required: true 
  },
  isSprintWeekend: { 
    type: Boolean, 
    default: false 
  },
  sprintStart: { 
    type: Date 
  },
  sprintQualifyingStart: { 
    type: Date 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Update the updatedAt field before saving
raceCalendarSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const RaceCalendar = mongoose.model('RaceCalendar', raceCalendarSchema);

module.exports = RaceCalendar; 