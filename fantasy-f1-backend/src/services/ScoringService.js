const { getF1Validation } = require('../constants/f1DataLoader');
const { normalizeDriverName: driverNameNormalization } = require('../constants/driverNameNormalization');
const CardEffectsService = require('./CardEffectsService');

class ScoringService {
    constructor() {
        this.cardEffectsService = new CardEffectsService();
    }

    /**
     * Calculate total points for a selection in a race
     * @param {Object} selection - The selection containing mainDriver, reserveDriver, and team
     * @param {Object} raceResult - The race result containing results, sprintResults, and teamResults
     * @param {Object} raceCardSelection - Optional: Card selection for this race (for 2026+ seasons)
     * @param {Object} context - Optional: Additional context (userId, leagueId) for card effects
     * @returns {Object} Object containing totalPoints and breakdown
     */
    async calculateRacePoints(selection, raceResult, raceCardSelection = null, context = {}) {
        // Get season-aware normalization functions
        const season = raceResult.season || new Date().getFullYear();
        const { normalizeDriverName, normalizeTeamName } = getF1Validation(season);
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
        const mainDriverResult = this.findDriverResult(selection.mainDriver, raceResult.results, season);
        const mainDriverDNS = mainDriverResult?.didNotStart || false;
        const mainDriverPoints = mainDriverDNS ? 0 : (mainDriverResult?.points || 0);
        console.log('Main driver points:', { mainDriver: selection.mainDriver, points: mainDriverPoints, DNS: mainDriverDNS });

        // Get reserve driver points based on weekend type and main driver status
        let reserveDriverPoints = 0;
        if (isSprintWeekend) {
            // Sprint weekend: reserve driver always gets sprint points
            const reserveSprintResult = this.findDriverResult(selection.reserveDriver, raceResult.sprintResults, season);
            reserveDriverPoints = reserveSprintResult?.points || 0;
            console.log('Sprint points for reserve:', { driver: selection.reserveDriver, points: reserveDriverPoints });
        } else if (mainDriverDNS) {
            // Non-sprint weekend: reserve only scores if main driver DNS
            const reserveRaceResult = this.findDriverResult(selection.reserveDriver, raceResult.results, season);
            reserveDriverPoints = reserveRaceResult?.points || 0;
            console.log('Reserve driver points (DNS):', { driver: selection.reserveDriver, points: reserveDriverPoints });
        }

        // Calculate team points – match team by normalized name (case-insensitive, same as RaceResult.getTeamResult)
        const userTeam = normalizeTeamName(selection.team);
        if (!userTeam) {
            console.warn('ScoringService: selection.team did not normalize to a valid team:', selection.team);
        }
        const teamResult = raceResult.teamResults?.find(t => {
            const tNorm = normalizeTeamName(t.team);
            return tNorm && userTeam && tNorm.toLowerCase() === userTeam.toLowerCase();
        });
        console.log('Team result found:', teamResult ? { team: teamResult.team, racePoints: teamResult.racePoints, sprintPoints: teamResult.sprintPoints } : 'none');

        const teamRacePoints = teamResult?.racePoints ?? teamResult?.points ?? 0;
        const teamSprintPoints = isSprintWeekend ? (teamResult?.sprintPoints ?? 0) : 0;
        let totalTeamPoints = teamRacePoints + teamSprintPoints;
        // Fallback: if we found the team but racePoints/sprintPoints are missing, use totalPoints (e.g. from manual entry)
        if (teamResult && totalTeamPoints === 0 && (teamResult.totalPoints != null && teamResult.totalPoints > 0)) {
            totalTeamPoints = teamResult.totalPoints;
        }

        console.log('Team points calculation:', {
            team: selection.team,
            racePoints: teamRacePoints,
            sprintPoints: teamSprintPoints,
            total: totalTeamPoints
        });

        // Apply card effects if cards are selected (2026+ seasons only)
        let finalMainDriverPoints = mainDriverPoints;
        let finalReserveDriverPoints = reserveDriverPoints;
        let finalTeamPoints = totalTeamPoints;
        let driverCardEffect = null;
        let teamCardEffect = null;
        let driverCardInfo = null;
        let teamCardInfo = null;

        // Only apply cards if: season >= 2026, not sprint weekend, and cards are selected
        const shouldApplyCards = raceCardSelection && raceResult.season >= 2026 && !isSprintWeekend;
        
        if (shouldApplyCards) {
            try {
                // Apply driver card effect
                if (raceCardSelection.driverCard) {
                    const driverCardResult = await this.cardEffectsService.applyDriverCardEffect({
                        baseMainDriverPoints: mainDriverPoints,
                        baseReserveDriverPoints: reserveDriverPoints,
                        raceResult,
                        selection,
                        raceCardSelection,
                        leagueId: context.leagueId,
                        userId: context.userId
                    });
                    finalMainDriverPoints = driverCardResult.mainDriverPoints;
                    finalReserveDriverPoints = driverCardResult.reserveDriverPoints;
                    driverCardEffect = driverCardResult.driverCardEffect;
                    driverCardInfo = {
                        name: raceCardSelection.driverCard.name,
                        tier: raceCardSelection.driverCard.tier,
                        effect: driverCardEffect
                    };
                }

                // Apply team card effect
                if (raceCardSelection.teamCard) {
                    const teamCardResult = await this.cardEffectsService.applyTeamCardEffect({
                        baseTeamPoints: totalTeamPoints,
                        raceResult,
                        selection,
                        raceCardSelection,
                        leagueId: context.leagueId,
                        userId: context.userId
                    });
                    finalTeamPoints = teamCardResult.teamPoints;
                    teamCardEffect = teamCardResult.teamCardEffect;
                    teamCardInfo = {
                        name: raceCardSelection.teamCard.name,
                        tier: raceCardSelection.teamCard.tier,
                        effect: teamCardEffect
                    };
                }
            } catch (error) {
                console.error('Error applying card effects:', error);
                // Continue with base points if card effects fail
            }
        }

        const result = {
            totalPoints: finalMainDriverPoints + finalReserveDriverPoints + finalTeamPoints,
            breakdown: {
                mainDriver: selection.mainDriver,
                reserveDriver: selection.reserveDriver,
                team: selection.team,
                isSprintWeekend: isSprintWeekend,
                mainDriverStatus: mainDriverDNS ? 'DNS' : 'FINISHED',
                mainDriverPoints: finalMainDriverPoints,
                reserveDriverPoints: finalReserveDriverPoints,
                teamRacePoints: teamRacePoints,
                teamSprintPoints: teamSprintPoints,
                teamPoints: finalTeamPoints,
                // Card effects information (only if cards were applied)
                driverCard: driverCardInfo,
                teamCard: teamCardInfo,
                // Base points (before card effects) for reference
                basePoints: {
                    mainDriverPoints: mainDriverPoints,
                    reserveDriverPoints: reserveDriverPoints,
                    teamPoints: totalTeamPoints,
                    total: mainDriverPoints + reserveDriverPoints + totalTeamPoints
                }
            }
        };
        console.log('Final result:', result);
        return result;
    }

    /**
     * Find a driver's result in a result set
     * @param {string} driver - Driver name to find
     * @param {Array} results - Array of race results
     * @param {number} season - Season year for normalization
     */
    findDriverResult(driver, results, season = null) {
        if (!driver || !results) return null;
        const seasonYear = season || new Date().getFullYear();
        const { normalizeDriverName } = getF1Validation(seasonYear);
        const normalizedDriver = normalizeDriverName(driver);
        return results.find(r => normalizeDriverName(r.driver) === normalizedDriver);
    }
}

module.exports = ScoringService; 