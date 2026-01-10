const CardEffectsService = require('../src/services/CardEffectsService');
const ScoringService = require('../src/services/ScoringService');

describe('Card Effects Service', () => {
  let cardEffectsService;
  let scoringService;

  beforeEach(() => {
    cardEffectsService = new CardEffectsService();
    scoringService = new ScoringService();
  });

  // Mock race result data
  const createMockRaceResult = (overrides = {}) => ({
    season: 2026,
    round: 1,
    raceName: 'Test Grand Prix',
    isSprintWeekend: false,
    results: [
      { driver: 'Max Verstappen', position: 1, points: 25, team: 'Red Bull', didNotStart: false, didNotFinish: false },
      { driver: 'Lewis Hamilton', position: 2, points: 18, team: 'Ferrari', didNotStart: false, didNotFinish: false },
      { driver: 'Charles Leclerc', position: 3, points: 15, team: 'Ferrari', didNotStart: false, didNotFinish: false },
      { driver: 'Lando Norris', position: 4, points: 12, team: 'McLaren', didNotStart: false, didNotFinish: false },
      { driver: 'Oscar Piastri', position: 5, points: 10, team: 'McLaren', didNotStart: false, didNotFinish: false },
      { driver: 'George Russell', position: 6, points: 8, team: 'Mercedes', didNotStart: false, didNotFinish: false },
      { driver: 'Kimi Antonelli', position: 7, points: 6, team: 'Mercedes', didNotStart: false, didNotFinish: false },
      { driver: 'Alex Albon', position: 8, points: 4, team: 'Williams', didNotStart: false, didNotFinish: false },
      { driver: 'Carlos Sainz', position: 9, points: 2, team: 'Racing Bulls', didNotStart: false, didNotFinish: false },
      { driver: 'Liam Lawson', position: 10, points: 1, team: 'Racing Bulls', didNotStart: false, didNotFinish: false },
      { driver: 'Fernando Alonso', position: 11, points: 0, team: 'Aston Martin', didNotStart: false, didNotFinish: false },
      { driver: 'Lance Stroll', position: 12, points: 0, team: 'Aston Martin', didNotStart: false, didNotFinish: false },
      { driver: 'Esteban Ocon', position: 13, points: 0, team: 'Haas', didNotStart: false, didNotFinish: false },
      { driver: 'Oliver Bearman', position: 14, points: 0, team: 'Haas', didNotStart: false, didNotFinish: false },
      { driver: 'Nico Hülkenberg', position: 15, points: 0, team: 'Audi', didNotStart: false, didNotFinish: false },
      { driver: 'Gabriel Bortoleto', position: 16, points: 0, team: 'Audi', didNotStart: false, didNotFinish: false },
      { driver: 'Pierre Gasly', position: 17, points: 0, team: 'Alpine', didNotStart: false, didNotFinish: false },
      { driver: 'Franco Colapinto', position: 18, points: 0, team: 'Alpine', didNotStart: false, didNotFinish: false },
      { driver: 'Sergio Pérez', position: 19, points: 0, team: 'Cadillac', didNotStart: false, didNotFinish: false },
      { driver: 'Valtteri Bottas', position: 20, points: 0, team: 'Cadillac', didNotStart: false, didNotFinish: false }
    ],
    teamResults: [
      { team: 'Ferrari', racePoints: 33, sprintPoints: 0, totalPoints: 33, position: 1 },
      { team: 'McLaren', racePoints: 22, sprintPoints: 0, totalPoints: 22, position: 2 },
      { team: 'Red Bull', racePoints: 25, sprintPoints: 0, totalPoints: 25, position: 3 },
      { team: 'Mercedes', racePoints: 14, sprintPoints: 0, totalPoints: 14, position: 4 },
      { team: 'Racing Bulls', racePoints: 3, sprintPoints: 0, totalPoints: 3, position: 5 },
      { team: 'Aston Martin', racePoints: 0, sprintPoints: 0, totalPoints: 0, position: 6 },
      { team: 'Haas', racePoints: 0, sprintPoints: 0, totalPoints: 0, position: 7 },
      { team: 'Audi', racePoints: 0, sprintPoints: 0, totalPoints: 0, position: 8 },
      { team: 'Alpine', racePoints: 0, sprintPoints: 0, totalPoints: 0, position: 9 },
      { team: 'Cadillac', racePoints: 0, sprintPoints: 0, totalPoints: 0, position: 10 },
      { team: 'Williams', racePoints: 4, sprintPoints: 0, totalPoints: 4, position: 11 }
    ],
    ...overrides
  });

  const createMockSelection = (overrides = {}) => ({
    mainDriver: 'Lewis Hamilton',
    reserveDriver: 'George Russell',
    team: 'Ferrari',
    ...overrides
  });

  const createMockRaceCardSelection = (driverCard = null, teamCard = null, targets = {}) => ({
    driverCard,
    teamCard,
    targetPlayer: targets.targetPlayer || null,
    targetDriver: targets.targetDriver || null,
    targetTeam: targets.targetTeam || null
  });

  describe('Driver Cards', () => {
    describe('2× Points (Gold)', () => {
      it('should double main driver points', async () => {
        const raceResult = createMockRaceResult();
        const selection = createMockSelection({ mainDriver: 'Lewis Hamilton' });
        const raceCardSelection = createMockRaceCardSelection({
          name: '2× Points',
          tier: 'gold',
          effectType: 'multiply',
          effectValue: 2
        });

        const result = await cardEffectsService.applyDriverCardEffect({
          baseMainDriverPoints: 18, // Lewis Hamilton P2
          baseReserveDriverPoints: 0,
          raceResult,
          selection,
          raceCardSelection,
          leagueId: 'test-league',
          userId: 'test-user'
        });

        expect(result.mainDriverPoints).toBe(36); // 18 * 2
        expect(result.driverCardEffect.effectApplied).toBe(true);
        expect(result.driverCardEffect.description).toContain('doubled');
      });
    });

    describe('Teamwork 2 (Gold)', () => {
      it('should add main driver and teammate points', async () => {
        const raceResult = createMockRaceResult();
        const selection = createMockSelection({ mainDriver: 'Lewis Hamilton', team: 'Ferrari' });
        const raceCardSelection = createMockRaceCardSelection({
          name: 'Teamwork 2',
          tier: 'gold',
          effectType: 'teamwork2',
          effectValue: null
        });

        const result = await cardEffectsService.applyDriverCardEffect({
          baseMainDriverPoints: 18, // Lewis Hamilton P2
          baseReserveDriverPoints: 0,
          raceResult,
          selection,
          raceCardSelection,
          leagueId: 'test-league',
          userId: 'test-user'
        });

        // Lewis (18) + Charles (15) = 33
        expect(result.mainDriverPoints).toBe(33);
        expect(result.driverCardEffect.effectApplied).toBe(true);
      });
    });

    describe('Teamwork (Silver)', () => {
      it('should use teammate points instead of main driver', async () => {
        const raceResult = createMockRaceResult();
        const selection = createMockSelection({ mainDriver: 'Lewis Hamilton', team: 'Ferrari' });
        const raceCardSelection = createMockRaceCardSelection({
          name: 'Teamwork',
          tier: 'silver',
          effectType: 'teamwork',
          effectValue: null
        });

        const result = await cardEffectsService.applyDriverCardEffect({
          baseMainDriverPoints: 18, // Lewis Hamilton P2
          baseReserveDriverPoints: 0,
          raceResult,
          selection,
          raceCardSelection,
          leagueId: 'test-league',
          userId: 'test-user'
        });

        // Should use Charles Leclerc's points (15) instead
        expect(result.mainDriverPoints).toBe(15);
        expect(result.driverCardEffect.effectApplied).toBe(true);
      });
    });

    describe('Switcheroo (Gold)', () => {
      it('should use target driver points', async () => {
        const raceResult = createMockRaceResult();
        const selection = createMockSelection({ mainDriver: 'Lewis Hamilton' });
        const raceCardSelection = createMockRaceCardSelection({
          name: 'Switcheroo',
          tier: 'gold',
          effectType: 'switcheroo',
          effectValue: null
        }, null, { targetDriver: 'Max Verstappen' });

        const result = await cardEffectsService.applyDriverCardEffect({
          baseMainDriverPoints: 18, // Lewis Hamilton P2
          baseReserveDriverPoints: 0,
          raceResult,
          selection,
          raceCardSelection,
          leagueId: 'test-league',
          userId: 'test-user'
        });

        // Should use Max Verstappen's points (25) instead
        expect(result.mainDriverPoints).toBe(25);
        expect(result.driverCardEffect.effectApplied).toBe(true);
        expect(result.driverCardEffect.description).toContain('Max Verstappen');
      });
    });

    describe('Move Up 1 Rank (Silver)', () => {
      it('should adjust position and recalculate points', async () => {
        const raceResult = createMockRaceResult();
        const selection = createMockSelection({ mainDriver: 'Lando Norris' }); // P4 (12 points)
        const raceCardSelection = createMockRaceCardSelection({
          name: 'Move Up 1 Rank',
          tier: 'silver',
          effectType: 'position_adjust',
          effectValue: 1
        });

        const result = await cardEffectsService.applyDriverCardEffect({
          baseMainDriverPoints: 12, // Lando Norris P4
          baseReserveDriverPoints: 0,
          raceResult,
          selection,
          raceCardSelection,
          leagueId: 'test-league',
          userId: 'test-user'
        });

        // P4 → P3 = 15 points
        expect(result.mainDriverPoints).toBe(15);
        expect(result.driverCardEffect.effectApplied).toBe(true);
        expect(result.driverCardEffect.description).toContain('P4 → P3');
      });
    });

    describe('Top 5 Boost (Silver)', () => {
      it('should add +7 points if driver finishes Top 5', async () => {
        const raceResult = createMockRaceResult();
        const selection = createMockSelection({ mainDriver: 'Oscar Piastri' }); // P5
        const raceCardSelection = createMockRaceCardSelection({
          name: 'Top 5 Boost',
          tier: 'silver',
          effectType: 'conditional_bonus',
          effectValue: { condition: 'top5', bonus: 7 }
        });

        const result = await cardEffectsService.applyDriverCardEffect({
          baseMainDriverPoints: 10, // Oscar Piastri P5
          baseReserveDriverPoints: 0,
          raceResult,
          selection,
          raceCardSelection,
          leagueId: 'test-league',
          userId: 'test-user'
        });

        expect(result.mainDriverPoints).toBe(17); // 10 + 7
        expect(result.driverCardEffect.effectApplied).toBe(true);
      });

      it('should not add points if driver finishes outside Top 5', async () => {
        const raceResult = createMockRaceResult();
        const selection = createMockSelection({ mainDriver: 'George Russell' }); // P6
        const raceCardSelection = createMockRaceCardSelection({
          name: 'Top 5 Boost',
          tier: 'silver',
          effectType: 'conditional_bonus',
          effectValue: { condition: 'top5', bonus: 7 }
        });

        const result = await cardEffectsService.applyDriverCardEffect({
          baseMainDriverPoints: 8, // George Russell P6
          baseReserveDriverPoints: 0,
          raceResult,
          selection,
          raceCardSelection,
          leagueId: 'test-league',
          userId: 'test-user'
        });

        expect(result.mainDriverPoints).toBe(8); // No bonus
        expect(result.driverCardEffect.effectApplied).toBe(false);
      });
    });

    describe('Top 10 Boost (Bronze)', () => {
      it('should add +3 points if driver finishes Top 10', async () => {
        const raceResult = createMockRaceResult();
        const selection = createMockSelection({ mainDriver: 'Liam Lawson' }); // P10
        const raceCardSelection = createMockRaceCardSelection({
          name: 'Top 10 Boost',
          tier: 'bronze',
          effectType: 'conditional_bonus',
          effectValue: { condition: 'top10', bonus: 3 }
        });

        const result = await cardEffectsService.applyDriverCardEffect({
          baseMainDriverPoints: 1, // Liam Lawson P10
          baseReserveDriverPoints: 0,
          raceResult,
          selection,
          raceCardSelection,
          leagueId: 'test-league',
          userId: 'test-user'
        });

        expect(result.mainDriverPoints).toBe(4); // 1 + 3
        expect(result.driverCardEffect.effectApplied).toBe(true);
      });
    });

    describe('+3 Points (Bronze)', () => {
      it('should add flat +3 points', async () => {
        const raceResult = createMockRaceResult();
        const selection = createMockSelection();
        const raceCardSelection = createMockRaceCardSelection({
          name: '+3 Points',
          tier: 'bronze',
          effectType: 'flat_bonus',
          effectValue: 3
        });

        const result = await cardEffectsService.applyDriverCardEffect({
          baseMainDriverPoints: 18,
          baseReserveDriverPoints: 0,
          raceResult,
          selection,
          raceCardSelection,
          leagueId: 'test-league',
          userId: 'test-user'
        });

        expect(result.mainDriverPoints).toBe(21); // 18 + 3
        expect(result.driverCardEffect.effectApplied).toBe(true);
      });
    });

    describe('Competitiveness (Bronze)', () => {
      it('should add +2 points if driver finishes ahead of teammate', async () => {
        const raceResult = createMockRaceResult();
        const selection = createMockSelection({ mainDriver: 'Lewis Hamilton', team: 'Ferrari' }); // P2, ahead of Charles P3
        const raceCardSelection = createMockRaceCardSelection({
          name: 'Competitiveness',
          tier: 'bronze',
          effectType: 'conditional_bonus',
          effectValue: { condition: 'ahead_of_teammate', bonus: 2 }
        });

        const result = await cardEffectsService.applyDriverCardEffect({
          baseMainDriverPoints: 18, // Lewis Hamilton P2
          baseReserveDriverPoints: 0,
          raceResult,
          selection,
          raceCardSelection,
          leagueId: 'test-league',
          userId: 'test-user'
        });

        expect(result.mainDriverPoints).toBe(20); // 18 + 2
        expect(result.driverCardEffect.effectApplied).toBe(true);
      });
    });

    describe('Bottom 5 (Bronze)', () => {
      it('should add +2 points if driver finishes in bottom 5', async () => {
        const raceResult = createMockRaceResult();
        const selection = createMockSelection({ mainDriver: 'Sergio Pérez' }); // P19 (bottom 5)
        const raceCardSelection = createMockRaceCardSelection({
          name: 'Bottom 5',
          tier: 'bronze',
          effectType: 'conditional_bonus',
          effectValue: { condition: 'bottom5', bonus: 2 }
        });

        const result = await cardEffectsService.applyDriverCardEffect({
          baseMainDriverPoints: 0, // Sergio Pérez P19
          baseReserveDriverPoints: 0,
          raceResult,
          selection,
          raceCardSelection,
          leagueId: 'test-league',
          userId: 'test-user'
        });

        expect(result.mainDriverPoints).toBe(2); // 0 + 2
        expect(result.driverCardEffect.effectApplied).toBe(true);
      });
    });
  });

  describe('Team Cards', () => {
    describe('Podium (Gold)', () => {
      it('should add +8 points per podium car (max +16)', async () => {
        const raceResult = createMockRaceResult();
        const selection = createMockSelection({ team: 'Ferrari' }); // Lewis P2, Charles P3 (both podium)
        const raceCardSelection = createMockRaceCardSelection(null, {
          name: 'Podium',
          tier: 'gold',
          effectType: 'podium',
          effectValue: { pointsPerPodium: 8, maxPoints: 16 }
        });

        const result = await cardEffectsService.applyTeamCardEffect({
          baseTeamPoints: 33, // Ferrari team points
          raceResult,
          selection,
          raceCardSelection,
          leagueId: 'test-league',
          userId: 'test-user'
        });

        expect(result.teamPoints).toBe(49); // 33 + 16 (2 podiums * 8, capped at 16)
        expect(result.teamCardEffect.effectApplied).toBe(true);
      });
    });

    describe('Top 5 (Gold)', () => {
      it('should add +10 points if both cars finish Top 5', async () => {
        const raceResult = createMockRaceResult();
        const selection = createMockSelection({ team: 'McLaren' }); // Lando P4, Oscar P5
        const raceCardSelection = createMockRaceCardSelection(null, {
          name: 'Top 5',
          tier: 'gold',
          effectType: 'conditional_bonus',
          effectValue: { condition: 'both_top5', bonus: 10 }
        });

        const result = await cardEffectsService.applyTeamCardEffect({
          baseTeamPoints: 22, // McLaren team points
          raceResult,
          selection,
          raceCardSelection,
          leagueId: 'test-league',
          userId: 'test-user'
        });

        expect(result.teamPoints).toBe(32); // 22 + 10
        expect(result.teamCardEffect.effectApplied).toBe(true);
      });
    });

    describe('Top 10 (Silver)', () => {
      it('should add +5 points if both cars finish Top 10', async () => {
        const raceResult = createMockRaceResult();
        const selection = createMockSelection({ team: 'Racing Bulls' }); // Carlos P9, Liam P10
        const raceCardSelection = createMockRaceCardSelection(null, {
          name: 'Top 10',
          tier: 'silver',
          effectType: 'conditional_bonus',
          effectValue: { condition: 'both_top10', bonus: 5 }
        });

        const result = await cardEffectsService.applyTeamCardEffect({
          baseTeamPoints: 3, // Racing Bulls team points
          raceResult,
          selection,
          raceCardSelection,
          leagueId: 'test-league',
          userId: 'test-user'
        });

        expect(result.teamPoints).toBe(8); // 3 + 5
        expect(result.teamCardEffect.effectApplied).toBe(true);
      });
    });

    describe('Sponsors (Bronze)', () => {
      it('should add +5 points if team scores 0', async () => {
        const raceResult = createMockRaceResult();
        const selection = createMockSelection({ team: 'Aston Martin' }); // 0 points
        const raceCardSelection = createMockRaceCardSelection(null, {
          name: 'Sponsors',
          tier: 'bronze',
          effectType: 'conditional_bonus',
          effectValue: { condition: 'sponsors', bonus: { zero: 5, one: 1 } }
        });

        const result = await cardEffectsService.applyTeamCardEffect({
          baseTeamPoints: 0, // Aston Martin team points
          raceResult,
          selection,
          raceCardSelection,
          leagueId: 'test-league',
          userId: 'test-user'
        });

        expect(result.teamPoints).toBe(5); // 0 + 5
        expect(result.teamCardEffect.effectApplied).toBe(true);
      });

      it('should add +1 point if team scores 1', async () => {
        const raceResult = createMockRaceResult();
        const selection = createMockSelection({ team: 'Williams' }); // 4 points (but test with 1)
        const raceCardSelection = createMockRaceCardSelection(null, {
          name: 'Sponsors',
          tier: 'bronze',
          effectType: 'conditional_bonus',
          effectValue: { condition: 'sponsors', bonus: { zero: 5, one: 1 } }
        });

        const result = await cardEffectsService.applyTeamCardEffect({
          baseTeamPoints: 1, // Test with 1 point
          raceResult,
          selection,
          raceCardSelection,
          leagueId: 'test-league',
          userId: 'test-user'
        });

        expect(result.teamPoints).toBe(2); // 1 + 1
        expect(result.teamCardEffect.effectApplied).toBe(true);
      });
    });

    describe('Participating Trophy (Bronze)', () => {
      it('should add +5 points if both cars finish outside points', async () => {
        const raceResult = createMockRaceResult();
        const selection = createMockSelection({ team: 'Haas' }); // Both outside points
        const raceCardSelection = createMockRaceCardSelection(null, {
          name: 'Participating Trophy',
          tier: 'bronze',
          effectType: 'conditional_bonus',
          effectValue: { condition: 'both_outside_points', bonus: 5 }
        });

        const result = await cardEffectsService.applyTeamCardEffect({
          baseTeamPoints: 0, // Haas team points
          raceResult,
          selection,
          raceCardSelection,
          leagueId: 'test-league',
          userId: 'test-user'
        });

        expect(result.teamPoints).toBe(5); // 0 + 5
        expect(result.teamCardEffect.effectApplied).toBe(true);
      });
    });

    describe('Last Place Bonus (Bronze)', () => {
      it('should add +3 points if one car finishes last', async () => {
        const raceResult = createMockRaceResult();
        const selection = createMockSelection({ team: 'Cadillac' }); // Bottas P20 (last)
        const raceCardSelection = createMockRaceCardSelection(null, {
          name: 'Last Place Bonus',
          tier: 'bronze',
          effectType: 'conditional_bonus',
          effectValue: { condition: 'one_last_place', bonus: 3 }
        });

        const result = await cardEffectsService.applyTeamCardEffect({
          baseTeamPoints: 0, // Cadillac team points
          raceResult,
          selection,
          raceCardSelection,
          leagueId: 'test-league',
          userId: 'test-user'
        });

        expect(result.teamPoints).toBe(3); // 0 + 3
        expect(result.teamCardEffect.effectApplied).toBe(true);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should not apply cards on sprint weekends', async () => {
      const raceResult = createMockRaceResult({ isSprintWeekend: true });
      const selection = createMockSelection();
      const raceCardSelection = createMockRaceCardSelection({
        name: '2× Points',
        tier: 'gold',
        effectType: 'multiply',
        effectValue: 2
      });

      const result = await scoringService.calculateRacePoints(
        selection,
        raceResult,
        raceCardSelection,
        { userId: 'test-user', leagueId: 'test-league' }
      );

      // Cards should not be applied on sprint weekends
      expect(result.breakdown.driverCard).toBe(null);
      expect(result.breakdown.teamCard).toBe(null);
    });

    it('should not apply cards for 2025 season', async () => {
      const raceResult = createMockRaceResult({ season: 2025 });
      const selection = createMockSelection();
      const raceCardSelection = createMockRaceCardSelection({
        name: '2× Points',
        tier: 'gold',
        effectType: 'multiply',
        effectValue: 2
      });

      const result = await scoringService.calculateRacePoints(
        selection,
        raceResult,
        raceCardSelection,
        { userId: 'test-user', leagueId: 'test-league' }
      );

      // Cards should not be applied for 2025
      expect(result.breakdown.driverCard).toBe(null);
      expect(result.breakdown.teamCard).toBe(null);
    });

    it('should handle DNF/DNS/DSQ correctly with cards', async () => {
      const raceResult = createMockRaceResult({
        results: [
          { driver: 'Lewis Hamilton', position: 'DNF', points: 0, team: 'Ferrari', didNotStart: false, didNotFinish: true }
        ]
      });
      const selection = createMockSelection({ mainDriver: 'Lewis Hamilton' });
      const raceCardSelection = createMockRaceCardSelection({
        name: '+3 Points',
        tier: 'bronze',
        effectType: 'flat_bonus',
        effectValue: 3
      });

      const result = await cardEffectsService.applyDriverCardEffect({
        baseMainDriverPoints: 0, // DNF = 0 points
        baseReserveDriverPoints: 0,
        raceResult,
        selection,
        raceCardSelection,
        leagueId: 'test-league',
        userId: 'test-user'
      });

      // Even with DNF, flat bonus should apply
      expect(result.mainDriverPoints).toBe(3); // 0 + 3
      expect(result.driverCardEffect.effectApplied).toBe(true);
    });
  });

  describe('Integration with ScoringService', () => {
    it('should apply both driver and team cards together', async () => {
      const raceResult = createMockRaceResult();
      const selection = createMockSelection({ mainDriver: 'Lewis Hamilton', team: 'Ferrari' });
      const raceCardSelection = createMockRaceCardSelection(
        {
          name: '2× Points',
          tier: 'gold',
          effectType: 'multiply',
          effectValue: 2
        },
        {
          name: 'Podium',
          tier: 'gold',
          effectType: 'podium',
          effectValue: { pointsPerPodium: 8, maxPoints: 16 }
        }
      );

      const result = await scoringService.calculateRacePoints(
        selection,
        raceResult,
        raceCardSelection,
        { userId: 'test-user', leagueId: 'test-league' }
      );

      // Driver: 18 * 2 = 36
      // Team: 33 + 16 (2 podiums) = 49
      // Total: 36 + 0 + 49 = 85
      expect(result.totalPoints).toBe(85);
      expect(result.breakdown.driverCard).not.toBe(null);
      expect(result.breakdown.teamCard).not.toBe(null);
      expect(result.breakdown.basePoints).not.toBe(undefined);
    });
  });
});


