const http = require('http');

const BASE_URL = 'http://localhost:5000/api';

// Test credentials (you can modify these)
const TEST_USER = {
  username: 'testcarduser',
  email: 'testcarduser@test.com',
  password: 'TestPassword123!'
};

let authToken = null;
let userId = null;
let leagueId = null;

function makeRequest(method, url, data = null, token = null) {
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

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

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
      if (error.code === 'ECONNREFUSED') {
        reject(new Error(`Connection refused - is the server running on port ${urlObj.port}?`));
      } else {
        reject(error);
      }
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

async function registerUser() {
  console.log('📝 Step 1: Registering test user...');
  try {
    const response = await makeRequest('POST', '/auth/register', {
      username: TEST_USER.username,
      email: TEST_USER.email,
      password: TEST_USER.password,
      termsAccepted: true
    });

    if (response.status === 201 && response.data.accessToken) {
      authToken = response.data.accessToken;
      userId = response.data.user.id;
      console.log(`   ✅ User registered: ${TEST_USER.username}`);
      console.log(`   ✅ User ID: ${userId}`);
      return true;
    } else if (response.status === 400 && response.data.error?.includes('already exists')) {
      console.log(`   ⚠️  User already exists, trying to login...`);
      return false; // User exists, try login instead
    } else {
      console.log(`   ❌ Registration failed: ${JSON.stringify(response.data)}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return false;
  }
}

async function loginUser() {
  console.log('🔐 Step 2: Logging in...');
  try {
    const response = await makeRequest('POST', '/auth/login', {
      email: TEST_USER.email,
      password: TEST_USER.password
    });

    if (response.status === 200 && response.data.accessToken) {
      authToken = response.data.accessToken;
      userId = response.data.user.id;
      console.log(`   ✅ Login successful: ${TEST_USER.username}`);
      console.log(`   ✅ Token received`);
      return true;
    } else {
      console.log(`   ❌ Login failed: ${JSON.stringify(response.data)}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return false;
  }
}

async function getOrCreateLeague() {
  console.log('🏁 Step 3: Getting or creating test league...');
  try {
    // First, try to get user's leagues
    const leaguesResponse = await makeRequest('GET', '/league/user/leagues', null, authToken);
    
    if (leaguesResponse.status === 200 && leaguesResponse.data.leagues && leaguesResponse.data.leagues.length > 0) {
      // Find a 2026 league or use the first one
      const league2026 = leaguesResponse.data.leagues.find(l => l.season === 2026);
      if (league2026) {
        leagueId = league2026._id;
        console.log(`   ✅ Found existing 2026 league: ${league2026.name}`);
        return true;
      } else {
        // Use first league (might be 2025, but we can still test)
        leagueId = leaguesResponse.data.leagues[0]._id;
        console.log(`   ⚠️  Using existing league (season ${leaguesResponse.data.leagues[0].season}): ${leaguesResponse.data.leagues[0].name}`);
        console.log(`   ⚠️  Note: Cards only work for 2026+ seasons`);
        return true;
      }
    }

    // If no leagues, create one
    console.log('   Creating new test league...');
    const createResponse = await makeRequest('POST', '/league', {
      name: 'Test Card League',
      description: 'Test league for card API testing',
      season: 2026
    }, authToken);

    if (createResponse.status === 201) {
      // Check if league is in response.data.league or response.data directly
      const league = createResponse.data.league || createResponse.data;
      if (league && league._id) {
        leagueId = league._id;
        console.log(`   ✅ Created new 2026 league: ${league.name || 'Test Card League'}`);
        return true;
      } else {
        console.log(`   ⚠️  League created but structure unexpected: ${JSON.stringify(createResponse.data)}`);
        // Try to extract ID from response
        if (createResponse.data._id) {
          leagueId = createResponse.data._id;
          console.log(`   ✅ Using league ID from response: ${leagueId}`);
          return true;
        }
      }
    } else {
      console.log(`   ❌ Failed to create league: Status ${createResponse.status}, ${JSON.stringify(createResponse.data)}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return false;
  }
}

async function testCardEndpoints() {
  console.log('\n🧪 Testing Card API Endpoints\n');
  console.log('='.repeat(60));
  console.log('');

  // Test 0: Verify league exists
  console.log('Test 0: Verifying league exists...');
  try {
    const leagueResponse = await makeRequest('GET', `/league/${leagueId}`, null, authToken);
    if (leagueResponse.status === 200) {
      console.log(`   ✅ League found: ${leagueResponse.data.league?.name || leagueResponse.data.name}`);
      console.log(`   ✅ League season: ${leagueResponse.data.league?.season || leagueResponse.data.season}`);
    } else {
      console.log(`   ⚠️  League check failed: ${JSON.stringify(leagueResponse.data)}`);
    }
  } catch (error) {
    console.log(`   ⚠️  Error checking league: ${error.message}`);
  }
  console.log('');

  // Test 1: Get player's card collection
  console.log('Test 1: GET /api/league/:leagueId/cards');
  try {
    const response = await makeRequest('GET', `/league/${leagueId}/cards`, null, authToken);
    if (response.status === 200 && response.data.success) {
      console.log(`   ✅ Status: ${response.status}`);
      console.log(`   ✅ Driver cards available: ${response.data.driverCards.length}`);
      console.log(`   ✅ Team cards available: ${response.data.teamCards.length}`);
      console.log(`   ✅ Season: ${response.data.season}`);
    } else {
      console.log(`   ❌ Failed: ${JSON.stringify(response.data)}`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  console.log('');

  // Test 2: Get player's deck (should be empty initially)
  console.log('Test 2: GET /api/league/:leagueId/cards/deck');
  try {
    const response = await makeRequest('GET', `/league/${leagueId}/cards/deck`, null, authToken);
    if (response.status === 200 && response.data.success) {
      console.log(`   ✅ Status: ${response.status}`);
      console.log(`   ✅ Driver cards in deck: ${response.data.driverCardsCount}`);
      console.log(`   ✅ Team cards in deck: ${response.data.teamCardsCount}`);
      console.log(`   ✅ Driver slots used: ${response.data.driverSlotsUsed}/${response.data.driverSlotsMax}`);
      console.log(`   ✅ Team slots used: ${response.data.teamSlotsUsed}/${response.data.teamSlotsMax}`);
    } else {
      console.log(`   ❌ Failed: ${JSON.stringify(response.data)}`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  console.log('');

  // Test 3: Get all cards to select a deck
  console.log('Test 3: Getting available cards for deck selection...');
  try {
    const cardsResponse = await makeRequest('GET', '/cards');
    if (cardsResponse.status === 200 && cardsResponse.data.success) {
      const allCards = cardsResponse.data.cards;
      const driverCards = allCards.filter(c => c.type === 'driver');
      const teamCards = allCards.filter(c => c.type === 'team');
      
      // Select a valid deck: 2 Gold (6) + 2 Silver (4) + 2 Bronze (2) = 12 driver slots
      // 1 Gold (4) + 2 Silver (4) + 2 Bronze (2) = 10 team slots, 1 gold
      const selectedDriverCards = [
        driverCards.find(c => c.name === '2× Points'), // Gold
        driverCards.find(c => c.name === 'Mirror'), // Gold
        driverCards.find(c => c.name === 'Teamwork'), // Silver
        driverCards.find(c => c.name === 'Top 5 Boost'), // Silver
        driverCards.find(c => c.name === '+3 Points'), // Bronze
        driverCards.find(c => c.name === 'Top 10 Boost') // Bronze
      ].filter(Boolean).map(c => c._id);

      const selectedTeamCards = [
        teamCards.find(c => c.name === 'Podium'), // Gold
        teamCards.find(c => c.name === 'Top 10'), // Silver
        teamCards.find(c => c.name === 'Undercut'), // Silver
        teamCards.find(c => c.name === 'Sponsors'), // Bronze
        teamCards.find(c => c.name === 'Last Place Bonus') // Bronze
      ].filter(Boolean).map(c => c._id);

      console.log(`   ✅ Selected ${selectedDriverCards.length} driver cards`);
      console.log(`   ✅ Selected ${selectedTeamCards.length} team cards`);

      // Test 4: Select deck
      console.log('\nTest 4: POST /api/league/:leagueId/cards/select');
      try {
        const selectResponse = await makeRequest('POST', `/league/${leagueId}/cards/select`, {
          driverCardIds: selectedDriverCards,
          teamCardIds: selectedTeamCards
        }, authToken);

        if (selectResponse.status === 200 && selectResponse.data.success) {
          console.log(`   ✅ Status: ${selectResponse.status}`);
          console.log(`   ✅ Deck selected successfully`);
          console.log(`   ✅ Driver cards: ${selectResponse.data.driverCards}`);
          console.log(`   ✅ Team cards: ${selectResponse.data.teamCards}`);
        } else {
          console.log(`   ❌ Failed: ${JSON.stringify(selectResponse.data)}`);
        }
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
      }
      console.log('');

      // Test 5: Get deck again to verify
      console.log('Test 5: GET /api/league/:leagueId/cards/deck (after selection)');
      try {
        const deckResponse = await makeRequest('GET', `/league/${leagueId}/cards/deck`, null, authToken);
        if (deckResponse.status === 200 && deckResponse.data.success) {
          console.log(`   ✅ Status: ${deckResponse.status}`);
          console.log(`   ✅ Driver cards in deck: ${deckResponse.data.driverCardsCount}`);
          console.log(`   ✅ Team cards in deck: ${deckResponse.data.teamCardsCount}`);
          console.log(`   ✅ Driver slots: ${deckResponse.data.driverSlotsUsed}/${deckResponse.data.driverSlotsMax}`);
          console.log(`   ✅ Team slots: ${deckResponse.data.teamSlotsUsed}/${deckResponse.data.teamSlotsMax}`);
          console.log(`   ✅ Gold team cards: ${deckResponse.data.goldTeamCardsCount}/${deckResponse.data.goldTeamCardsMax}`);
        }
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
      }
      console.log('');

    } else {
      console.log(`   ❌ Failed to get cards: ${JSON.stringify(cardsResponse.data)}`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  console.log('='.repeat(60));
  console.log('✅ Authenticated API tests completed!');
  console.log('');
  console.log('📝 Note: Race card selection endpoints require:');
  console.log('   - A race selection to exist');
  console.log('   - A race that has qualifying passed but race not started');
  console.log('   - Season 2026+');
  console.log('   - Not a sprint weekend');
}

async function runTests() {
  console.log('🚀 Starting Authenticated Card API Tests\n');
  console.log('='.repeat(60));
  console.log('');

  // Step 1: Register or login
  const registered = await registerUser();
  if (!registered) {
    const loggedIn = await loginUser();
    if (!loggedIn) {
      console.log('❌ Failed to authenticate. Exiting.');
      return;
    }
  }

  // Step 2: Get or create league
  const leagueReady = await getOrCreateLeague();
  if (!leagueReady) {
    console.log('❌ Failed to get/create league. Exiting.');
    return;
  }

  console.log(`   ✅ Using league ID: ${leagueId}`);
  console.log('');

  // Step 3: Test card endpoints
  await testCardEndpoints();
}

runTests().catch(console.error);

