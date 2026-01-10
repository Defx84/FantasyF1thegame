const RaceCardSelection = require('../models/RaceCardSelection');
const RaceSelection = require('../models/RaceSelection');
const League = require('../models/League');
const { getF1Data } = require('../constants/f1DataLoader');

class CardEffectsService {
    /**
     * Apply driver card effects to points
     * @param {Object} params - Parameters for card effect calculation
     * @param {number} baseMainDriverPoints - Base points from main driver
     * @param {number} baseReserveDriverPoints - Base points from reserve driver
     * @param {Object} raceResult - Race result data
     * @param {Object} selection - User's selection
     * @param {Object} raceCardSelection - Card selection for this race
     * @returns {Object} Modified points and effect details
     */
    async applyDriverCardEffect(params) {
        const {
            baseMainDriverPoints,
            baseReserveDriverPoints,
            raceResult,
            selection,
            raceCardSelection,
            leagueId,
            userId
        } = params;

        if (!raceCardSelection || !raceCardSelection.driverCard) {
            return {
                mainDriverPoints: baseMainDriverPoints,
                reserveDriverPoints: baseReserveDriverPoints,
                driverCardEffect: null
            };
        }

        const card = raceCardSelection.driverCard;
        const effectType = card.effectType;
        const season = raceResult.season || new Date().getFullYear();
        const { getDriverTeam, getTeamDrivers } = require('../constants/f1DataLoader').getF1Validation(season);

        // Determine which driver is actually scoring points
        // If main driver DNS (points = 0) and reserve driver has points, apply card to reserve driver
        // Note: On sprint weekends, reserve driver always scores sprint points, but main driver still scores race points
        // So we only apply card to reserve if main driver DNS (not just sprint weekend)
        const mainDriverDNS = baseMainDriverPoints === 0 && baseReserveDriverPoints > 0 && !raceResult.isSprintWeekend;
        const isReserveDriverActive = mainDriverDNS;
        
        // For card effects, we apply to the active driver (the one actually scoring)
        const activeDriverPoints = isReserveDriverActive ? baseReserveDriverPoints : baseMainDriverPoints;
        const activeDriver = isReserveDriverActive ? selection.reserveDriver : selection.mainDriver;
        const activeDriverName = isReserveDriverActive ? 'Reserve driver' : 'Main driver';

        let modifiedMainDriverPoints = baseMainDriverPoints;
        let modifiedReserveDriverPoints = baseReserveDriverPoints;
        let effectDetails = {
            cardName: card.name,
            cardTier: card.tier,
            effectApplied: false,
            description: null
        };

        try {
            switch (effectType) {
                case 'multiply':
                    // 2× Points: Double active driver points
                    if (isReserveDriverActive) {
                        modifiedReserveDriverPoints = baseReserveDriverPoints * (card.effectValue || 2);
                        effectDetails.description = `${activeDriverName} points doubled: ${baseReserveDriverPoints} → ${modifiedReserveDriverPoints}`;
                    } else {
                        modifiedMainDriverPoints = baseMainDriverPoints * (card.effectValue || 2);
                        effectDetails.description = `${activeDriverName} points doubled: ${baseMainDriverPoints} → ${modifiedMainDriverPoints}`;
                    }
                    effectDetails.effectApplied = true;
                    break;

                case 'mirror':
                    // Mirror: Copy another player's entire weekend score
                    if (raceCardSelection.targetPlayer) {
                        const mirroredPoints = await this.getMirroredPlayerPoints(
                            raceCardSelection.targetPlayer,
                            leagueId,
                            raceResult.round,
                            raceResult.season
                        );
                        modifiedMainDriverPoints = mirroredPoints.mainDriverPoints || 0;
                        modifiedReserveDriverPoints = mirroredPoints.reserveDriverPoints || 0;
                        effectDetails.effectApplied = true;
                        effectDetails.description = `Mirrored player's score: ${mirroredPoints.totalPoints || 0} points`;
                    }
                    break;

                case 'switcheroo':
                    // Switcheroo: Use any driver's points (applies to active driver)
                    if (raceCardSelection.targetDriver) {
                        const targetDriverResult = this.findDriverResult(
                            raceCardSelection.targetDriver,
                            raceResult.results,
                            season
                        );
                        const targetPoints = targetDriverResult?.points || 0;
                        if (isReserveDriverActive) {
                            modifiedReserveDriverPoints = targetPoints;
                            effectDetails.description = `${activeDriverName} switched to ${raceCardSelection.targetDriver}: ${targetPoints} points`;
                        } else {
                            modifiedMainDriverPoints = targetPoints;
                            effectDetails.description = `${activeDriverName} switched to ${raceCardSelection.targetDriver}: ${targetPoints} points`;
                        }
                        effectDetails.effectApplied = true;
                    }
                    break;

                case 'teamwork2':
                    // Teamwork 2: Active driver + teammate points
                    const driverForTeamwork2 = isReserveDriverActive ? selection.reserveDriver : selection.mainDriver;
                    const teammate = this.getTeammate(driverForTeamwork2, season);
                    if (teammate) {
                        const teammateResult = this.findDriverResult(teammate, raceResult.results, season);
                        const teammatePoints = teammateResult?.points || 0;
                        if (isReserveDriverActive) {
                            modifiedReserveDriverPoints = baseReserveDriverPoints + teammatePoints;
                            effectDetails.description = `${activeDriverName} + teammate: ${baseReserveDriverPoints} + ${teammatePoints} = ${modifiedReserveDriverPoints}`;
                        } else {
                            modifiedMainDriverPoints = baseMainDriverPoints + teammatePoints;
                            effectDetails.description = `${activeDriverName} + teammate: ${baseMainDriverPoints} + ${teammatePoints} = ${modifiedMainDriverPoints}`;
                        }
                        effectDetails.effectApplied = true;
                    }
                    break;

                case 'teamwork':
                    // Teamwork: Use teammate's points instead (applies to active driver)
                    const driverForTeamwork = isReserveDriverActive ? selection.reserveDriver : selection.mainDriver;
                    const teammate2 = this.getTeammate(driverForTeamwork, season);
                    if (teammate2) {
                        const teammateResult2 = this.findDriverResult(teammate2, raceResult.results, season);
                        const teammatePoints2 = teammateResult2?.points || 0;
                        if (isReserveDriverActive) {
                            modifiedReserveDriverPoints = teammatePoints2;
                            effectDetails.description = `${activeDriverName} uses teammate's points: ${teammatePoints2}`;
                        } else {
                            modifiedMainDriverPoints = teammatePoints2;
                            effectDetails.description = `${activeDriverName} uses teammate's points: ${teammatePoints2}`;
                        }
                        effectDetails.effectApplied = true;
                    }
                    break;

                case 'position_adjust':
                    // Move Up 1 Rank: Position adjustment (applies to active driver)
                    const driverForPosition = isReserveDriverActive ? selection.reserveDriver : selection.mainDriver;
                    const driverResult = this.findDriverResult(driverForPosition, raceResult.results, season);
                    if (driverResult && driverResult.position) {
                        const newPosition = Math.max(1, driverResult.position - (card.effectValue || 1));
                        // Recalculate points based on new position
                        const adjustedPoints = this.calculatePointsFromPosition(newPosition, false);
                        if (isReserveDriverActive) {
                            modifiedReserveDriverPoints = adjustedPoints;
                            effectDetails.description = `${activeDriverName} position adjusted: P${driverResult.position} → P${newPosition} (${adjustedPoints} points)`;
                        } else {
                            modifiedMainDriverPoints = adjustedPoints;
                            effectDetails.description = `${activeDriverName} position adjusted: P${driverResult.position} → P${newPosition} (${adjustedPoints} points)`;
                        }
                        effectDetails.effectApplied = true;
                    }
                    break;

                case 'mystery':
                    // Mystery Card: Use the transformed card stored at activation time
                    let mysteryCardToUse = card;
                    if (raceCardSelection.mysteryTransformedCard) {
                        // Use the stored transformation from activation
                        const Card = require('../models/Card');
                        const transformedCard = await Card.findById(raceCardSelection.mysteryTransformedCard);
                        if (transformedCard) {
                            mysteryCardToUse = {
                                ...card,
                                effectType: transformedCard.effectType,
                                effectValue: transformedCard.effectValue,
                                name: transformedCard.name
                            };
                        }
                    } else {
                        // Fallback: generate random if not stored (for backward compatibility)
                        const randomEffect = await this.getRandomDriverCardEffect();
                        mysteryCardToUse = { ...card, effectType: randomEffect.effectType, effectValue: randomEffect.effectValue };
                    }
                    
                    const mysteryResult = await this.applyDriverCardEffect({
                        ...params,
                        raceCardSelection: {
                            ...raceCardSelection,
                            driverCard: mysteryCardToUse
                        }
                    });
                    modifiedMainDriverPoints = mysteryResult.mainDriverPoints;
                    modifiedReserveDriverPoints = mysteryResult.reserveDriverPoints;
                    effectDetails.effectApplied = mysteryResult.driverCardEffect?.effectApplied || false;
                    effectDetails.description = `Mystery card transformed into: ${mysteryCardToUse.name} - ${mysteryResult.driverCardEffect?.description || 'No effect'}`;
                    break;

                case 'conditional_bonus':
                    // Conditional bonuses (Top 5 Boost, Top 10 Boost, Competitiveness, Bottom 5)
                    // Apply to active driver
                    const condition = card.effectValue?.condition;
                    const bonus = card.effectValue?.bonus || 0;
                    let bonusApplied = false;
                    const driverForConditional = isReserveDriverActive ? selection.reserveDriver : selection.mainDriver;
                    const driverResultForConditional = this.findDriverResult(driverForConditional, raceResult.results, season);

                    if (condition === 'top5') {
                        if (driverResultForConditional && driverResultForConditional.position && driverResultForConditional.position <= 5) {
                            if (isReserveDriverActive) {
                                modifiedReserveDriverPoints += bonus;
                            } else {
                                modifiedMainDriverPoints += bonus;
                            }
                            bonusApplied = true;
                            effectDetails.description = `${activeDriverName} Top 5 bonus: +${bonus} points`;
                        }
                    } else if (condition === 'top10') {
                        if (driverResultForConditional && driverResultForConditional.position && driverResultForConditional.position <= 10) {
                            if (isReserveDriverActive) {
                                modifiedReserveDriverPoints += bonus;
                            } else {
                                modifiedMainDriverPoints += bonus;
                            }
                            bonusApplied = true;
                            effectDetails.description = `${activeDriverName} Top 10 bonus: +${bonus} points`;
                        }
                    } else if (condition === 'ahead_of_teammate') {
                        const teammate = this.getTeammate(driverForConditional, season);
                        if (teammate) {
                            const teammateResult = this.findDriverResult(teammate, raceResult.results, season);
                            if (driverResultForConditional && teammateResult && 
                                driverResultForConditional.position && teammateResult.position &&
                                driverResultForConditional.position < teammateResult.position) {
                                if (isReserveDriverActive) {
                                    modifiedReserveDriverPoints += bonus;
                                } else {
                                    modifiedMainDriverPoints += bonus;
                                }
                                bonusApplied = true;
                                effectDetails.description = `${activeDriverName} ahead of teammate bonus: +${bonus} points`;
                            }
                        }
                    } else if (condition === 'bottom5') {
                        const totalDrivers = raceResult.results?.length || 20;
                        if (driverResultForConditional && driverResultForConditional.position && 
                            driverResultForConditional.position > totalDrivers - 5) {
                            if (isReserveDriverActive) {
                                modifiedReserveDriverPoints += bonus;
                            } else {
                                modifiedMainDriverPoints += bonus;
                            }
                            bonusApplied = true;
                            effectDetails.description = `${activeDriverName} Bottom 5 bonus: +${bonus} points`;
                        }
                    }

                    effectDetails.effectApplied = bonusApplied;
                    if (!bonusApplied) {
                        effectDetails.description = `${activeDriverName} condition not met: ${condition}`;
                    }
                    break;

                case 'flat_bonus':
                    // +3 Points: Flat bonus (applies to active driver)
                    const flatBonus = card.effectValue || 3;
                    if (isReserveDriverActive) {
                        modifiedReserveDriverPoints += flatBonus;
                        effectDetails.description = `${activeDriverName} flat bonus: +${flatBonus} points`;
                    } else {
                        modifiedMainDriverPoints += flatBonus;
                        effectDetails.description = `${activeDriverName} flat bonus: +${flatBonus} points`;
                    }
                    effectDetails.effectApplied = true;
                    break;

                default:
                    effectDetails.description = `Unknown effect type: ${effectType}`;
            }
        } catch (error) {
            console.error('Error applying driver card effect:', error);
            effectDetails.description = `Error: ${error.message}`;
        }

        return {
            mainDriverPoints: modifiedMainDriverPoints,
            reserveDriverPoints: modifiedReserveDriverPoints,
            driverCardEffect: effectDetails
        };
    }

    /**
     * Apply team card effects to points
     * @param {Object} params - Parameters for card effect calculation
     * @param {number} baseTeamPoints - Base team points
     * @param {Object} raceResult - Race result data
     * @param {Object} selection - User's selection
     * @param {Object} raceCardSelection - Card selection for this race
     * @returns {Object} Modified points and effect details
     */
    async applyTeamCardEffect(params) {
        const {
            baseTeamPoints,
            raceResult,
            selection,
            raceCardSelection,
            leagueId,
            userId
        } = params;

        if (!raceCardSelection || !raceCardSelection.teamCard) {
            return {
                teamPoints: baseTeamPoints,
                teamCardEffect: null
            };
        }

        const card = raceCardSelection.teamCard;
        const effectType = card.effectType;
        const season = raceResult.season || new Date().getFullYear();
        const { normalizeTeamName } = require('../constants/f1DataLoader').getF1Validation(season);

        let modifiedTeamPoints = baseTeamPoints;
        let effectDetails = {
            cardName: card.name,
            cardTier: card.tier,
            effectApplied: false,
            description: null
        };

        try {
            switch (effectType) {
                case 'espionage':
                    // Espionage: Copy another team's total weekend points
                    if (raceCardSelection.targetTeam) {
                        const espionagePoints = await this.getEspionageTeamPoints(
                            raceCardSelection.targetTeam,
                            leagueId,
                            raceResult.round,
                            raceResult.season
                        );
                        modifiedTeamPoints = espionagePoints || 0;
                        effectDetails.effectApplied = true;
                        effectDetails.description = `Espionage: Copied ${raceCardSelection.targetTeam}'s ${modifiedTeamPoints} points`;
                    }
                    break;

                case 'podium':
                    // Podium: +8 points per podium car (max +16)
                    const userTeam = normalizeTeamName(selection.team);
                    const teamDrivers = this.getTeamDrivers(userTeam, season);
                    let podiumCount = 0;
                    
                    teamDrivers.forEach(driver => {
                        const driverResult = this.findDriverResult(driver, raceResult.results, season);
                        if (driverResult && driverResult.position && driverResult.position <= 3) {
                            podiumCount++;
                        }
                    });

                    const podiumBonus = Math.min(podiumCount * (card.effectValue?.pointsPerPodium || 8), 
                                                card.effectValue?.maxPoints || 16);
                    modifiedTeamPoints += podiumBonus;
                    effectDetails.effectApplied = podiumCount > 0;
                    effectDetails.description = `${podiumCount} podium car(s): +${podiumBonus} points`;
                    break;

                case 'conditional_bonus':
                    // Conditional team bonuses
                    const condition = card.effectValue?.condition;
                    const bonus = card.effectValue?.bonus || 0;
                    let bonusApplied = false;
                    const userTeam2 = normalizeTeamName(selection.team);
                    const teamDrivers2 = this.getTeamDrivers(userTeam2, season);

                    if (condition === 'both_top5') {
                        const driver1Result = this.findDriverResult(teamDrivers2[0], raceResult.results, season);
                        const driver2Result = this.findDriverResult(teamDrivers2[1], raceResult.results, season);
                        if (driver1Result && driver2Result && 
                            driver1Result.position && driver2Result.position &&
                            driver1Result.position <= 5 && driver2Result.position <= 5) {
                            modifiedTeamPoints += bonus;
                            bonusApplied = true;
                            effectDetails.description = `Both cars Top 5: +${bonus} points`;
                        }
                    } else if (condition === 'both_top10') {
                        const driver1Result = this.findDriverResult(teamDrivers2[0], raceResult.results, season);
                        const driver2Result = this.findDriverResult(teamDrivers2[1], raceResult.results, season);
                        if (driver1Result && driver2Result && 
                            driver1Result.position && driver2Result.position &&
                            driver1Result.position <= 10 && driver2Result.position <= 10) {
                            modifiedTeamPoints += bonus;
                            bonusApplied = true;
                            effectDetails.description = `Both cars Top 10: +${bonus} points`;
                        }
                    } else if (condition === 'both_outside_points') {
                        const driver1Result = this.findDriverResult(teamDrivers2[0], raceResult.results, season);
                        const driver2Result = this.findDriverResult(teamDrivers2[1], raceResult.results, season);
                        if (driver1Result && driver2Result && 
                            (!driver1Result.position || driver1Result.position > 10) &&
                            (!driver2Result.position || driver2Result.position > 10)) {
                            modifiedTeamPoints += bonus;
                            bonusApplied = true;
                            effectDetails.description = `Both cars outside points: +${bonus} points`;
                        }
                    } else if (condition === 'one_last_place') {
                        const totalDrivers = raceResult.results?.length || 20;
                        teamDrivers2.forEach(driver => {
                            const driverResult = this.findDriverResult(driver, raceResult.results, season);
                            if (driverResult && driverResult.position === totalDrivers) {
                                modifiedTeamPoints += bonus;
                                bonusApplied = true;
                                effectDetails.description = `One car last place: +${bonus} points`;
                            }
                        });
                    } else if (condition === 'both_bottom5') {
                        // Bottom 5: Both cars finish in bottom 5 positions
                        const totalDrivers = raceResult.results?.length || 20;
                        const bottom5Threshold = totalDrivers - 4; // Positions that are in bottom 5 (e.g., 17-20 for 20 drivers)
                        const driver1Result = this.findDriverResult(teamDrivers2[0], raceResult.results, season);
                        const driver2Result = this.findDriverResult(teamDrivers2[1], raceResult.results, season);
                        if (driver1Result && driver2Result && 
                            driver1Result.position && driver2Result.position &&
                            driver1Result.position >= bottom5Threshold && 
                            driver2Result.position >= bottom5Threshold) {
                            modifiedTeamPoints += bonus;
                            bonusApplied = true;
                            effectDetails.description = `Both cars bottom 5: +${bonus} points`;
                        }
                    } else if (condition === 'sponsors') {
                        // Sponsors: If team scores 0 → +5; if team scores 1 → +1
                        if (baseTeamPoints === 0) {
                            modifiedTeamPoints += (card.effectValue?.bonus?.zero || 5);
                            bonusApplied = true;
                            effectDetails.description = `Team scored 0: +${card.effectValue?.bonus?.zero || 5} points`;
                        } else if (baseTeamPoints === 1) {
                            modifiedTeamPoints += (card.effectValue?.bonus?.one || 1);
                            bonusApplied = true;
                            effectDetails.description = `Team scored 1: +${card.effectValue?.bonus?.one || 1} points`;
                        }
                    }

                    effectDetails.effectApplied = bonusApplied;
                    if (!bonusApplied) {
                        effectDetails.description = `Condition not met: ${condition}`;
                    }
                    break;

                case 'undercut':
                    // Undercut: Second car reclassified one position behind better teammate
                    const userTeam3 = normalizeTeamName(selection.team);
                    const teamDrivers3 = this.getTeamDrivers(userTeam3, season);
                    if (teamDrivers3.length >= 2) {
                        const driver1Result = this.findDriverResult(teamDrivers3[0], raceResult.results, season);
                        const driver2Result = this.findDriverResult(teamDrivers3[1], raceResult.results, season);
                        
                        if (driver1Result && driver2Result && driver1Result.position && driver2Result.position) {
                            // Find which driver finished better
                            const betterDriver = driver1Result.position < driver2Result.position ? driver1Result : driver2Result;
                            const worseDriver = driver1Result.position < driver2Result.position ? driver2Result : driver1Result;
                            
                            // Reclassify worse driver one position behind
                            const newPosition = Math.min(betterDriver.position + 1, raceResult.results.length);
                            const newPoints = this.calculatePointsFromPosition(newPosition, false);
                            
                            // Recalculate team points with adjusted position
                            const betterPoints = betterDriver.points || 0;
                            modifiedTeamPoints = baseTeamPoints - (worseDriver.points || 0) + newPoints;
                            effectDetails.effectApplied = true;
                            effectDetails.description = `Undercut: Second car P${worseDriver.position} → P${newPosition}`;
                        }
                    }
                    break;

                case 'random':
                    // Random: Use the transformed card stored at activation time
                    let randomCardToUse = card;
                    if (raceCardSelection.randomTransformedCard) {
                        // Use the stored transformation from activation
                        const Card = require('../models/Card');
                        const transformedCard = await Card.findById(raceCardSelection.randomTransformedCard);
                        if (transformedCard) {
                            randomCardToUse = {
                                ...card,
                                effectType: transformedCard.effectType,
                                effectValue: transformedCard.effectValue,
                                name: transformedCard.name
                            };
                        }
                    } else {
                        // Fallback: generate random if not stored (for backward compatibility)
                        const randomEffect = await this.getRandomTeamCardEffect();
                        randomCardToUse = { ...card, effectType: randomEffect.effectType, effectValue: randomEffect.effectValue };
                    }
                    
                    const randomResult = await this.applyTeamCardEffect({
                        ...params,
                        raceCardSelection: {
                            ...raceCardSelection,
                            teamCard: randomCardToUse
                        }
                    });
                    modifiedTeamPoints = randomResult.teamPoints;
                    effectDetails.effectApplied = randomResult.teamCardEffect?.effectApplied || false;
                    effectDetails.description = `Random card transformed into: ${randomCardToUse.name} - ${randomResult.teamCardEffect?.description || 'No effect'}`;
                    break;

                default:
                    effectDetails.description = `Unknown effect type: ${effectType}`;
            }
        } catch (error) {
            console.error('Error applying team card effect:', error);
            effectDetails.description = `Error: ${error.message}`;
        }

        return {
            teamPoints: modifiedTeamPoints,
            teamCardEffect: effectDetails
        };
    }

    // Helper methods
    findDriverResult(driver, results, season) {
        if (!driver || !results) return null;
        const { normalizeDriverName } = require('../constants/f1DataLoader').getF1Validation(season);
        const normalizedDriver = normalizeDriverName(driver);
        return results.find(r => normalizeDriverName(r.driver) === normalizedDriver);
    }

    getTeammate(driver, season) {
        const { getDriverTeam, getTeamDrivers } = require('../constants/f1DataLoader').getF1Validation(season);
        const team = getDriverTeam(driver);
        if (!team) return null;
        const teammates = getTeamDrivers(team);
        return teammates.find(t => t !== driver) || null;
    }

    getTeamDrivers(team, season) {
        const { getTeamDrivers } = require('../constants/f1DataLoader').getF1Validation(season);
        return getTeamDrivers(team) || [];
    }

    calculatePointsFromPosition(position, isSprint = false) {
        const RACE_POINTS = { 1: 25, 2: 18, 3: 15, 4: 12, 5: 10, 6: 8, 7: 6, 8: 4, 9: 2, 10: 1 };
        const SPRINT_POINTS = { 1: 8, 2: 7, 3: 6, 4: 5, 5: 4, 6: 3, 7: 2, 8: 1 };
        const pointsSystem = isSprint ? SPRINT_POINTS : RACE_POINTS;
        return pointsSystem[position] || 0;
    }

    async getMirroredPlayerPoints(targetPlayerId, leagueId, round, season) {
        let targetSelection = await RaceSelection.findOne({
            user: targetPlayerId,
            league: leagueId,
            round: round
        }).populate('race');

        // If target player doesn't have a selection, auto-assign one
        if (!targetSelection) {
            console.log(`[CardEffects] Target player ${targetPlayerId} has no selection for round ${round}, attempting auto-assignment...`);
            try {
                const RaceCalendar = require('../models/RaceCalendar');
                const race = await RaceCalendar.findOne({ round: round, season: season });
                
                if (race) {
                    const League = require('../models/League');
                    const league = await League.findById(leagueId);
                    if (league) {
                        const UsedSelection = require('../models/UsedSelection');
                        let usedSelection = await UsedSelection.findOne({ user: targetPlayerId, league: leagueId });
                        
                        if (!usedSelection) {
                            // Create UsedSelection if it doesn't exist
                            usedSelection = new UsedSelection({
                                user: targetPlayerId,
                                league: leagueId,
                                driverCycles: [[]],
                                teamCycles: [[]],
                                mainDriverCycles: [[]],
                                reserveDriverCycles: [[]]
                            });
                            await usedSelection.save();
                        }
                        
                        // Get available drivers and teams (methods get season from league internally)
                        const availableDrivers = await usedSelection.getAvailableDrivers();
                        const availableTeams = await usedSelection.getAvailableTeams();
                        
                        if (availableDrivers.length >= 2 && availableTeams.length >= 1) {
                            const mainDriver = availableDrivers[0];
                            const reserveDriver = availableDrivers[1];
                            const team = availableTeams[0];
                            
                            // Create the selection
                            const RaceSelection = require('../models/RaceSelection');
                            targetSelection = new RaceSelection({
                                user: targetPlayerId,
                                league: leagueId,
                                race: race._id,
                                round: round,
                                mainDriver: mainDriver,
                                reserveDriver: reserveDriver,
                                team: team,
                                status: 'admin-assigned',
                                isAdminAssigned: true,
                                notes: 'Auto-assigned for Mirror card effect'
                            });
                            await targetSelection.save();
                            
                            // Update used selections
                            await usedSelection.addUsedDriver(mainDriver, season);
                            await usedSelection.addUsedDriver(reserveDriver, season);
                            await usedSelection.addUsedTeam(team, season);
                            await usedSelection.save();
                            
                            console.log(`[CardEffects] ✅ Auto-assigned selection for target player: ${mainDriver}, ${reserveDriver}, ${team}`);
                        } else {
                            console.log(`[CardEffects] ⚠️ Cannot auto-assign: insufficient available options (drivers: ${availableDrivers.length}, teams: ${availableTeams.length})`);
                        }
                    }
                }
            } catch (error) {
                console.error(`[CardEffects] Error auto-assigning selection for target player:`, error);
            }
        }
        
        // If still no selection after auto-assignment attempt, return 0 points
        if (!targetSelection) {
            console.log(`[CardEffects] Could not get or create selection for target player ${targetPlayerId}, returning 0 points`);
            return { mainDriverPoints: 0, reserveDriverPoints: 0, totalPoints: 0 };
        }

        const raceResult = await require('../models/RaceResult').findOne({ round: round, season: season });
        if (!raceResult) {
            return { mainDriverPoints: 0, reserveDriverPoints: 0, totalPoints: 0 };
        }

        const ScoringService = require('./ScoringService');
        const scoringService = new ScoringService();
        const pointsData = scoringService.calculateRacePoints({
            mainDriver: targetSelection.mainDriver,
            reserveDriver: targetSelection.reserveDriver,
            team: targetSelection.team
        }, raceResult);

        return {
            mainDriverPoints: pointsData.breakdown.mainDriverPoints,
            reserveDriverPoints: pointsData.breakdown.reserveDriverPoints,
            teamPoints: pointsData.breakdown.teamPoints,
            totalPoints: pointsData.totalPoints
        };
    }

    async getEspionageTeamPoints(targetTeam, leagueId, round, season) {
        // Find a selection with the target team in this league/round
        const targetSelection = await RaceSelection.findOne({
            league: leagueId,
            round: round,
            team: targetTeam
        });

        if (!targetSelection) {
            return 0;
        }

        const raceResult = await require('../models/RaceResult').findOne({ round: round, season: season });
        if (!raceResult) {
            return 0;
        }

        const ScoringService = require('./ScoringService');
        const scoringService = new ScoringService();
        const pointsData = scoringService.calculateRacePoints({
            mainDriver: targetSelection.mainDriver,
            reserveDriver: targetSelection.reserveDriver,
            team: targetSelection.team
        }, raceResult);

        return pointsData.breakdown.teamPoints || 0;
    }

    async getRandomDriverCardEffect() {
        const Card = require('../models/Card');
        const driverCards = await Card.find({ type: 'driver', isActive: true });
        const randomCard = driverCards[Math.floor(Math.random() * driverCards.length)];
        return {
            name: randomCard.name,
            effectType: randomCard.effectType,
            effectValue: randomCard.effectValue
        };
    }

    async getRandomTeamCardEffect() {
        const Card = require('../models/Card');
        const teamCards = await Card.find({ type: 'team', isActive: true });
        const randomCard = teamCards[Math.floor(Math.random() * teamCards.length)];
        return {
            name: randomCard.name,
            effectType: randomCard.effectType,
            effectValue: randomCard.effectValue
        };
    }
}

module.exports = CardEffectsService;

