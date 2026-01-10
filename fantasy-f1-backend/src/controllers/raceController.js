const RaceResult = require('../models/RaceResult');
const { handleError } = require('../utils/errorHandler');
const RaceResultBuilder = require('../services/raceResultBuilder');
const { subMinutes } = require('date-fns');
const League = require('../models/League');
const RaceCalendar = require('../models/RaceCalendar');
const RaceSelection = require('../models/RaceSelection');
const ScoringService = require('../services/ScoringService');
const LeaderboardService = require('../services/LeaderboardService');
const AutoSelectionService = require('../services/AutoSelectionService');

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
 * Auto-assign selections for users who missed the deadline
 * This can be called manually or by a scheduled job
 */
const autoAssignMissedSelections = async (req, res) => {
    try {
        const { round } = req.params;
        const autoSelectionService = new AutoSelectionService();
        
        let result;
        if (round) {
            // Auto-assign for specific round
            result = await autoSelectionService.autoAssignSelectionsForRace(parseInt(round));
        } else {
            // Auto-assign for next race with passed deadline
            result = await autoSelectionService.autoAssignSelectionsForNextRace();
        }

        res.status(200).json(result);
    } catch (error) {
        console.error('Error in autoAssignMissedSelections:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error auto-assigning selections',
            error: error.message 
        });
    }
};

/**
 * Get next race timing information
 */
const getNextRaceTiming = async (req, res) => {
    console.log('🔍 getNextRaceTiming controller called');
    try {
        const now = new Date();
        console.log('Current time:', now);
        
        // Check if we should auto-assign selections for the current race
        // This runs in the background and doesn't block the response
        setImmediate(async () => {
            try {
                const autoSelectionService = new AutoSelectionService();
                await autoSelectionService.autoAssignSelectionsForNextRace();
            } catch (error) {
                console.error('[AutoSelection] Background auto-assignment error:', error);
                // Don't throw - this is a background process
            }
        });
        
        // Utility to calculate endOfWeekend (Sunday at 23:59)
        function getEndOfWeekend(raceDate) {
            const end = new Date(raceDate);
            end.setDate(end.getDate() + (7 - end.getDay()) % 7); // Move to Sunday if not already
            end.setHours(23, 59, 0, 0); // 23:59:00
            return end;
        }

        // Find the most recent season with future races (prioritize current/future seasons)
        const currentYear = new Date().getFullYear();
        const seasons = await RaceCalendar.distinct('season');
        const activeSeason = seasons
            .filter(s => s >= currentYear - 1) // Only consider current year or last year
            .sort((a, b) => b - a)[0]; // Get the most recent season
        
        const seasonFilter = activeSeason ? { season: activeSeason } : {};

        // 1. Find the most recent race whose qualifyingStart is in the past (for the active season)
        const currentRace = await RaceCalendar.findOne({ 
            ...seasonFilter,
            qualifyingStart: { $lte: now } 
        }).sort({ qualifyingStart: -1 });
        console.log('Current race found:', currentRace);
        if (currentRace) {
            const endOfWeekend = getEndOfWeekend(currentRace.raceStart || currentRace.date);
            if (now < endOfWeekend) {
                // Find the race result for this round to get the status
                let raceStatus = 'scheduled';
                const raceResult = await RaceResult.findOne({ 
                    round: currentRace.round,
                    season: currentRace.season 
                });
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

        // 2. Otherwise, find the next upcoming race (for the active season)
        const nextRace = await RaceCalendar.findOne({ 
            ...seasonFilter,
            qualifyingStart: { $gt: now } 
        }).sort({ qualifyingStart: 1 });
        console.log('Next race found:', nextRace);
        if (!nextRace) {
            console.log('No upcoming races found');
            return res.status(404).json({ 
                message: 'No upcoming races found',
                hasUpcomingRace: false
            });
        }
        let raceStatus = 'scheduled';
        const raceResult = await RaceResult.findOne({ 
            round: nextRace.round,
            season: nextRace.season 
        });
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
                raceStart: race.raceStart,
                sprintStart: race.sprintStart
            },
            isLocked: now >= race.qualifyingStart,
            timeUntil: {
                selectionDeadline: Math.max(0, race.qualifyingStart - now),
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

        // ENHANCED SAFEGUARD: Validate race results before setting status to completed
        if (!raceResults || raceResults.length === 0) {
            console.error(`[Race Update] ⚠️ Cannot set race to completed - no race results provided for round ${round}`);
            return res.status(400).json({ 
                error: 'Cannot complete race without race results' 
            });
        }

        if (!calculatedTeamResults || calculatedTeamResults.length === 0) {
            console.error(`[Race Update] ⚠️ Cannot set race to completed - no team results calculated for round ${round}`);
            return res.status(400).json({ 
                error: 'Cannot complete race without team results' 
            });
        }

        // Validate minimum expected results
        const expectedDriverCount = 20; // F1 has 20 drivers
        const expectedTeamCount = 10;   // F1 has 10 teams
        
        if (raceResults.length < expectedDriverCount) {
            console.warn(`[Race Update] ⚠️ Race results may be incomplete: ${raceResults.length} drivers (expected ${expectedDriverCount})`);
        }
        
        if (calculatedTeamResults.length < expectedTeamCount) {
            console.warn(`[Race Update] ⚠️ Team results may be incomplete: ${calculatedTeamResults.length} teams (expected ${expectedTeamCount})`);
        }

        console.log(`[Race Update] ✅ Race data validation passed. Setting status to completed.`);

        // Update race result with all data
        const updateData = {
            results: raceResults,
            teamResults: calculatedTeamResults,
            sprintResults,
            isSprintWeekend: raceCalendarEntry.isSprintWeekend,
            status: 'completed',
            season: raceCalendarEntry.season, // Ensure season is set
            updatedAt: new Date()
        };

        // Update or create race result
        // First try to find existing race result
        let updatedRace = await RaceResult.findOne({ 
            round: parseInt(round), 
            season: raceCalendarEntry.season 
        });

        if (updatedRace) {
            // Update existing race result
            Object.assign(updatedRace, updateData);
            await updatedRace.save(); // Use .save() to trigger post-save hooks
        } else {
            // Create new race result with all required fields
            updatedRace = new RaceResult({
                round: parseInt(round),
                season: raceCalendarEntry.season,
                raceName: raceCalendarEntry.raceName,
                circuit: raceCalendarEntry.circuit,
                country: raceCalendarEntry.country,
                date: raceCalendarEntry.date,
                raceStart: raceCalendarEntry.raceStart,
                qualifyingStart: raceCalendarEntry.qualifyingStart,
                ...updateData
            });
            await updatedRace.save(); // Use .save() to trigger post-save hooks
        }

        // Add logging for race status
        console.log(`[Race Update] Updated race ${updatedRace.raceName} (round ${round}, season ${updatedRace.season}) to status: ${updatedRace.status}`);

        // Find all leagues that have selections for this race (filter by season)
        const leagues = await require('../models/League').find({ season: raceCalendarEntry.season }).select('_id');
        const leagueIds = leagues.map(l => l._id);
        const selections = await RaceSelection.find({ 
            round: parseInt(round),
            league: { $in: leagueIds }
        }).distinct('league');

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
                    round: parseInt(round)
                });
                if (!selection) continue;
                
                // Skip empty selections (no drivers or team selected)
                if (!selection.mainDriver || !selection.reserveDriver || !selection.team) {
                    console.log(`[AutoAssign] Skipping ${member.username} - empty selection (no drivers/team selected)`);
                    continue;
                }
                
                // FIXED: Handle both 'empty' and 'user-submitted' statuses for automation
                if (!selection.pointBreakdown || selection.status === 'empty' || selection.status === 'user-submitted') {
                    console.log(`[AutoAssign] Processing selection for user ${member.username} (status: ${selection.status})`);
                    
                    // Get race card selection if season is 2026+
                    let raceCardSelection = null;
                    if (updatedRace.season >= 2026) {
                        const RaceCardSelection = require('../models/RaceCardSelection');
                        raceCardSelection = await RaceCardSelection.findOne({
                            user: member._id,
                            league: leagueId,
                            round: updatedRace.round
                        }).populate('driverCard teamCard');
                    }

                    const pointsData = await scoringService.calculateRacePoints({
                        mainDriver: selection.mainDriver,
                        reserveDriver: selection.reserveDriver,
                        team: selection.team
                    }, updatedRace, raceCardSelection, {
                        userId: member._id,
                        leagueId: leagueId
                    });
                    selection.points = pointsData.totalPoints;
                    selection.pointBreakdown = pointsData.breakdown;
                    selection.status = 'admin-assigned';
                    // Note: Not setting isAdminAssigned=true for automated assignments
                    // as it requires assignedBy field which we don't have for automated process
                    selection.assignedAt = new Date();
                    await selection.save();
                    updatedCount++;
                    console.log(`[AutoAssign] Assigned ${pointsData.totalPoints} points to user ${member.username}`);
                } else {
                    console.log(`[AutoAssign] Skipping user ${member.username} - points already assigned (status: ${selection.status})`);
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

        // Get races from the calendar filtered by the league's season
        const races = await RaceCalendar.find({ season: league.season })
            .select('raceName circuit country raceStart date round season isSprintWeekend qualifyingStart sprintStart sprintQualifyingStart')
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
  getRaceByLeagueAndRound,
  autoAssignMissedSelections
}; 