const RaceSelection = require('../models/RaceSelection');
const RaceResult = require('../models/RaceResult');
const League = require('../models/League');
const UsedSelection = require('../models/UsedSelection');
const { shouldShowSelections } = require('./raceController');
const { handleError } = require('../utils/errorHandler');
const { normalizedDrivers, normalizedTeams, isValidDriver, isValidTeam, normalizeDriver, normalizeTeam } = require('../utils/validation');
const { checkTeamReuse, checkDriverReuse } = require('../utils/selectionHelpers');
const RaceCalendar = require('../models/RaceCalendar');
const { initializeRaceSelections, initializeAllRaceSelections } = require('../utils/raceUtils');
const ScoringService = require('../services/ScoringService');
const LeaderboardService = require('../services/LeaderboardService');
const { getF1Validation } = require('../constants/f1DataLoader');

// Initialize services
const scoringService = new ScoringService();
const leaderboardService = new LeaderboardService();

/**
 * Get selections for a race
 */
const getRaceSelections = async (req, res) => {
    try {
        const { leagueId, round } = req.params;
        
        // Validate required parameters
        if (!leagueId || !round) {
            console.error("Missing leagueId or round in request params");
            return res.status(400).json({ 
                error: "Missing leagueId or round" 
            });
        }

        // Check if user is authenticated
        if (!req.user || !req.user._id) {
            console.error('User not authenticated');
            return res.status(401).json({ 
                error: 'Authentication required' 
            });
        }

        // Get league and verify membership/admin status
        const league = await League.findById(leagueId).lean();
        if (!league) {
            console.error('League not found:', leagueId);
            return res.status(404).json({ 
                error: 'League not found' 
            });
        }

        const isMember = league.members.some(member => 
            member.toString() === req.user._id.toString()
        );
        const isAdmin = league.owner?.toString?.() === req.user._id.toString();

        if (!isMember && !isAdmin) {
            console.error('User not authorized:', req.user._id);
            return res.status(403).json({ 
                error: 'You must be a member of this league to view selections' 
            });
        }

        // Get race details
        const race = await RaceCalendar.findOne({ round: parseInt(round) });
        if (!race) {
            console.error('Race not found for round:', round);
            return res.status(404).json({ 
                error: `Race not found for round ${round}` 
            });
        }

        // Initialize selections if they don't exist
        await initializeRaceSelections(leagueId, race._id, parseInt(round));

        // Get all selections for this race
        const selections = await RaceSelection.find({
            league: leagueId,
            race: race._id
        })
        .populate('user', 'username')
        .populate('assignedBy', 'username')
        .lean();

        // Format selections for frontend
        const formattedSelections = selections
          .filter(selection => selection.user)
          .map(selection => ({
            _id: selection._id,
            userId: selection.user._id,
            username: selection.user.username,
            mainDriver: selection.mainDriver,
            reserveDriver: selection.reserveDriver,
            team: selection.team,
            points: selection.points,
            status: selection.status,
            isAdminAssigned: selection.isAdminAssigned,
            assignedBy: selection.assignedBy?.username,
            assignedAt: selection.assignedAt,
            notes: selection.notes
        }));

        return res.json({
            race,
            selections: formattedSelections,
            isAdmin
        });

    } catch (error) {
        console.error('Error in getRaceSelections:', error);
        return res.status(500).json({ 
            error: 'Internal server error while fetching race selections',
            details: error.message
        });
    }
};

/**
 * Get used selections for a user
 * Updated to implement reset logic for teams and drivers
 */
const getUsedSelections = async (req, res) => {
    try {
        const { leagueId, round, userId } = req.query;
        const numericRound = parseInt(round);
        const targetUserId = userId || req.user._id; // Use provided userId or current user's id

        // If requesting another user's selections, verify admin status
        if (userId && userId !== req.user._id.toString()) {
            const league = await League.findById(leagueId);
            if (!league) {
                return res.status(404).json({ message: 'League not found' });
            }

            const isAdmin = league.owner?.toString() === req.user._id.toString() || 
                          league.members.some(member => 
                            member.user?.toString() === req.user._id.toString() && 
                            member.isAdmin
                          );

            if (!isAdmin) {
                return res.status(403).json({ message: 'Not authorized to view other users\' selections' });
            }
        }

        // Get or create UsedSelection document for this user and league
        let usedSelection = await UsedSelection.findOne({
            user: targetUserId,
            league: leagueId
        });

        if (!usedSelection) {
            // Create new UsedSelection document if it doesn't exist
            usedSelection = new UsedSelection({
                user: targetUserId,
                league: leagueId,
                teamCycles: [[]],
                driverCycles: [[]],
                // Legacy fields for migration compatibility
                mainDriverCycles: [[]],
                reserveDriverCycles: [[]]
            });
            await usedSelection.save();
        }

        // Get the current cycle's used items
        const lastTeamCycleIndex = usedSelection.teamCycles.length - 1;
        const lastDriverCycleIndex = usedSelection.driverCycles ? usedSelection.driverCycles.length - 1 : -1;
        
        // Legacy: fallback to old fields if driverCycles doesn't exist (migration compatibility)
        const lastMainDriverCycleIndex = usedSelection.mainDriverCycles ? usedSelection.mainDriverCycles.length - 1 : -1;
        const lastReserveDriverCycleIndex = usedSelection.reserveDriverCycles ? usedSelection.reserveDriverCycles.length - 1 : -1;

        const usedTeams = usedSelection.teamCycles[lastTeamCycleIndex] || [];
        
        // Use unified driverCycles if available, otherwise fallback to legacy fields
        let usedDrivers = [];
        if (usedSelection.driverCycles && usedSelection.driverCycles.length > 0) {
            usedDrivers = usedSelection.driverCycles[lastDriverCycleIndex] || [];
        } else {
            // Migration: merge old cycles if driverCycles doesn't exist yet
            const usedMainDrivers = usedSelection.mainDriverCycles[lastMainDriverCycleIndex] || [];
            const usedReserveDrivers = usedSelection.reserveDriverCycles[lastReserveDriverCycleIndex] || [];
            // Combine and deduplicate
            usedDrivers = [...new Set([...usedMainDrivers, ...usedReserveDrivers])];
        }

        res.json({
            usedDrivers: usedDrivers, // New unified field
            usedTeams: usedTeams,
            // Legacy fields for backward compatibility during migration
            usedMainDrivers: usedSelection.mainDriverCycles?.[lastMainDriverCycleIndex] || [],
            usedReserveDrivers: usedSelection.reserveDriverCycles?.[lastReserveDriverCycleIndex] || []
        });
    } catch (error) {
        console.error('Error getting used selections:', error);
        res.status(500).json({ message: 'Error getting used selections' });
    }
};

/**
 * Get current selections for the next race
 */
const getCurrentSelections = async (req, res) => {
    try {
        const { leagueId, round } = req.query;
        if (!leagueId) {
            return res.status(400).json({ error: 'League ID is required' });
        }
        let roundNumber = round ? parseInt(round) : null;
        let raceQuery = {};
        if (roundNumber) {
            raceQuery = { round: roundNumber };
        } else {
            // Fallback to next race by date
            const now = new Date();
            raceQuery = { date: { $gt: now } };
        }
        const race = await RaceCalendar.findOne(raceQuery).sort({ date: 1 });
        if (!race) {
            return res.json({ mainDriver: null, reserveDriver: null, team: null });
        }
        const selection = await RaceSelection.findOne({
            user: req.user._id,
            league: leagueId,
            round: race.round
        }).lean();
        if (!selection) {
            return res.json({ mainDriver: null, reserveDriver: null, team: null });
        }
        const response = {
            _id: selection._id,
            mainDriver: selection.mainDriver,
            reserveDriver: selection.reserveDriver,
            team: selection.team
        };
        res.json(response);
    } catch (error) {
        console.error('Error in getCurrentSelections:', error);
        handleError(res, error);
    }
};

/**
 * Save selections for the current user
 */
const saveSelections = async (req, res) => {
    try {
        const { leagueId, mainDriver, reserveDriver, team } = req.body;

        // Validate required fields
        if (!leagueId) {
            return res.status(400).json({ 
                error: 'League ID is required' 
            });
        }

        if (!mainDriver || !reserveDriver || !team) {
            return res.status(400).json({ 
                error: 'Main driver, reserve driver, and team are required' 
            });
        }

        // Check if user is a member of the league (need league first to get season)
        const league = await League.findById(leagueId);
        if (!league) {
            return res.status(404).json({ 
                error: 'League not found' 
            });
        }

        const isMember = league.members.some(member => 
            member.toString() === req.user._id.toString()
        );

        if (!isMember && league.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ 
                error: 'You must be a member of this league to save selections' 
            });
        }

        // Get the next race to determine the round number
        // IMPORTANT: Filter by league season to ensure we get the correct race (2026, not 2025)
        const now = new Date();
        const nextRace = await RaceCalendar.findOne({
            season: league.season,
            date: { $gt: now }
        }).sort({ date: 1 });

        if (!nextRace) {
            return res.status(404).json({ 
                error: 'No upcoming races found for this season' 
            });
        }

        const round = nextRace.round;

        // Get season-aware validation functions
        const { normalizeDriverName, normalizeTeamName, isValidDriver: isValidDriverSeason, isValidTeam: isValidTeamSeason } = getF1Validation(league.season);

        // Normalize the incoming data using season-aware functions
        // Handle potential null/undefined inputs
        let normalizedMainDriver, normalizedReserveDriver, normalizedTeam;
        try {
            normalizedMainDriver = normalizeDriverName(mainDriver);
            normalizedReserveDriver = normalizeDriverName(reserveDriver);
            normalizedTeam = normalizeTeamName(team);
        } catch (error) {
            console.error('Error normalizing driver/team names:', error);
            return res.status(400).json({ 
                error: 'Error normalizing driver or team names',
                details: error.message
            });
        }

        // Validate normalized names using season-aware validation
        if (!normalizedMainDriver || !normalizedReserveDriver || !normalizedTeam) {
            return res.status(400).json({ 
                error: 'Invalid driver or team selection - could not normalize names',
                details: {
                    mainDriver: normalizedMainDriver || 'null',
                    reserveDriver: normalizedReserveDriver || 'null',
                    team: normalizedTeam || 'null'
                }
            });
        }

        if (!isValidDriverSeason(normalizedMainDriver) || !isValidDriverSeason(normalizedReserveDriver) || !isValidTeamSeason(normalizedTeam)) {
            return res.status(400).json({ 
                error: 'Invalid driver or team selection',
                details: {
                    mainDriver: normalizedMainDriver,
                    reserveDriver: normalizedReserveDriver,
                    team: normalizedTeam,
                    season: league.season
                }
            });
        }

        // Check if selections can still be made
        const raceDateMs = new Date(nextRace.date).getTime();
        if (Date.now() >= raceDateMs) {
            return res.status(400).json({ 
                error: 'Selections can no longer be made for this race' 
            });
        }

        // Check for existing selections
        let selection = await RaceSelection.findOne({
            league: leagueId,
            round: parseInt(round),
            user: req.user._id
        });

        let oldSelections = null;
        if (selection) {
            // Store old selections before updating - NORMALIZE THEM using season-aware functions
            // Handle potential null/undefined values from existing selection
            try {
                oldSelections = {
                    mainDriver: selection.mainDriver ? normalizeDriverName(selection.mainDriver) : null,
                    reserveDriver: selection.reserveDriver ? normalizeDriverName(selection.reserveDriver) : null,
                    team: selection.team ? normalizeTeamName(selection.team) : null
                };
            } catch (error) {
                console.error('Error normalizing old selections:', error);
                // If normalization fails for old selections, just use the raw values
                oldSelections = {
                    mainDriver: selection.mainDriver,
                    reserveDriver: selection.reserveDriver,
                    team: selection.team
                };
            }
            
            // Update existing selection
            selection.mainDriver = normalizedMainDriver;
            selection.reserveDriver = normalizedReserveDriver;
            selection.team = normalizedTeam;
            selection.updatedAt = new Date();
        } else {
            // Create new selection
            selection = new RaceSelection({
                user: req.user._id,
                league: leagueId,
                race: nextRace._id,
                round: parseInt(round),
                mainDriver: normalizedMainDriver,
                reserveDriver: normalizedReserveDriver,
                team: normalizedTeam,
                status: 'user-submitted',
                createdAt: new Date()
            });
        }

        await selection.save();

        // Update UsedSelection cycles
        let usedSelection = await UsedSelection.findOne({
            user: req.user._id,
            league: leagueId
        });

        // Validate that main and reserve drivers are different
        if (normalizedMainDriver === normalizedReserveDriver) {
            return res.status(400).json({ 
                error: 'Main driver and reserve driver cannot be the same' 
            });
        }

        if (!usedSelection) {
            usedSelection = new UsedSelection({
                user: req.user._id,
                league: leagueId,
                teamCycles: [[]],
                driverCycles: [[]],
                // Legacy fields for migration compatibility
                mainDriverCycles: [[]],
                reserveDriverCycles: [[]]
            });
        }

        // If updating existing selection, remove old selections first
        if (oldSelections) {
            console.log(`[saveSelections] Removing old selections: ${oldSelections.mainDriver}, ${oldSelections.reserveDriver}, ${oldSelections.team}`);
            // Only remove if the driver is different from the new selection
            if (oldSelections.mainDriver !== normalizedMainDriver) {
                await usedSelection.removeUsedDriver(oldSelections.mainDriver);
            }
            if (oldSelections.reserveDriver !== normalizedReserveDriver) {
                await usedSelection.removeUsedDriver(oldSelections.reserveDriver);
            }
            await usedSelection.removeUsedTeam(oldSelections.team);
        }

        // Add the new selections (using unified method - both drivers share same cycle)
        console.log(`[saveSelections] Adding new selections: ${normalizedMainDriver}, ${normalizedReserveDriver}, ${normalizedTeam}`);
        await usedSelection.addUsedDriver(normalizedMainDriver);
        await usedSelection.addUsedDriver(normalizedReserveDriver);
        await usedSelection.addUsedTeam(normalizedTeam);

        await usedSelection.save();

        return res.json({
            message: 'Selections saved successfully',
            selection
        });
    } catch (error) {
        console.error('Error in saveSelections:', error);
        return res.status(500).json({ 
            error: 'Internal server error while saving selections' 
        });
    }
};

/**
 * Admin override for selections
 */
const adminOverrideSelection = async (req, res) => {
    try {
        const { leagueId, userId, raceId, mainDriver, reserveDriver, team, assignPoints, notes } = req.body;

        // Validate required fields
        if (!leagueId || !userId || !raceId || !mainDriver || !reserveDriver || !team) {
            return res.status(400).json({ 
                error: 'All required fields must be provided' 
            });
        }

        // Check if user is an admin of the league
        const league = await League.findById(leagueId);
        if (!league) {
            return res.status(404).json({ 
                error: 'League not found' 
            });
        }

        // Check if user is owner or admin member
        const isOwner = league.owner && req.user._id && league.owner.toString() === req.user._id.toString();
        const isAdminMember = league.members.some(member => 
            member.user && member.isAdmin && member.user.toString() === req.user._id.toString()
        );
        
        if (!isOwner && !isAdminMember) {
            return res.status(403).json({ 
                error: 'Only league admins can override selections' 
            });
        }

        // Get race details
        const race = await RaceCalendar.findById(raceId);
        if (!race) {
            return res.status(404).json({ 
                error: 'Race not found' 
            });
        }

        // Check if selections can be reused
        // Bypassing the 'already used' check for admin override
        console.log('Bypassing used selection check for admin override');

        // Calculate points if assignPoints is true
        let points = 0;
        let pointBreakdown = null;
        
        if (assignPoints) {
            // Get race results and calculate points
            const raceResult = await RaceResult.findOne({ round: race.round });
            if (raceResult) {
                // Get race card selection if season is 2026+
                let raceCardSelection = null;
                if (raceResult.season >= 2026) {
                    const RaceCardSelection = require('../models/RaceCardSelection');
                    raceCardSelection = await RaceCardSelection.findOne({
                        user: req.user._id,
                        league: leagueId,
                        round: race.round
                    }).populate('driverCard teamCard');
                }

                const pointsData = await scoringService.calculateRacePoints(
                    { mainDriver, reserveDriver, team },
                    raceResult,
                    raceCardSelection,
                    { userId: req.user._id, leagueId: leagueId }
                );
                points = pointsData.totalPoints;
                pointBreakdown = pointsData.breakdown;
            }
        } else {
            // Create default pointBreakdown structure when assignPoints is false
            pointBreakdown = {
                mainDriver,
                reserveDriver,
                team,
                mainDriverPoints: 0,
                reserveDriverPoints: 0,
                teamPoints: 0,
                isSprintWeekend: false,
                mainDriverStatus: 'FINISHED'
            };
        }

        // Find or create selection
        let selection = await RaceSelection.findOne({
            user: userId,
            league: leagueId,
            race: raceId
        });

        // Get season-aware validation functions
        const { normalizeDriverName, normalizeTeamName } = getF1Validation(league.season);

        let oldSelections = null;
        if (!selection) {
            // Create new selection
            selection = new RaceSelection({
                user: userId,
                league: leagueId,
                race: raceId,
                round: race.round,
                mainDriver,
                reserveDriver,
                team,
                points,
                status: 'admin-assigned',
                isAdminAssigned: true,
                assignedBy: req.user._id,
                assignedAt: new Date(),
                notes,
                pointBreakdown
            });
        } else {
            // Store old selections before updating - NORMALIZE THEM using season-aware functions
            oldSelections = {
                mainDriver: normalizeDriverName(selection.mainDriver),
                reserveDriver: normalizeDriverName(selection.reserveDriver),
                team: normalizeTeamName(selection.team)
            };
            
            // Update existing selection
            selection.mainDriver = mainDriver;
            selection.reserveDriver = reserveDriver;
            selection.team = team;
            selection.points = points;
            selection.status = 'admin-assigned';
            selection.isAdminAssigned = true;
            selection.assignedBy = req.user._id;
            selection.assignedAt = new Date();
            selection.notes = notes;
            selection.pointBreakdown = pointBreakdown;
        }

        await selection.save();

        // Update usage tracking
        let usedSelection = await UsedSelection.findOne({
            user: userId,
            league: leagueId
        });

        if (!usedSelection) {
            usedSelection = new UsedSelection({
                user: userId,
                league: leagueId,
                teamCycles: [[]],
                driverCycles: [[]],
                // Legacy fields for migration compatibility
                mainDriverCycles: [[]],
                reserveDriverCycles: [[]]
            });
        }

        // Validate that main and reserve drivers are different using season-aware normalization
        const normalizedMain = normalizeDriverName(mainDriver);
        const normalizedReserve = normalizeDriverName(reserveDriver);
        if (normalizedMain === normalizedReserve) {
            return res.status(400).json({ 
                error: 'Main driver and reserve driver cannot be the same' 
            });
        }

        // If updating existing selection, remove old selections first
        if (oldSelections) {
            console.log(`[adminOverrideSelection] Removing old selections: ${oldSelections.mainDriver}, ${oldSelections.reserveDriver}, ${oldSelections.team}`);
            // Only remove if the driver is different from the new selection
            if (normalizeDriverName(oldSelections.mainDriver) !== normalizedMain) {
                await usedSelection.removeUsedDriver(oldSelections.mainDriver);
            }
            if (normalizeDriverName(oldSelections.reserveDriver) !== normalizedReserve) {
                await usedSelection.removeUsedDriver(oldSelections.reserveDriver);
            }
            await usedSelection.removeUsedTeam(oldSelections.team);
        }

        // Add the selections to the unified cycle
        console.log(`[adminOverrideSelection] Adding new selections: ${mainDriver}, ${reserveDriver}, ${team}`);
        await usedSelection.addUsedDriver(mainDriver);
        await usedSelection.addUsedDriver(reserveDriver);
        await usedSelection.addUsedTeam(team);
        await usedSelection.save();

        console.log(`[Admin Override] Updated usage tracking for user ${userId} in league ${league.name}`);

        // Always update league standings, regardless of assignPoints
        await leaderboardService.updateStandings(leagueId, raceId);

        res.json({
            message: 'Selection updated successfully',
            selection
        });
    } catch (error) {
        console.error('Error in adminOverrideSelection:', error);
        res.status(500).json({ 
            error: 'Internal server error while updating selection',
            details: error.message
        });
    }
};

module.exports = {
    getRaceSelections,
    getUsedSelections,
    getCurrentSelections,
    saveSelections,
    adminOverrideSelection
}; 