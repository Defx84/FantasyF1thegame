const mongoose = require('mongoose');

const driverRaceResultSchema = new mongoose.Schema({
    round: {
        type: Number,
        required: true
    },
    raceName: {
        type: String,
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
    mainRacePoints: {
        type: Number,
        default: 0
    },
    sprintPoints: {
        type: Number,
        default: 0
    },
    totalPoints: {
        type: Number,
        default: 0
    }
});

const constructorRaceResultSchema = new mongoose.Schema({
    round: {
        type: Number,
        required: true
    },
    raceName: {
        type: String,
        required: true
    },
    team: {
        type: String,
        required: true
    },
    mainRacePoints: {
        type: Number,
        default: 0
    },
    sprintPoints: {
        type: Number,
        default: 0
    },
    totalPoints: {
        type: Number,
        default: 0
    }
});

const driverStandingSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    username: {
        type: String,
        required: true
    },
    totalPoints: {
        type: Number,
        default: 0
    },
    raceResults: [driverRaceResultSchema]
});

const constructorStandingSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    username: {
        type: String,
        required: true
    },
    totalPoints: {
        type: Number,
        default: 0
    },
    raceResults: [constructorRaceResultSchema]
});

const leagueLeaderboardSchema = new mongoose.Schema({
    league: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'League',
        required: true
    },
    season: {
        type: Number,
        required: true
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    },
    driverStandings: [driverStandingSchema],
    constructorStandings: [constructorStandingSchema]
}, {
    timestamps: true
});

// Create compound index for efficient querying
leagueLeaderboardSchema.index({ league: 1, season: 1 }, { unique: true });

const LeagueLeaderboard = mongoose.model('LeagueLeaderboard', leagueLeaderboardSchema);

module.exports = LeagueLeaderboard; 