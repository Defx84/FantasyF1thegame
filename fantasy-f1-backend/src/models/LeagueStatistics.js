const mongoose = require('mongoose');

const headToHeadRecordSchema = new mongoose.Schema({
    opponentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    wins: {
        type: Number,
        default: 0
    },
    losses: {
        type: Number,
        default: 0
    },
    totalPoints: {
        type: Number,
        default: 0
    },
    opponentTotalPoints: {
        type: Number,
        default: 0
    },
    pointsDifference: {
        type: Number,
        default: 0
    },
    averagePointsDifference: {
        type: Number,
        default: 0
    },
    racesCompared: {
        type: Number,
        default: 0
    },
    bestRaceDifference: {
        type: Number,
        default: 0
    },
    worstRaceDifference: {
        type: Number,
        default: 0
    }
});

const leagueStatisticsSchema = new mongoose.Schema({
    leagueId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'League',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    totalPoints: {
        type: Number,
        default: 0
    },
    racesParticipated: {
        type: Number,
        default: 0
    },
    averagePointsPerRace: {
        type: Number,
        default: 0
    },
    highestPointsInRace: {
        type: Number,
        default: 0
    },
    highestPointsRaceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Race'
    },
    successRate: {
        type: Number,
        default: 0
    },
    consistencyRating: {
        type: Number,
        default: 0,
        min: 0,
        max: 10
    },
    pointsStandardDeviation: {
        type: Number,
        default: 0
    },
    headToHeadRecords: [headToHeadRecordSchema],
    comebackRating: {
        type: Number,
        default: 0,
        min: 0,
        max: 10
    },
    recoveryStats: {
        belowAverageRaces: {
            type: Number,
            default: 0
        },
        successfulRecoveries: {
            type: Number,
            default: 0
        },
        averageRecoveryPoints: {
            type: Number,
            default: 0
        }
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Compound index for efficient querying
leagueStatisticsSchema.index({ leagueId: 1, userId: 1 }, { unique: true });

const LeagueStatistics = mongoose.model('LeagueStatistics', leagueStatisticsSchema);

module.exports = LeagueStatistics; 