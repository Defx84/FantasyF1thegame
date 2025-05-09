const RaceResult = require('../models/RaceResult');
const { handleError } = require('../utils/errorHandler');
const RaceResultBuilder = require('../services/raceResultBuilder');
const { subMinutes } = require('date-fns');
const League = require('../models/League');
const RaceCalendar = require('../models/RaceCalendar');
const RaceSelection = require('../models/RaceSelection');
const ScoringService = require('../services/ScoringService');
const LeaderboardService = require('../services/LeaderboardService');

/**
 * Check if selections should be visible for a race
 */
const shouldShowSelections = (race) => {
    const now = new Date();
    const lockTime = race.sprintQualifying 
        ? race.sprintQualifying
        : race.qualifyingStart;
    return now >= lockTime;
};

/**
 * Get next race timing information
 */
const getNextRaceTiming = async (req, res) => {
    console.log('🔍 getNextRaceTiming controller called');
    try {
        const now = new Date();
        console.log('Current time:', now);
        
        // Find the next upcoming race from RaceCalendar collection
        const nextRace = await RaceCalendar.findOne({
            qualifyingStart: { $gt: now }
        }).sort({ qualifyingStart: 1 });

        console.log('Query result:', nextRace ? {
            id: nextRace._id,
            raceName: nextRace.raceName,
            date: nextRace.date,
            status: nextRace.status
        } : 'No race found');

        if (!nextRace) {
            return res.status(404).json({ 
                message: 'No upcoming races found',
                hasUpcomingRace: false
            });
        }

        // Build the response for the frontend
        return res.json({
            hasUpcomingRace: true,
            raceName: nextRace.raceName,
            round: nextRace.round,
            isSprintWeekend: nextRace.isSprintWeekend,
            qualifying: {
                startTime: nextRace.qualifyingStart ? nextRace.qualifyingStart.toISOString() : null
            },
            sprintQualifying: nextRace.sprintQualifyingStart ? {
                startTime: nextRace.sprintQualifyingStart.toISOString()
            } : undefined,
            race: {
                startTime: nextRace.raceStart ? nextRace.raceStart.toISOString() : null
            }
        });
    } catch (error) {
        handleError(res, error);
    }
};

/**
 * Get current race status
 */
const getCurrentRaceStatus = async (req, res) => {
    try {
        const now = new Date();
        
        // Find the current or most recent race
        const currentRace = await RaceResult.findOne({
            $or: [
                { raceStart: { $lte: now }, raceEnd: { $gt: now } },
                { raceEnd: { $lt: now } }
            ]
        }).sort({ raceStart: -1 });

        if (!currentRace) {
            return res.status(404).json({ 
                message: 'No current race found',
                hasCurrentRace: false
            });
        }

        const statusInfo = {
            hasCurrentRace: true,
            raceName: currentRace.raceName,
            round: currentRace.round,
            status: currentRace.status,
            isComplete: currentRace.status === 'completed',
            lastUpdated: currentRace.updatedAt,
            selectionsVisible: shouldShowSelections(currentRace)
        };

        res.json(statusInfo);
    } catch (error) {
        handleError(res, error);
    }
};

/**
 * Get specific race status
 */
const getRaceStatus = async (req, res) => {
    try {
        const { round } = req.params;
        if (!round) {
            return res.status(400).json({ message: 'Round number is required' });
        }

        const race = await RaceCalendar.findOne({ round: parseInt(round) });
        if (!race) {
            return res.status(404).json({ message: 'Race not found' });
        }

        const now = new Date();
        const status = {
            raceId: race._id,
            round: race.round,
            raceName: race.raceName,
            circuit: race.circuit,
            country: race.country,
            date: race.date,
            isSprintWeekend: race.isSprintWeekend,
            deadlines: {
                selectionDeadline: race.qualifyingStart,
                switcherooDeadline: race.isSprintWeekend ? 
                    new Date(race.sprintStart.getTime() - 5 * 60000) : // 5 minutes before sprint
                    new Date(race.raceStart.getTime() - 5 * 60000), // 5 minutes before race
                raceStart: race.raceStart,
                sprintStart: race.sprintStart
            },
            isLocked: now >= race.qualifyingStart,
            isSwitcherooAllowed: now < (race.isSprintWeekend ? 
                new Date(race.sprintStart.getTime() - 5 * 60000) : 
                new Date(race.raceStart.getTime() - 5 * 60000)),
            timeUntil: {
                selectionDeadline: Math.max(0, race.qualifyingStart - now),
                switcherooDeadline: Math.max(0, (race.isSprintWeekend ? 
                    new Date(race.sprintStart.getTime() - 5 * 60000) : 
                    new Date(race.raceStart.getTime() - 5 * 60000)) - now),
                raceStart: Math.max(0, race.raceStart - now),
                sprintStart: race.sprintStart ? Math.max(0, race.sprintStart - now) : null
            }
        };

        res.json(status);
    } catch (error) {
        console.error('Error in getRaceStatus:', error);
        handleError(res, error);
    }
};

const updateRaceResults = async (req, res) => {
    try {
        const { round } = req.params;
        const { raceResults, teamResults, sprintResults, sprintTeamResults } = req.body;

        // Validate required fields
        if (!round || !raceResults || !teamResults) {
            return res.status(400).json({ 
                error: 'Missing required fields: round, raceResults, and teamResults are required' 
            });
        }

        // Get race info from RaceCalendar
        const raceCalendarEntry = await RaceCalendar.findOne({ round: parseInt(round) });
        if (!raceCalendarEntry) {
            return res.status(404).json({
                error: `Race not found in calendar for round ${round}`
            });
        }

        // Build race points aggregation
        const racePointsByTeam = {};
        raceResults.forEach(result => {
            if (!result.team) return;
            racePointsByTeam[result.team] = (racePointsByTeam[result.team] || 0) + (result.points || 0);
        });

        // Build sprint points aggregation if it's a sprint weekend
        const sprintPointsByTeam = {};
        if (raceCalendarEntry.isSprintWeekend && sprintResults) {
            sprintResults.forEach(result => {
                if (!result.team) return;
                sprintPointsByTeam[result.team] = (sprintPointsByTeam[result.team] || 0) + (result.points || 0);
            });
        }

        // Merge into final team results
        const teamNames = new Set([
            ...Object.keys(racePointsByTeam),
            ...Object.keys(sprintPointsByTeam)
        ]);

        const calculatedTeamResults = Array.from(teamNames).map(team => {
            const racePoints = racePointsByTeam[team] || 0;
            const sprintPoints = raceCalendarEntry.isSprintWeekend ? (sprintPointsByTeam[team] || 0) : 0;
            const totalPoints = racePoints + sprintPoints;

            return {
                team,
                racePoints,
                sprintPoints,
                totalPoints
            };
        });

        // Log team points calculation for verification
        console.log(`[Race Update] Team Points for Round ${round} (${raceCalendarEntry.raceName})`);
        console.log(`Sprint Weekend: ${raceCalendarEntry.isSprintWeekend}`);
        calculatedTeamResults.forEach(team => {
            console.log(`${team.team}: Race ${team.racePoints}, Sprint ${team.sprintPoints}, Total ${team.totalPoints}`);
        });

        // Update race result with all data
        const updateData = {
            results: raceResults,
            teamResults: calculatedTeamResults,
            sprintResults,
            isSprintWeekend: raceCalendarEntry.isSprintWeekend,
            status: 'completed',
            updatedAt: new Date()
        };

        // Update or create race result
        const updatedRace = await RaceResult.findOneAndUpdate(
            { round: parseInt(round) },
            { $set: updateData },
            { new: true, upsert: true }
        );

        // Find all leagues that have selections for this race
        const selections = await RaceSelection.find({ round: parseInt(round) })
            .distinct('league');

        // Initialize services
        const scoringService = new ScoringService();
        const leaderboardService = new LeaderboardService();

        // Update points and standings for each league
        for (const leagueId of selections) {
            // Get all selections for this league and race
            const leagueSelections = await RaceSelection.find({
                league: leagueId,
                round: parseInt(round)
            });

            // Calculate and update points for each selection
            for (const selection of leagueSelections) {
                const pointsData = scoringService.calculateRacePoints(
                    {
                        mainDriver: selection.mainDriver,
                        reserveDriver: selection.reserveDriver,
                        team: selection.team
                    },
                    updatedRace
                );

                // Update selection with points
                await RaceSelection.findByIdAndUpdate(selection._id, {
                    points: pointsData.totalPoints,
                    pointBreakdown: pointsData.breakdown
                });
            }

            // Update league standings
            await leaderboardService.updateStandings(leagueId, updatedRace._id);
        }

        res.json(updatedRace);
    } catch (error) {
        console.error('Error updating race results:', error);
        res.status(500).json({ error: 'Failed to update race results' });
    }
};

const getLeagueRaces = async (req, res) => {
    try {
        const { leagueId } = req.params;
        
        // Find the league to verify it exists
        const league = await League.findById(leagueId);
        if (!league) {
            return res.status(404).json({ message: 'League not found' });
        }

        // Get all races from the calendar
        const races = await RaceCalendar.find({})
            .select('raceName circuit country raceStart date round season')
            .sort({ date: 1 });

        res.json(races);
    } catch (error) {
        console.error('Error in getLeagueRaces:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Get race details by league ID and round number
 */
const getRaceByLeagueAndRound = async (req, res) => {
    try {
        const { leagueId, round } = req.params;
        
        // Find the league to verify it exists
        const league = await League.findById(leagueId);
        if (!league) {
            return res.status(404).json({ message: 'League not found' });
        }

        // Find the race by round number
        const race = await RaceCalendar.findOne({ round: parseInt(round) });
        if (!race) {
            return res.status(404).json({ message: 'Race not found' });
        }

        res.json({
            _id: race._id,
            raceName: race.raceName,
            circuit: race.circuit,
            country: race.country,
            date: race.date,
            round: race.round
        });
    } catch (error) {
        console.error('Error in getRaceByLeagueAndRound:', error);
        handleError(res, error);
    }
};

module.exports = {
  getRaceStatus,
  getNextRaceTiming,
  getCurrentRaceStatus,
  updateRaceResults,
  getLeagueRaces,
  getRaceByLeagueAndRound
}; 