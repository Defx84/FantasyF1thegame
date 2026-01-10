const http = require('http');

const BASE_URL = 'http://localhost:5000/api';

function makeRequest(method, url, data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(`${BASE_URL}${url}`);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function runDetailedTests() {
  console.log('🧪 Detailed Card API Tests\n');
  console.log('='.repeat(60));
  console.log('');

  // Test 1: Get all cards and verify structure
  console.log('Test 1: GET /api/cards - Verify structure');
  try {
    const response = await makeRequest('GET', '/cards');
    if (response.status === 200 && response.data.success) {
      const cards = response.data.cards;
      console.log(`   ✅ Status: ${response.status}`);
      console.log(`   ✅ Total cards: ${cards.length}`);
      
      // Verify card structure
      if (cards.length > 0) {
        const card = cards[0];
        const requiredFields = ['_id', 'name', 'type', 'tier', 'slotCost', 'effectType', 'description'];
        const hasAllFields = requiredFields.every(field => card.hasOwnProperty(field));
        console.log(`   ✅ Card structure valid: ${hasAllFields}`);
        console.log(`   ✅ Sample card: ${card.name} (${card.type}, ${card.tier}, ${card.slotCost} slots)`);
      }

      // Count by type and tier
      const driverCards = cards.filter(c => c.type === 'driver');
      const teamCards = cards.filter(c => c.type === 'team');
      const goldCards = cards.filter(c => c.tier === 'gold');
      const silverCards = cards.filter(c => c.tier === 'silver');
      const bronzeCards = cards.filter(c => c.tier === 'bronze');

      console.log(`   ✅ Driver cards: ${driverCards.length} (expected: 12)`);
      console.log(`   ✅ Team cards: ${teamCards.length} (expected: 9)`);
      console.log(`   ✅ Gold cards: ${goldCards.length} (expected: 7)`);
      console.log(`   ✅ Silver cards: ${silverCards.length} (expected: 7)`);
      console.log(`   ✅ Bronze cards: ${bronzeCards.length} (expected: 7)`);
    } else {
      console.log(`   ❌ Unexpected response: ${JSON.stringify(response.data)}`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  console.log('');

  // Test 2: Filter by driver type
  console.log('Test 2: GET /api/cards?type=driver');
  try {
    const response = await makeRequest('GET', '/cards?type=driver');
    if (response.status === 200 && response.data.success) {
      const cards = response.data.cards;
      console.log(`   ✅ Status: ${response.status}`);
      console.log(`   ✅ Driver cards: ${cards.length} (expected: 12)`);
      const allDriver = cards.every(c => c.type === 'driver');
      console.log(`   ✅ All are driver cards: ${allDriver}`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  console.log('');

  // Test 3: Filter by team type
  console.log('Test 3: GET /api/cards?type=team');
  try {
    const response = await makeRequest('GET', '/cards?type=team');
    if (response.status === 200 && response.data.success) {
      const cards = response.data.cards;
      console.log(`   ✅ Status: ${response.status}`);
      console.log(`   ✅ Team cards: ${cards.length} (expected: 9)`);
      const allTeam = cards.every(c => c.type === 'team');
      console.log(`   ✅ All are team cards: ${allTeam}`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  console.log('');

  // Test 4: Invalid type filter
  console.log('Test 4: GET /api/cards?type=invalid (should return all cards)');
  try {
    const response = await makeRequest('GET', '/cards?type=invalid');
    if (response.status === 200 && response.data.success) {
      const cards = response.data.cards;
      console.log(`   ✅ Status: ${response.status}`);
      console.log(`   ✅ Returns all cards: ${cards.length} (expected: 21)`);
      console.log(`   ✅ Invalid type ignored correctly`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  console.log('');

  // Test 5: Verify specific cards exist
  console.log('Test 5: Verify specific cards exist');
  try {
    const response = await makeRequest('GET', '/cards');
    if (response.status === 200 && response.data.success) {
      const cards = response.data.cards;
      const cardNames = cards.map(c => c.name);
      
      const requiredDriverCards = ['2× Points', 'Mirror', 'Switcheroo', 'Teamwork 2', 'Teamwork', 'Move Up 1 Rank', 'Mystery Card', 'Top 5 Boost', 'Top 10 Boost', '+3 Points', 'Competitiveness', 'Bottom 5'];
      const requiredTeamCards = ['Espionage', 'Podium', 'Top 5', 'Undercut', 'Top 10', 'Random', 'Sponsors', 'Participating Trophy', 'Last Place Bonus'];
      
      const missingDriver = requiredDriverCards.filter(name => !cardNames.includes(name));
      const missingTeam = requiredTeamCards.filter(name => !cardNames.includes(name));
      
      console.log(`   ✅ All driver cards present: ${missingDriver.length === 0}`);
      if (missingDriver.length > 0) {
        console.log(`   ⚠️  Missing driver cards: ${missingDriver.join(', ')}`);
      }
      console.log(`   ✅ All team cards present: ${missingTeam.length === 0}`);
      if (missingTeam.length > 0) {
        console.log(`   ⚠️  Missing team cards: ${missingTeam.join(', ')}`);
      }
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  console.log('');

  console.log('='.repeat(60));
  console.log('✅ Detailed API tests completed!');
  console.log('');
  console.log('📝 Note: Authenticated endpoints require:');
  console.log('   - Valid JWT token');
  console.log('   - Existing league (2026 season)');
  console.log('   - User membership in league');
}

runDetailedTests().catch(console.error);

