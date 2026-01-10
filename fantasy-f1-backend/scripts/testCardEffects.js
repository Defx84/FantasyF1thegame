/**
 * Manual test script for card effects
 * Run with: node scripts/testCardEffects.js
 */

const CardEffectsService = require('../src/services/CardEffectsService');
const ScoringService = require('../src/services/ScoringService');

// Mock data
const createMockRaceResult = () => ({
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
  ],
  teamResults: [
    { team: 'Ferrari', racePoints: 33, sprintPoints: 0, totalPoints: 33, position: 1 },
    { team: 'McLaren', racePoints: 22, sprintPoints: 0, totalPoints: 22, position: 2 },
    { team: 'Red Bull', racePoints: 25, sprintPoints: 0, totalPoints: 25, position: 3 },
    { team: 'Mercedes', racePoints: 14, sprintPoints: 0, totalPoints: 14, position: 4 },
    { team: 'Racing Bulls', racePoints: 3, sprintPoints: 0, totalPoints: 3, position: 5 },
    { team: 'Aston Martin', racePoints: 0, sprintPoints: 0, totalPoints: 0, position: 6 },
    { team: 'Haas', racePoints: 0, sprintPoints: 0, totalPoints: 0, position: 7 },
  ]
});

async function testCardEffect(name, testFn) {
  try {
    console.log(`\n🧪 Testing: ${name}`);
    console.log('─'.repeat(60));
    await testFn();
    console.log(`✅ ${name} - PASSED`);
  } catch (error) {
    console.log(`❌ ${name} - FAILED`);
    console.log(`   Error: ${error.message}`);
    if (error.stack) {
      console.log(`   Stack: ${error.stack.split('\n')[1]}`);
    }
  }
}

async function runTests() {
  console.log('🚀 Card Effects Test Suite');
  console.log('='.repeat(60));

  const cardEffectsService = new CardEffectsService();
  const scoringService = new ScoringService();
  const raceResult = createMockRaceResult();

  // Test 1: 2× Points
  await testCardEffect('2× Points (Gold) - Double main driver points', async () => {
    const result = await cardEffectsService.applyDriverCardEffect({
      baseMainDriverPoints: 18, // Lewis Hamilton P2
      baseReserveDriverPoints: 0,
      raceResult,
      selection: { mainDriver: 'Lewis Hamilton', reserveDriver: 'George Russell', team: 'Ferrari' },
      raceCardSelection: {
        driverCard: { name: '2× Points', tier: 'gold', effectType: 'multiply', effectValue: 2 }
      },
      leagueId: 'test',
      userId: 'test'
    });
    if (result.mainDriverPoints !== 36) {
      throw new Error(`Expected 36, got ${result.mainDriverPoints}`);
    }
    if (!result.driverCardEffect.effectApplied) {
      throw new Error('Effect should be applied');
    }
  });

  // Test 2: Teamwork 2
  await testCardEffect('Teamwork 2 (Gold) - Main driver + teammate', async () => {
    const result = await cardEffectsService.applyDriverCardEffect({
      baseMainDriverPoints: 18, // Lewis Hamilton P2
      baseReserveDriverPoints: 0,
      raceResult,
      selection: { mainDriver: 'Lewis Hamilton', reserveDriver: 'George Russell', team: 'Ferrari' },
      raceCardSelection: {
        driverCard: { name: 'Teamwork 2', tier: 'gold', effectType: 'teamwork2', effectValue: null }
      },
      leagueId: 'test',
      userId: 'test'
    });
    // Lewis (18) + Charles (15) = 33
    if (result.mainDriverPoints !== 33) {
      throw new Error(`Expected 33, got ${result.mainDriverPoints}`);
    }
  });

  // Test 3: Top 5 Boost
  await testCardEffect('Top 5 Boost (Silver) - Conditional bonus', async () => {
    const result = await cardEffectsService.applyDriverCardEffect({
      baseMainDriverPoints: 10, // Oscar Piastri P5
      baseReserveDriverPoints: 0,
      raceResult,
      selection: { mainDriver: 'Oscar Piastri', reserveDriver: 'George Russell', team: 'McLaren' },
      raceCardSelection: {
        driverCard: { 
          name: 'Top 5 Boost', 
          tier: 'silver', 
          effectType: 'conditional_bonus', 
          effectValue: { condition: 'top5', bonus: 7 } 
        }
      },
      leagueId: 'test',
      userId: 'test'
    });
    if (result.mainDriverPoints !== 17) {
      throw new Error(`Expected 17, got ${result.mainDriverPoints}`);
    }
  });

  // Test 4: +3 Points
  await testCardEffect('+3 Points (Bronze) - Flat bonus', async () => {
    const result = await cardEffectsService.applyDriverCardEffect({
      baseMainDriverPoints: 18,
      baseReserveDriverPoints: 0,
      raceResult,
      selection: { mainDriver: 'Lewis Hamilton', reserveDriver: 'George Russell', team: 'Ferrari' },
      raceCardSelection: {
        driverCard: { name: '+3 Points', tier: 'bronze', effectType: 'flat_bonus', effectValue: 3 }
      },
      leagueId: 'test',
      userId: 'test'
    });
    if (result.mainDriverPoints !== 21) {
      throw new Error(`Expected 21, got ${result.mainDriverPoints}`);
    }
  });

  // Test 5: Podium (Team)
  await testCardEffect('Podium (Gold) - Team card bonus', async () => {
    const result = await cardEffectsService.applyTeamCardEffect({
      baseTeamPoints: 33, // Ferrari
      raceResult,
      selection: { mainDriver: 'Lewis Hamilton', reserveDriver: 'George Russell', team: 'Ferrari' },
      raceCardSelection: {
        teamCard: { 
          name: 'Podium', 
          tier: 'gold', 
          effectType: 'podium', 
          effectValue: { pointsPerPodium: 8, maxPoints: 16 } 
        }
      },
      leagueId: 'test',
      userId: 'test'
    });
    // 33 + 16 (2 podiums * 8, max 16) = 49
    if (result.teamPoints !== 49) {
      throw new Error(`Expected 49, got ${result.teamPoints}`);
    }
  });

  // Test 6: Top 5 (Team)
  await testCardEffect('Top 5 (Gold) - Both cars Top 5', async () => {
    const result = await cardEffectsService.applyTeamCardEffect({
      baseTeamPoints: 22, // McLaren
      raceResult,
      selection: { mainDriver: 'Lando Norris', reserveDriver: 'George Russell', team: 'McLaren' },
      raceCardSelection: {
        teamCard: { 
          name: 'Top 5', 
          tier: 'gold', 
          effectType: 'conditional_bonus', 
          effectValue: { condition: 'both_top5', bonus: 10 } 
        }
      },
      leagueId: 'test',
      userId: 'test'
    });
    if (result.teamPoints !== 32) {
      throw new Error(`Expected 32, got ${result.teamPoints}`);
    }
  });

  // Test 7: Sponsors (Team)
  await testCardEffect('Sponsors (Bronze) - Zero points bonus', async () => {
    const result = await cardEffectsService.applyTeamCardEffect({
      baseTeamPoints: 0, // Aston Martin
      raceResult,
      selection: { mainDriver: 'Fernando Alonso', reserveDriver: 'George Russell', team: 'Aston Martin' },
      raceCardSelection: {
        teamCard: { 
          name: 'Sponsors', 
          tier: 'bronze', 
          effectType: 'conditional_bonus', 
          effectValue: { condition: 'sponsors', bonus: { zero: 5, one: 1 } } 
        }
      },
      leagueId: 'test',
      userId: 'test'
    });
    if (result.teamPoints !== 5) {
      throw new Error(`Expected 5, got ${result.teamPoints}`);
    }
  });

  // Test 8: Integration - Both cards together
  await testCardEffect('Integration - Driver + Team cards together', async () => {
    const result = await scoringService.calculateRacePoints(
      { mainDriver: 'Lewis Hamilton', reserveDriver: 'George Russell', team: 'Ferrari' },
      raceResult,
      {
        driverCard: { name: '2× Points', tier: 'gold', effectType: 'multiply', effectValue: 2 },
        teamCard: { name: 'Podium', tier: 'gold', effectType: 'podium', effectValue: { pointsPerPodium: 8, maxPoints: 16 } }
      },
      { userId: 'test', leagueId: 'test' }
    );
    // Driver: 18 * 2 = 36
    // Team: 33 + 16 = 49
    // Total: 36 + 0 + 49 = 85
    if (result.totalPoints !== 85) {
      throw new Error(`Expected 85, got ${result.totalPoints}`);
    }
    if (!result.breakdown.driverCard || !result.breakdown.teamCard) {
      throw new Error('Card effects should be in breakdown');
    }
  });

  // Test 9: Sprint weekend blocking
  await testCardEffect('Sprint weekend - Cards should not apply', async () => {
    const sprintRaceResult = { ...raceResult, isSprintWeekend: true };
    const result = await scoringService.calculateRacePoints(
      { mainDriver: 'Lewis Hamilton', reserveDriver: 'George Russell', team: 'Ferrari' },
      sprintRaceResult,
      {
        driverCard: { name: '2× Points', tier: 'gold', effectType: 'multiply', effectValue: 2 }
      },
      { userId: 'test', leagueId: 'test' }
    );
    if (result.breakdown.driverCard !== null) {
      throw new Error('Cards should not apply on sprint weekends');
    }
  });

  // Test 10: 2025 season blocking
  await testCardEffect('2025 season - Cards should not apply', async () => {
    const oldRaceResult = { ...raceResult, season: 2025 };
    const result = await scoringService.calculateRacePoints(
      { mainDriver: 'Lewis Hamilton', reserveDriver: 'George Russell', team: 'Ferrari' },
      oldRaceResult,
      {
        driverCard: { name: '2× Points', tier: 'gold', effectType: 'multiply', effectValue: 2 }
      },
      { userId: 'test', leagueId: 'test' }
    );
    if (result.breakdown.driverCard !== null) {
      throw new Error('Cards should not apply for 2025 season');
    }
  });

  console.log('\n' + '='.repeat(60));
  console.log('✅ Test suite completed!');
}

// Run tests
runTests().catch(console.error);


