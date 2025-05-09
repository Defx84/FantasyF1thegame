const mongoose = require('mongoose');

// Mock User Schema
const userSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String
});

// Mock League Schema
const leagueSchema = new mongoose.Schema({
    name: String,
    description: String,
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

// Mock RaceResult Schema
const raceResultSchema = new mongoose.Schema({
    raceName: String,
    round: Number,
    date: Date,
    leagueId: { type: mongoose.Schema.Types.ObjectId, ref: 'League' },
    selections: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        driverId: mongoose.Schema.Types.ObjectId,
        points: Number
    }],
    results: [{
        driverId: mongoose.Schema.Types.ObjectId,
        position: Number,
        points: Number,
        didNotFinish: Boolean,
        didNotStart: Boolean,
        disqualified: Boolean
    }],
    sprintResults: [{
        driverId: mongoose.Schema.Types.ObjectId,
        position: Number,
        points: Number,
        didNotFinish: Boolean,
        didNotStart: Boolean,
        disqualified: Boolean
    }],
    teamResults: [{
        teamId: mongoose.Schema.Types.ObjectId,
        position: Number,
        points: Number
    }],
    status: {
        type: String,
        enum: ['scheduled', 'qualifying', 'sprint_qualifying', 'sprint', 'in_progress', 'completed', 'cancelled'],
        default: 'scheduled'
    },
    isSprintWeekend: {
        type: Boolean,
        default: false
    }
});

// Mock Leaderboard Schema
const leaderboardSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    points: Number,
    position: Number
});

// Mock LeagueLeaderboard Schema
const leagueLeaderboardSchema = new mongoose.Schema({
    leagueId: { type: mongoose.Schema.Types.ObjectId, ref: 'League' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    points: Number,
    position: Number
});

// Create and export models
const User = mongoose.model('User', userSchema);
const League = mongoose.model('League', leagueSchema);
const RaceResult = mongoose.model('RaceResult', raceResultSchema);
const Leaderboard = mongoose.model('Leaderboard', leaderboardSchema);
const LeagueLeaderboard = mongoose.model('LeagueLeaderboard', leagueLeaderboardSchema);

module.exports = {
    User,
    League,
    RaceResult,
    Leaderboard,
    LeagueLeaderboard
}; 