/**
 * Test Driver and Team Name Normalization
 * Verifies that all 2026 drivers and teams can be normalized correctly
 */

const { getF1Validation, getAllF1Data } = require('../src/constants/f1DataLoader');

console.log('🧪 Testing Driver and Team Name Normalization for 2026\n');
console.log('='.repeat(60));

const season = 2026;
const { normalizeDriverName, normalizeTeamName, isValidDriver, isValidTeam, drivers, teams } = getAllF1Data(season);

console.log(`\n📋 Testing ${drivers.length} drivers and ${teams.length} teams for season ${season}\n`);

// Test 1: Normalize all driver names
console.log('1️⃣  Testing Driver Name Normalization:');
console.log('-'.repeat(60));

let driverErrors = [];
drivers.forEach(driver => {
  const driverName = driver.shortName || driver.name;
  const normalized = normalizeDriverName(driverName);
  const isValid = isValidDriver(normalized);
  
  // Test full name
  const fullNameNormalized = normalizeDriverName(driver.name);
  const fullNameValid = isValidDriver(fullNameNormalized);
  
  // Test alternate names
  let altNameErrors = [];
  if (driver.alternateNames) {
    driver.alternateNames.forEach(altName => {
      const altNormalized = normalizeDriverName(altName);
      const altValid = isValidDriver(altNormalized);
      if (!altValid || altNormalized !== normalized) {
        altNameErrors.push(`${altName} -> ${altNormalized} (valid: ${altValid})`);
      }
    });
  }
  
  if (!isValid || !fullNameValid || altNameErrors.length > 0) {
    driverErrors.push({
      driver: driver.name,
      shortName: driverName,
      normalized,
      isValid,
      fullName: driver.name,
      fullNameNormalized,
      fullNameValid,
      altNameErrors
    });
  }
  
  const status = (isValid && fullNameValid && altNameErrors.length === 0) ? '✅' : '❌';
  console.log(`${status} ${driver.name} (${driverName}) -> ${normalized}`);
});

if (driverErrors.length > 0) {
  console.log(`\n⚠️  Found ${driverErrors.length} driver normalization issues:`);
  driverErrors.forEach(err => {
    console.log(`   ❌ ${err.driver}:`);
    console.log(`      Short name: ${err.shortName} -> ${err.normalized} (valid: ${err.isValid})`);
    console.log(`      Full name: ${err.fullName} -> ${err.fullNameNormalized} (valid: ${err.fullNameValid})`);
    if (err.altNameErrors.length > 0) {
      console.log(`      Alternate name issues:`);
      err.altNameErrors.forEach(altErr => console.log(`         - ${altErr}`));
    }
  });
} else {
  console.log(`\n✅ All ${drivers.length} drivers normalized correctly!`);
}

// Test 2: Normalize all team names
console.log('\n\n2️⃣  Testing Team Name Normalization:');
console.log('-'.repeat(60));

let teamErrors = [];
teams.forEach(team => {
  const teamName = team.shortName || team.name;
  const normalized = normalizeTeamName(teamName);
  const isValid = isValidTeam(normalized);
  
  // Test full name
  const fullNameNormalized = normalizeTeamName(team.name);
  const fullNameValid = isValidTeam(fullNameNormalized);
  
  // Test alternate names
  let altNameErrors = [];
  if (team.alternateNames) {
    team.alternateNames.forEach(altName => {
      const altNormalized = normalizeTeamName(altName);
      const altValid = isValidTeam(altNormalized);
      if (!altValid || altNormalized !== normalized) {
        altNameErrors.push(`${altName} -> ${altNormalized} (valid: ${altValid})`);
      }
    });
  }
  
  if (!isValid || !fullNameValid || altNameErrors.length > 0) {
    teamErrors.push({
      team: team.name,
      shortName: teamName,
      normalized,
      isValid,
      fullName: team.name,
      fullNameNormalized,
      fullNameValid,
      altNameErrors
    });
  }
  
  const status = (isValid && fullNameValid && altNameErrors.length === 0) ? '✅' : '❌';
  console.log(`${status} ${team.name} (${team.shortName}) -> ${normalized}`);
});

if (teamErrors.length > 0) {
  console.log(`\n⚠️  Found ${teamErrors.length} team normalization issues:`);
  teamErrors.forEach(err => {
    console.log(`   ❌ ${err.team}:`);
    console.log(`      Short name: ${err.shortName} -> ${err.normalized} (valid: ${err.isValid})`);
    console.log(`      Full name: ${err.fullName} -> ${err.fullNameNormalized} (valid: ${err.fullNameValid})`);
    if (err.altNameErrors.length > 0) {
      console.log(`      Alternate name issues:`);
      err.altNameErrors.forEach(altErr => console.log(`         - ${altErr}`));
    }
  });
} else {
  console.log(`\n✅ All ${teams.length} teams normalized correctly!`);
}

// Test 3: Test edge cases
console.log('\n\n3️⃣  Testing Edge Cases:');
console.log('-'.repeat(60));

const edgeCases = [
  // Driver edge cases
  { name: 'M. Verstappen', type: 'driver', expected: 'M. Verstappen' },
  { name: 'M Verstappen', type: 'driver', expected: 'M. Verstappen' },
  { name: 'max verstappen', type: 'driver', expected: 'M. Verstappen' },
  { name: 'MAX VERSTAPPEN', type: 'driver', expected: 'M. Verstappen' },
  { name: '  M. Verstappen  ', type: 'driver', expected: 'M. Verstappen' },
  { name: 'N. Hulkenberg', type: 'driver', expected: 'N. Hulkenberg' },
  { name: 'N. Hülkenberg', type: 'driver', expected: 'N. Hulkenberg' },
  { name: 'S. Perez', type: 'driver', expected: 'S. Perez' },
  { name: 'S. Pérez', type: 'driver', expected: 'S. Perez' },
  { name: 'Sergio Pérez', type: 'driver', expected: 'S. Perez' },
  { name: 'Checo', type: 'driver', expected: 'S. Perez' },
  
  // Team edge cases
  { name: 'Red Bull', type: 'team', expected: 'Red Bull Racing' },
  { name: 'Red Bull Racing', type: 'team', expected: 'Red Bull Racing' },
  { name: 'red bull', type: 'team', expected: 'Red Bull Racing' },
  { name: 'RB', type: 'team', expected: 'RB' },
  { name: 'Racing Bulls', type: 'team', expected: 'RB' },
  { name: 'Haas', type: 'team', expected: 'Haas F1 Team' },
  { name: 'Haas F1 Team', type: 'team', expected: 'Haas F1 Team' },
  { name: 'MoneyGram Haas', type: 'team', expected: 'Haas F1 Team' },
];

let edgeCaseErrors = [];
edgeCases.forEach(testCase => {
  const normalized = testCase.type === 'driver' 
    ? normalizeDriverName(testCase.name)
    : normalizeTeamName(testCase.name);
  const isValid = testCase.type === 'driver'
    ? isValidDriver(normalized)
    : isValidTeam(normalized);
  
  const passed = normalized === testCase.expected && isValid;
  const status = passed ? '✅' : '❌';
  console.log(`${status} "${testCase.name}" (${testCase.type}) -> "${normalized}" (expected: "${testCase.expected}")`);
  
  if (!passed) {
    edgeCaseErrors.push({
      input: testCase.name,
      type: testCase.type,
      normalized,
      expected: testCase.expected,
      isValid
    });
  }
});

if (edgeCaseErrors.length > 0) {
  console.log(`\n⚠️  Found ${edgeCaseErrors.length} edge case issues:`);
  edgeCaseErrors.forEach(err => {
    console.log(`   ❌ "${err.input}" (${err.type}): got "${err.normalized}", expected "${err.expected}" (valid: ${err.isValid})`);
  });
} else {
  console.log(`\n✅ All edge cases passed!`);
}

// Summary
console.log('\n\n📊 SUMMARY:');
console.log('='.repeat(60));
console.log(`✅ Drivers tested: ${drivers.length}`);
console.log(`✅ Teams tested: ${teams.length}`);
console.log(`✅ Edge cases tested: ${edgeCases.length}`);
console.log(`❌ Driver errors: ${driverErrors.length}`);
console.log(`❌ Team errors: ${teamErrors.length}`);
console.log(`❌ Edge case errors: ${edgeCaseErrors.length}`);

const totalErrors = driverErrors.length + teamErrors.length + edgeCaseErrors.length;
if (totalErrors === 0) {
  console.log('\n🎉 All normalization tests passed!');
} else {
  console.log(`\n⚠️  Found ${totalErrors} total issues that need to be fixed.`);
}

process.exit(totalErrors > 0 ? 1 : 0);


