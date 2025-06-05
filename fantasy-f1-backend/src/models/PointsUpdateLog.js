const mongoose = require('mongoose');

const pointsUpdateLogSchema = new mongoose.Schema({
  round: {
    type: Number,
    required: true
  },
  raceName: {
    type: String,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  leagueId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'League',
    required: true
  },
  points: {
    type: Number,
    required: true
  },
  pointBreakdown: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  updateReason: {
    type: String,
    enum: ['initial', 'scraper_update', 'admin_update'],
    required: true
  }
}, {
  timestamps: true
});

// Indexes for faster queries
pointsUpdateLogSchema.index({ round: 1 });
pointsUpdateLogSchema.index({ userId: 1 });
pointsUpdateLogSchema.index({ leagueId: 1 });
pointsUpdateLogSchema.index({ createdAt: 1 });

const PointsUpdateLog = mongoose.model('PointsUpdateLog', pointsUpdateLogSchema);

module.exports = PointsUpdateLog; 