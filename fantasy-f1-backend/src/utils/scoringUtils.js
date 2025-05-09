const {
    normalizeDriverName,
    normalizeTeamName
} = require('../constants/f1Data2025');

// Point system for race positions
const RACE_POINTS = {
    1: 25,
    2: 18,
    3: 15,
    4: 12,
    5: 10,
    6: 8,
    7: 6,
    8: 4,
    9: 2,
    10: 1
};

// Point system for sprint positions
const SPRINT_POINTS = {
    1: 8,
    2: 7,
    3: 6,
    4: 5,
    5: 4,
    6: 3,
    7: 2,
    8: 1
};

// Calculate points based on position
function calculatePoints(position, isSprint = false) {
    // Handle special position values
    if (typeof position === 'string') {
        position = position.toLowerCase();
        if (position === 'dq' || position === 'dsq' || position === 'dnf' || position === 'dns') {
            return 0;
        }
        // Try to parse numeric positions
        position = parseInt(position);
    }
    
    // Ensure position is a number
    position = Number(position);
    
    const pointsSystem = isSprint ? SPRINT_POINTS : RACE_POINTS;
    return pointsSystem[position] || 0;
}

// Process raw results from scraper
function processRawResults(rawResults, isSprint = false) {
    return rawResults.map(result => {
        let position = result.position;
        let points = calculatePoints(position, isSprint);  // Recalculate points based on position

        let requiresReserveDriver = false;

        if (typeof position === 'string') {
            position = position.toLowerCase();
            if (['dq', 'dsq', 'dnf', 'dns'].includes(position)) {
                points = 0; // Override points to 0 for DQ/DSQ/DNF/DNS
            }
        }

        const status = result.status?.toUpperCase() || '';

        return {
            position: position,
            driver: normalizeDriverName(result.driver),
            team: normalizeTeamName(result.team),
            carNumber: result.carNumber,
            laps: result.laps,
            time: result.time,
            points: points, // Use recalculated points
            didNotFinish: result.didNotFinish || status.includes('DNF'),
            didNotStart: result.didNotStart || status.includes('DNS'),
            disqualified: result.disqualified || status.includes('DSQ') || status.includes('DQ'),
            requiresReserveDriver: requiresReserveDriver,
            status: status
        };
    });
}

// Process raw team results
function processTeamResults(raceResults, sprintResults = []) {
    const teamResults = {};
    
    // Group results by team for main race
    raceResults.forEach(result => {
        const team = result.team.toLowerCase();
        if (!teamResults[team]) {
            teamResults[team] = {
                team: normalizeTeamName(result.team),
                racePoints: 0,
                sprintPoints: 0,
                totalPoints: 0
            };
        }
        teamResults[team].racePoints += result.points;
    });
    
    // Add sprint points if available
    sprintResults.forEach(result => {
        const team = result.team.toLowerCase();
        if (teamResults[team]) {
            teamResults[team].sprintPoints += result.points;
        }
    });
    
    // Calculate total points
    Object.values(teamResults).forEach(team => {
        team.totalPoints = team.racePoints + team.sprintPoints;
    });
    
    return Object.values(teamResults);
}

// Calculate team points based on race and sprint results
function calculateTeamPoints(raceResults, sprintResults = []) {
    const processedRaceResults = processRawResults(raceResults, false);
    const processedSprintResults = sprintResults.length > 0 ? processRawResults(sprintResults, true) : [];
    return processTeamResults(processedRaceResults, processedSprintResults);
}

module.exports = {
    calculatePoints,
    processRawResults,
    processTeamResults,
    calculateTeamPoints
};