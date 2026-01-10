/**
 * Test normalization in the context of selection saving
 * Simulates what happens when saveSelections is called
 */

const { getF1Validation, getAllF1Data } = require('../src/constants/f1DataLoader');

console.log('🧪 Testing Normalization in Selection Context\n');
console.log('='.repeat(60));

const season = 2026;
const { normalizeDriverName, normalizeTeamName, isValidDriver, isValidTeam, drivers, teams } = getAllF1Data(season);

console.log(`\n📋 Testing with season ${season} data\n`);

// Simulate what the simulation script sends
const testCases = [
  {
    mainDriver: 'M. Verstappen',
    reserveDriver: 'G. Russell',
    team: 'Red Bull'
  },
  {
    mainDriver: 'Max Verstappen',
    reserveDriver: 'George Russell',
    team: 'Red Bull Racing'
  },
  {
    mainDriver: 'L. Norris',
    reserveDriver: 'O. Piastri',
    team: 'McLaren'
  },
  {
    mainDriver: 'S. Perez',
    reserveDriver: 'S. Pérez',
    team: 'Cadillac'
  },
  {
    mainDriver: 'N. Hulkenberg',
    reserveDriver: 'N. Hülkenberg',
    team: 'Audi'
  },
  {
    mainDriver: 'Checo',
    reserveDriver: 'Sergio Pérez',
    team: 'Racing Bulls'
  }
];

let errors = 0;
let successes = 0;

testCases.forEach((testCase, idx) => {
  console.log(`\nTest Case ${idx + 1}:`);
  console.log(`  Input: ${testCase.mainDriver}, ${testCase.reserveDriver}, ${testCase.team}`);
  
  try {
    // Simulate what selectionController does
    const normalizedMainDriver = normalizeDriverName(testCase.mainDriver);
    const normalizedReserveDriver = normalizeDriverName(testCase.reserveDriver);
    const normalizedTeam = normalizeTeamName(testCase.team);
    
    console.log(`  Normalized: ${normalizedMainDriver}, ${normalizedReserveDriver}, ${normalizedTeam}`);
    
    // Check if normalization returned null
    if (!normalizedMainDriver || !normalizedReserveDriver || !normalizedTeam) {
      console.log(`  ❌ FAILED: One or more values are null`);
      errors++;
      return;
    }
    
    // Validate
    const mainValid = isValidDriver(normalizedMainDriver);
    const reserveValid = isValidDriver(normalizedReserveDriver);
    const teamValid = isValidTeam(normalizedTeam);
    
    console.log(`  Validation: Main=${mainValid}, Reserve=${reserveValid}, Team=${teamValid}`);
    
    if (mainValid && reserveValid && teamValid) {
      console.log(`  ✅ PASSED`);
      successes++;
    } else {
      console.log(`  ❌ FAILED: Validation failed`);
      errors++;
    }
    
    // Check if main and reserve are different
    if (normalizedMainDriver === normalizedReserveDriver) {
      console.log(`  ⚠️  WARNING: Main and reserve drivers are the same`);
    }
    
  } catch (error) {
    console.log(`  ❌ ERROR: ${error.message}`);
    errors++;
  }
});

console.log('\n' + '='.repeat(60));
console.log(`📊 RESULTS:`);
console.log(`✅ Successes: ${successes}/${testCases.length}`);
console.log(`❌ Errors: ${errors}/${testCases.length}`);

if (errors === 0) {
  console.log('\n🎉 All normalization tests passed in context!');
  process.exit(0);
} else {
  console.log('\n⚠️  Some tests failed');
  process.exit(1);
}


