const { 
    F1_TEAMS_2025,
    normalizedTeamNames
} = require('./f1Data2025');

// Create the validTeams array in the old format for backward compatibility
const validTeams = F1_TEAMS_2025.map(t => ({
    name: t.name,
    short: t.shortName,
    displayName: t.displayName
}));

// Re-export with the same interface as before
module.exports = {
    validTeams,
    normalizedTeams: Array.from(normalizedTeamNames),
    normalizedTeamsSet: normalizedTeamNames,
    teamToShort: new Map(validTeams.map(t => [t.name.toLowerCase(), t.short])),
    shortToTeam: new Map(validTeams.map(t => [t.short.toLowerCase(), t.name])),
    teamToDisplay: new Map(validTeams.map(t => [t.name.toLowerCase(), t.displayName])),
    shortToDisplay: new Map(validTeams.map(t => [t.short.toLowerCase(), t.displayName])),
    displayToTeam: new Map(validTeams.map(t => [t.displayName.toLowerCase(), t.name]))
}; 