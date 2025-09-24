const League = require('../models/League');
const User = require('../models/User');
const RaceResult = require('../models/RaceResult');
const RaceSelection = require('../models/RaceSelection');
const RaceCalendar = require('../models/RaceCalendar');
const { initializeRaceSelections, initializeAllRaceSelections } = require('../utils/raceUtils');
const LeagueLeaderboard = require('../models/LeagueLeaderboard');
const UsedSelection = require('../models/UsedSelection');
const { initializeLeaderboard } = require('../utils/initializeLeaderboard');

// Function to generate a unique league code
const generateLeagueCode = async () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code;
  let isUnique = false;

  while (!isUnique) {
    // Generate a 6-character code
    code = '';
    for (let i = 0; i < 6; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    // Check if the code already exists
    const existingLeague = await League.findOne({ code });
    if (!existingLeague) {
      isUnique = true;
    }
  }

  return code;
};

const createLeague = async (req, res) => {
    try {
        const { name, description } = req.body;
        const code = await generateLeagueCode();
        const season = new Date().getFullYear();

        const league = new League({
            name,
            description,
            owner: req.user._id,
            members: [req.user._id],
            code,
            season
        });

        await league.save();

        // Initialize empty race selections for all races
        await initializeAllRaceSelections(league._id);

        res.status(201).json(league);
    } catch (error) {
        console.error('Error creating league:', error);
        res.status(500).json({ message: 'Error creating league' });
    }
};

const joinLeague = async (req, res) => {
    try {
        const { code } = req.body;
        const userId = req.user._id;

        const league = await League.findOne({ code });
        if (!league) {
            return res.status(404).json({ message: 'League not found' });
        }

        if (league.members.includes(userId)) {
            return res.status(400).json({ message: 'Already a member of this league' });
        }

        league.members.push(userId);
        await league.save();

        // Initialize empty race selections for the new member
        const races = await RaceCalendar.find({}).select('_id round');
        for (const race of races) {
            await initializeRaceSelections(league._id, race._id, race.round);
        }

        // Trigger leaderboard initialization/update for this league and season
        await initializeLeaderboard(league._id, league.season);

        res.json(league);
    } catch (error) {
        console.error('Error joining league:', error);
        res.status(500).json({ message: 'Error joining league' });
    }
};

const getLeague = async (req, res) => {
    try {
        const { id } = req.params;
        const league = await League.findById(id)
            .populate('owner', 'username email')
            .populate('members', 'username email');

        if (!league) {
            return res.status(404).json({ message: 'League not found' });
        }

        res.json({
            id: league._id,
            name: league.name,
            description: league.description,
            code: league.code,
            owner: {
                id: league.owner._id,
                username: league.owner.username,
                email: league.owner.email
            },
            members: league.members.map(member => ({
                id: member._id,
                username: member.username,
                email: member.email
            })),
            createdAt: league.createdAt,
            updatedAt: league.updatedAt
        });
    } catch (error) {
        console.error('Error in getLeague:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getLeagueMembers = async (req, res) => {
    try {
        const { id } = req.params;
        const league = await League.findById(id)
            .populate('members', 'username email');

        if (!league) {
            return res.status(404).json({ message: 'League not found' });
        }

        res.json({
            leagueId: league._id,
            leagueName: league.name,
            members: league.members.map(member => ({
                id: member._id,
                username: member.username,
                email: member.email
            })),
            total: league.members.length
        });
    } catch (error) {
        console.error('Error in getLeagueMembers:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getLeagueSelections = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Get current race using RaceResult
        const currentRace = await RaceResult.findOne({
            date: { $gte: new Date() }
        }).sort({ date: 1 });

        if (!currentRace) {
            return res.status(404).json({ message: 'No upcoming race found' });
        }

        // Get all selections for this race in the league
        const selections = await RaceSelection.find({
            league: id,
            race: currentRace._id
        }).populate('user', 'username email')
          .populate('league', 'name');

        // Format response
        const formattedSelections = selections.map(selection => ({
            id: selection._id,
            user: {
                id: selection.user._id,
                username: selection.user.username,
                email: selection.user.email
            },
            league: {
                id: selection.league._id,
                name: selection.league.name
            },
            selections: {
                mainDriver: selection.mainDriver,
                reserveDriver: selection.reserveDriver,
                team: selection.team
            },
            createdAt: selection.createdAt,
            updatedAt: selection.updatedAt
        }));

        res.json({
            race: {
                id: currentRace._id,
                name: currentRace.raceName,
                round: currentRace.round,
                date: currentRace.date
            },
            selections: formattedSelections,
            total: formattedSelections.length
        });
    } catch (error) {
        console.error('Error in getLeagueSelections:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getLeagueByCode = async (req, res) => {
    try {
        const { code } = req.params;
        const league = await League.findOne({ code })
            .populate('owner', 'username email')
            .populate('members', 'username email');

        if (!league) {
            return res.status(404).json({ message: 'League not found' });
        }

        res.json({
            id: league._id,
            name: league.name,
            code: league.code,
            owner: {
                id: league.owner._id,
                username: league.owner.username,
                email: league.owner.email
            },
            members: league.members.map(member => ({
                id: member._id,
                username: member.username,
                email: member.email
            })),
            createdAt: league.createdAt,
            updatedAt: league.updatedAt
        });
    } catch (error) {
        console.error('Error in getLeagueByCode:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getUserLeagues = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const leagues = await League.find({
      $or: [
        { owner: userId },
        { members: userId }
      ]
    }).sort({ createdAt: -1 });

    res.status(200).json(leagues);
  } catch (error) {
    console.error('Error fetching user leagues:', error);
    res.status(500).json({ error: 'Failed to fetch user leagues' });
  }
};

const deleteLeague = async (req, res) => {
    try {
        const { id } = req.params;
        // Find the league and check if user is the owner
        const league = await League.findById(id);
        if (!league) {
            return res.status(404).json({ message: 'League not found' });
        }
        // Check if the user is the owner
        if (league.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Only the league owner can delete the league' });
        }
        // Delete all related data
        await Promise.all([
            RaceSelection.deleteMany({ league: id }),
            RaceResult.deleteMany({ league: id }),
            LeagueLeaderboard.deleteMany({ league: id }),
            UsedSelection.deleteMany({ league: id }),
            League.findByIdAndDelete(id)
        ]);
        res.json({ message: 'League deleted successfully' });
    } catch (error) {
        console.error('Error in deleteLeague:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Abandon a league (user leaves the league and all their data for that league is deleted)
 * Only non-owners can abandon a league.
 */
const abandonLeague = async (req, res) => {
    try {
        const { id } = req.params; // league id
        const userId = req.user._id;
        const league = await League.findById(id);
        if (!league) {
            return res.status(404).json({ message: 'League not found' });
        }
        // Prevent owner from abandoning their own league
        if (league.owner.toString() === userId.toString()) {
            return res.status(400).json({ message: 'League owner cannot abandon their own league. Delete the league instead.' });
        }
        // Remove user from members array
        league.members = league.members.filter(memberId => memberId.toString() !== userId.toString());
        await league.save();
        // Delete all user data for this league
        await Promise.all([
            RaceSelection.deleteMany({ league: id, user: userId }),
            UsedSelection.deleteMany({ league: id, user: userId })
            // Add more deletions if needed (e.g., statistics, leaderboard entries for this user)
        ]);
        res.json({ message: 'You have left the league and your data has been removed.' });
    } catch (error) {
        console.error('Error in abandonLeague:', error);
        res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get league opponents with their remaining selections
 */
const getLeagueOpponents = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;
        
        // Get league and verify user is a member
        const league = await League.findById(id);
        if (!league) {
            return res.status(404).json({ message: 'League not found' });
        }
        
        if (!league.members.includes(userId)) {
            return res.status(403).json({ message: 'You are not a member of this league' });
        }
        
        // Get current race round
        const raceCalendar = await RaceCalendar.findOne({ season: new Date().getFullYear() })
            .sort({ round: 1 });
        
        if (!raceCalendar) {
            return res.status(404).json({ message: 'No race calendar found' });
        }
        
        const currentRound = raceCalendar.round;
        
        // Get all league members except current user
        const opponents = await User.find({
            _id: { $in: league.members.filter(memberId => memberId.toString() !== userId.toString()) }
        }, 'username avatar');
        
        // Filter out any null opponents (shouldn't happen but safety check)
        const validOpponents = opponents.filter(opponent => opponent && opponent._id);
        
        // Get all race selections for the league (all rounds)
        const allRaceSelections = await RaceSelection.find({
            league: id
        }).populate('user', 'username');
        
        console.log(`[Opponents] Current round: ${currentRound}`);
        console.log(`[Opponents] Total race selections: ${allRaceSelections.length}`);
        
        // Filter to only include selections from completed rounds (exclude current/upcoming race)
        const historicalSelections = allRaceSelections.filter(selection => 
            selection.round < currentRound
        );
        
        console.log(`[Opponents] Historical selections (rounds < ${currentRound}): ${historicalSelections.length}`);
        
        // Create a map of historical selections by user
        const historicalSelectionsMap = {};
        historicalSelections.forEach(selection => {
            if (!selection.user || !selection.user._id) {
                console.log('[Opponents] Skipping race selection with null user:', selection);
                return;
            }
            
            const userId = selection.user._id.toString();
            if (!historicalSelectionsMap[userId]) {
                historicalSelectionsMap[userId] = {
                    mainDrivers: [],
                    reserveDrivers: [],
                    teams: []
                };
            }
            
            // Add selections from historical races only
            if (selection.mainDriver) historicalSelectionsMap[userId].mainDrivers.push(selection.mainDriver);
            if (selection.reserveDriver) historicalSelectionsMap[userId].reserveDrivers.push(selection.reserveDriver);
            if (selection.team) historicalSelectionsMap[userId].teams.push(selection.team);
        });
        
        // Import F1 data constants
        const { F1_DRIVERS_2025, F1_TEAMS_2025 } = require('../constants/f1Data2025');
        
        // Get all available drivers and teams
        const allDrivers = F1_DRIVERS_2025.map(driver => driver.name);
        const allTeams = F1_TEAMS_2025.map(team => team.name);
        
        // Create mapping from short names to full names
        const shortNameToFullName = {};
        F1_DRIVERS_2025.forEach(driver => {
            shortNameToFullName[driver.shortName] = driver.name;
        });
        
        const teamNameMapping = {};
        F1_TEAMS_2025.forEach(team => {
            // Map the canonical name to itself
            teamNameMapping[team.name] = team.name;
            // Map short name to canonical name
            teamNameMapping[team.shortName] = team.name;
            // Map all alternate names to canonical name
            team.alternateNames.forEach(altName => {
                teamNameMapping[altName] = team.name;
            });
        });
        
        // Debug: Log the team name mapping
        console.log('[Opponents] Team name mapping:', teamNameMapping);
        
        // Calculate remaining selections for each opponent
        const opponentsData = validOpponents.map(opponent => {
            const userId = opponent._id.toString();
            const used = historicalSelectionsMap[userId] || { mainDrivers: [], reserveDrivers: [], teams: [] };
            
            // RaceSelection already stores full names, so we can use them directly
            const usedMainDriversFull = used.mainDrivers;
            const usedReserveDriversFull = used.reserveDrivers;
            const usedTeamsFull = used.teams.map(teamName => teamNameMapping[teamName] || teamName).filter(Boolean);
            
            const remainingMainDrivers = allDrivers.filter(driver => !usedMainDriversFull.includes(driver));
            const remainingReserveDrivers = allDrivers.filter(driver => !usedReserveDriversFull.includes(driver));
            const remainingTeams = allTeams.filter(team => !usedTeamsFull.includes(team));
            
            // Debug logging
            console.log(`[Opponents] User: ${opponent.username}`);
            console.log(`[Opponents] Historical selections:`, {
                mainDrivers: used.mainDrivers,
                reserveDrivers: used.reserveDrivers,
                teams: used.teams
            });
            console.log(`[Opponents] Used teams full:`, usedTeamsFull);
            console.log(`[Opponents] All teams:`, allTeams);
            console.log(`[Opponents] Remaining teams:`, remainingTeams);
            
            return {
                id: opponent._id,
                username: opponent.username,
                avatar: opponent.avatar,
                remainingDrivers: remainingMainDrivers.length,
                remainingTeams: remainingTeams.length,
                remainingSelections: {
                    mainDrivers: remainingMainDrivers,
                    reserveDrivers: remainingReserveDrivers,
                    teams: remainingTeams
                }
            };
        });
        
        res.json(opponentsData);
    } catch (error) {
        console.error('Error in getLeagueOpponents:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    createLeague: createLeague,
    joinLeague: joinLeague,
    getLeague: getLeague,
    getLeagueByCode: getLeagueByCode,
    getLeagueMembers: getLeagueMembers,
    getLeagueSelections: getLeagueSelections,
    getUserLeagues: getUserLeagues,
    deleteLeague: deleteLeague,
    abandonLeague: abandonLeague,
    getLeagueOpponents: getLeagueOpponents
}; 