const { F1_DRIVERS_2025 } = require('./f1DriverData');
const { normalizeDriverName, isValidDriver } = require('./driverNameNormalization');

// 2025 F1 Teams with all their representations
const F1_TEAMS_2025 = [
    {
        name: 'Red Bull Racing',
        shortName: 'Red Bull',
        displayName: 'Red Bull',
        alternateNames: ['Red Bull', 'Red Bull Racing']
    },
    {
        name: 'Mercedes',
        shortName: 'Mercedes',
        displayName: 'Mercedes',
        alternateNames: ['Mercedes AMG', 'Mercedes']
    },
    {
        name: 'Ferrari',
        shortName: 'Ferrari',
        displayName: 'Ferrari',
        alternateNames: ['Ferrari']
    },
    {
        name: 'McLaren',
        shortName: 'McLaren',
        displayName: 'McLaren',
        alternateNames: ['McLaren Mercedes', 'McLaren']
    },
    {
        name: 'Aston Martin',
        shortName: 'Aston Martin',
        displayName: 'Aston Martin',
        alternateNames: ['Aston Martin Aramco', 'Aston Martin Racing']
    },
    {
        name: 'Alpine',
        shortName: 'Alpine',
        displayName: 'Alpine',
        alternateNames: ['Alpine Renault', 'Alpine']
    },
    {
        name: 'Williams',
        shortName: 'Williams',
        displayName: 'Williams',
        alternateNames: ['Williams Mercedes', 'Williams']
    },
    {
        name: 'RB',
        shortName: 'RB',
        displayName: 'RB',
        alternateNames: ['Racing Bulls', 'Visa Cash App RB', 'VCARB', 'Visa Cash App Racing Bulls']
    },
    {
        name: 'Stake F1 Team Kick Sauber',
        shortName: 'Kick Sauber',
        displayName: 'Kick Sauber',
        alternateNames: ['Stake F1 Team', 'Kick Sauber', 'Sauber']
    },
    {
        name: 'Haas F1 Team',
        shortName: 'Haas',
        displayName: 'Haas',
        alternateNames: ['Haas Ferrari', 'Haas', 'MoneyGram Haas F1 Team', 'MoneyGram Haas']
    }
];

// Create a set of all valid team names (normalized)
const normalizedTeamNames = new Set();
F1_TEAMS_2025.forEach(team => {
    normalizedTeamNames.add(team.name.toLowerCase());
    normalizedTeamNames.add(team.shortName.toLowerCase());
    team.alternateNames.forEach(name => {
        normalizedTeamNames.add(name.toLowerCase());
    });
});

// Keep team-related maps and functions
const teamNameToData = new Map(F1_TEAMS_2025.map(t => [t.name.toLowerCase(), t]));
const alternateTeamNames = new Map();
F1_TEAMS_2025.forEach(team => {
    team.alternateNames.forEach(alt => {
        alternateTeamNames.set(alt.toLowerCase(), team.name);
    });
});

// Helper functions for validation and normalization
const isValidTeam = (team) => normalizedTeamNames.has(team.toLowerCase());

const normalizeTeamName = (team) => {
    const lowercased = team.toLowerCase();
    // Check direct match
    if (teamNameToData.has(lowercased)) {
        return teamNameToData.get(lowercased).name;
    }
    // Check alternate names
    return alternateTeamNames.get(lowercased) || null;
};

const getDriverTeam = (driver) => {
    const normalized = normalizeDriverName(driver);
    if (!normalized || normalized === 'None') return null;
    const driverData = F1_DRIVERS_2025.find(d => d.shortName === normalized);
    return driverData?.team || null;
};

const getTeamDrivers = (team) => {
    const normalized = normalizeTeamName(team);
    if (!normalized) return [];
    return F1_DRIVERS_2025.filter(d => d.team === normalized).map(d => d.name);
};

module.exports = {
    F1_TEAMS_2025,
    F1_DRIVERS_2025,
    normalizedTeamNames,
    isValidTeam,
    normalizeTeamName,
    normalizeDriverName,
    isValidDriver,
    getDriverTeam,
    getTeamDrivers
}; 