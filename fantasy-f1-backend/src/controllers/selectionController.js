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
                mainDriverCycles: [[]],
                reserveDriverCycles: [[]]
            });
            await usedSelection.save();
        }

        // Get the current cycle's used items
        const lastTeamCycleIndex = usedSelection.teamCycles.length - 1;
        const lastMainDriverCycleIndex = usedSelection.mainDriverCycles.length - 1;
        const lastReserveDriverCycleIndex = usedSelection.reserveDriverCycles.length - 1;

        const usedTeams = usedSelection.teamCycles[lastTeamCycleIndex] || [];
        const usedMainDrivers = usedSelection.mainDriverCycles[lastMainDriverCycleIndex] || [];
        const usedReserveDrivers = usedSelection.reserveDriverCycles[lastReserveDriverCycleIndex] || [];

        res.json({
            usedMainDrivers: usedMainDrivers,
            usedReserveDrivers: usedReserveDrivers,
            usedTeams: usedTeams
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

        // Get the next race to determine the round number
        const now = new Date();
        const nextRace = await RaceCalendar.findOne({
            date: { $gt: now }
        }).sort({ date: 1 });

        if (!nextRace) {
            return res.status(404).json({ 
                error: 'No upcoming races found' 
            });
        }

        const round = nextRace.round;

        // Normalize the incoming data
        const normalizedMainDriver = normalizeDriver(mainDriver);
        const normalizedReserveDriver = normalizeDriver(reserveDriver);
        const normalizedTeam = normalizeTeam(team);

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

        // Validate normalized names
        if (!isValidDriver(normalizedMainDriver) || !isValidDriver(normalizedReserveDriver) || !isValidTeam(normalizedTeam)) {
            return res.status(400).json({ 
                error: 'Invalid driver or team selection' 
            });
        }

        // Check if user is a member of the league
        const league = await League.findById(leagueId);
        if (!league) {
            return res.status(404).json({ 
                error: 'League not found' 
            });
        }

        const isMember = league.members.some(member => 
            member.toString() === req.user._id.toString()
        );

        if (!isMember) {
            return res.status(403).json({ 
                error: 'You must be a member of this league to save selections' 
            });
        }

        // Check if selections can still be made
        const raceDate = new Date(nextRace.date);
        if (now >= raceDate) {
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

        if (selection) {
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

        if (!usedSelection) {
            usedSelection = new UsedSelection({
                user: req.user._id,
                league: leagueId,
                teamCycles: [[]],
                mainDriverCycles: [[]],
                reserveDriverCycles: [[]]
            });
        }

        // Add the selections to the current cycles
        usedSelection.addUsedMainDriver(normalizedMainDriver);
        usedSelection.addUsedReserveDriver(normalizedReserveDriver);
        usedSelection.addUsedTeam(normalizedTeam);

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
                const pointsData = scoringService.calculateRacePoints(
                    { mainDriver, reserveDriver, team },
                    raceResult
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
                mainDriverCycles: [[]],
                reserveDriverCycles: [[]]
            });
        }

        // Add the selections to the current cycles
        usedSelection.addUsedMainDriver(mainDriver);
        usedSelection.addUsedReserveDriver(reserveDriver);
        usedSelection.addUsedTeam(team);
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