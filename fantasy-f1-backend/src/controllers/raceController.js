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
        
        // Utility to calculate endOfWeekend (Sunday at 23:59)
        function getEndOfWeekend(raceDate) {
            const end = new Date(raceDate);
            end.setDate(end.getDate() + (7 - end.getDay()) % 7); // Move to Sunday if not already
            end.setHours(23, 59, 0, 0); // 23:59:00
            return end;
        }

        // 1. Find the most recent race whose qualifyingStart is in the past
        const currentRace = await RaceCalendar.findOne({ qualifyingStart: { $lte: now } }).sort({ qualifyingStart: -1 });
        console.log('Current race found:', currentRace);
        if (currentRace) {
            const endOfWeekend = getEndOfWeekend(currentRace.raceStart || currentRace.date);
            if (now < endOfWeekend) {
                // Find the race result for this round to get the status
                let raceStatus = 'scheduled';
                const raceResult = await RaceResult.findOne({ round: currentRace.round });
                if (raceResult && raceResult.status) {
                    raceStatus = raceResult.status;
                }
                console.log('Returning current race:', currentRace.raceName, 'Status:', raceStatus);
                return res.json({
                    hasUpcomingRace: true,
                    raceName: currentRace.raceName,
                    round: currentRace.round,
                    season: currentRace.season,
                    qualifying: {
                        startTime: currentRace.qualifyingStart,
                        timeUntil: Math.max(0, new Date(currentRace.qualifyingStart).getTime() - now.getTime())
                    },
                    race: {
                        startTime: currentRace.raceStart,
                        timeUntil: Math.max(0, new Date(currentRace.raceStart).getTime() - now.getTime())
                    },
                    sprintQualifying: currentRace.sprintQualifyingStart ? {
                        startTime: currentRace.sprintQualifyingStart,
                        timeUntil: Math.max(0, new Date(currentRace.sprintQualifyingStart).getTime() - now.getTime())
                    } : undefined,
                    sprint: currentRace.sprintStart ? {
                        startTime: currentRace.sprintStart,
                        timeUntil: Math.max(0, new Date(currentRace.sprintStart).getTime() - now.getTime())
                    } : undefined,
                    isSprintWeekend: currentRace.isSprintWeekend,
                    status: raceStatus,
                    endOfWeekend: endOfWeekend
                });
            }
            // If now >= endOfWeekend, fall through to nextRace logic below
        }

        // 2. Otherwise, find the next upcoming race
        const nextRace = await RaceCalendar.findOne({ qualifyingStart: { $gt: now } }).sort({ qualifyingStart: 1 });
        console.log('Next race found:', nextRace);
        if (!nextRace) {
            console.log('No upcoming races found');
            return res.status(404).json({ 
                message: 'No upcoming races found',
                hasUpcomingRace: false
            });
        }
        let raceStatus = 'scheduled';
        const raceResult = await RaceResult.findOne({ round: nextRace.round });
        if (raceResult && raceResult.status) {
            raceStatus = raceResult.status;
        }
        const endOfWeekend = getEndOfWeekend(nextRace.raceStart || nextRace.date);
        console.log('Returning next race:', nextRace.raceName, 'Status:', raceStatus);
        return res.json({
            hasUpcomingRace: true,
            raceName: nextRace.raceName,
            round: nextRace.round,
            season: nextRace.season,
            qualifying: {
                startTime: nextRace.qualifyingStart,
                timeUntil: Math.max(0, new Date(nextRace.qualifyingStart).getTime() - now.getTime())
            },
            race: {
                startTime: nextRace.raceStart,
                timeUntil: Math.max(0, new Date(nextRace.raceStart).getTime() - now.getTime())
            },
            sprintQualifying: nextRace.sprintQualifyingStart ? {
                startTime: nextRace.sprintQualifyingStart,
                timeUntil: Math.max(0, new Date(nextRace.sprintQualifyingStart).getTime() - now.getTime())
            } : undefined,
            sprint: nextRace.sprintStart ? {
                startTime: nextRace.sprintStart,
                timeUntil: Math.max(0, new Date(nextRace.sprintStart).getTime() - now.getTime())
            } : undefined,
            isSprintWeekend: nextRace.isSprintWeekend,
            status: raceStatus,
            endOfWeekend: endOfWeekend
        });
    } catch (error) {
        console.error('Error in getNextRaceTiming:', error);
        res.status(500).json({ message: 'Internal server error' });
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

        // Add logging for race status
        console.log(`[Race Update] Updated race ${updatedRace.raceName} (round ${round}) to status: ${updatedRace.status}`);

        // Find all leagues that have selections for this race
        const selections = await RaceSelection.find({ round: parseInt(round) })
            .distinct('league');

        // Initialize services
        const scoringService = new ScoringService();
        const leaderboardService = new LeaderboardService();

        // AUTOMATION: Assign real points to all users in all leagues for this round
        let totalUpdated = 0;
        for (const leagueId of selections) {
            const league = await require('../models/League').findById(leagueId).populate('members');
            if (!league) {
                console.error(`[AutoAssign] League not found: ${leagueId}`);
                continue;
            }
            let updatedCount = 0;
            for (const member of league.members) {
                let selection = await RaceSelection.findOne({
                    user: member._id,
                league: leagueId,
                    race: updatedRace._id
                });
                if (!selection) continue;
                if (!selection.pointBreakdown || selection.status === 'empty') {
                    const pointsData = scoringService.calculateRacePoints({
                        mainDriver: selection.mainDriver,
                        reserveDriver: selection.reserveDriver,
                        team: selection.team
                    }, updatedRace);
                    selection.points = pointsData.totalPoints;
                    selection.pointBreakdown = pointsData.breakdown;
                    selection.status = 'admin-assigned';
                    selection.isAdminAssigned = true;
                    selection.assignedAt = new Date();
                    await selection.save();
                    updatedCount++;
                }
            }
            await leaderboardService.updateStandings(leagueId);
            console.log(`[AutoAssign] Assigned real points to ${updatedCount} users in league ${league.name} for round ${round}`);
            totalUpdated += updatedCount;
        }
        console.log(`[AutoAssign] Total users updated for round ${round}: ${totalUpdated}`);

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