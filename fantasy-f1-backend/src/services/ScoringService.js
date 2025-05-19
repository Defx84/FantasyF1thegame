const { normalizeDriverName, normalizeTeamName } = require('../constants/f1Data2025');
const { normalizeDriverName: driverNameNormalization } = require('../constants/driverNameNormalization');

class ScoringService {
    /**
     * Calculate total points for a selection in a race
     * @param {Object} selection - The selection containing mainDriver, reserveDriver, and team
     * @param {Object} raceResult - The race result containing results, sprintResults, and teamResults
     * @returns {Object} Object containing totalPoints and breakdown
     */
    calculateRacePoints(selection, raceResult) {
        const isSprintWeekend = raceResult.isSprintWeekend;
        console.log('Processing race result:', {
            isSprintWeekend,
            mainDriver: selection.mainDriver,
            reserveDriver: selection.reserveDriver,
            team: selection.team,
            raceResults: raceResult.results,
            sprintResults: raceResult.sprintResults,
            teamResults: raceResult.teamResults
        });
        
        // Get main driver race points
        const mainDriverResult = this.findDriverResult(selection.mainDriver, raceResult.results);
        const mainDriverDNS = mainDriverResult?.didNotStart || false;
        const mainDriverPoints = mainDriverDNS ? 0 : (mainDriverResult?.points || 0);
        console.log('Main driver points:', { mainDriver: selection.mainDriver, points: mainDriverPoints, DNS: mainDriverDNS });

        // Get reserve driver points based on weekend type and main driver status
        let reserveDriverPoints = 0;
        if (isSprintWeekend) {
            // Sprint weekend: reserve driver always gets sprint points
            const reserveSprintResult = this.findDriverResult(selection.reserveDriver, raceResult.sprintResults);
            reserveDriverPoints = reserveSprintResult?.points || 0;
            console.log('Sprint points for reserve:', { driver: selection.reserveDriver, points: reserveDriverPoints });
        } else if (mainDriverDNS) {
            // Non-sprint weekend: reserve only scores if main driver DNS
            const reserveRaceResult = this.findDriverResult(selection.reserveDriver, raceResult.results);
            reserveDriverPoints = reserveRaceResult?.points || 0;
            console.log('Reserve driver points (DNS):', { driver: selection.reserveDriver, points: reserveDriverPoints });
        }

        // Calculate team points
        const userTeam = normalizeTeamName(selection.team);
        const teamResult = raceResult.teamResults?.find(t => 
            normalizeTeamName(t.team) === userTeam
        );
        console.log('Team result found:', teamResult);

        const teamRacePoints = teamResult?.racePoints || teamResult?.points || 0;
        const teamSprintPoints = isSprintWeekend ? (teamResult?.sprintPoints || 0) : 0;
        const totalTeamPoints = teamRacePoints + teamSprintPoints;

        console.log('Team points calculation:', {
            team: selection.team,
            racePoints: teamRacePoints,
            sprintPoints: teamSprintPoints,
            total: totalTeamPoints
        });

        const result = {
            totalPoints: mainDriverPoints + reserveDriverPoints + totalTeamPoints,
            breakdown: {
                mainDriver: selection.mainDriver,
                reserveDriver: selection.reserveDriver,
                team: selection.team,
                isSprintWeekend: isSprintWeekend,
                mainDriverStatus: mainDriverDNS ? 'DNS' : 'FINISHED',
                mainDriverPoints: mainDriverPoints,
                reserveDriverPoints: reserveDriverPoints,
                teamRacePoints: teamRacePoints,
                teamSprintPoints: teamSprintPoints,
                teamPoints: totalTeamPoints
            }
        };
        console.log('Final result:', result);
        return result;
    }

    /**
     * Find a driver's result in a result set
     */
    findDriverResult(driver, results) {
        if (!driver || !results) return null;
        const normalizedDriver = normalizeDriverName(driver);
        return results.find(r => normalizeDriverName(r.driver) === normalizedDriver);
    }
}

module.exports = ScoringService; 