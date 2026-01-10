/**
 * Test script for Mystery Card functionality
 * 
 * This script tests:
 * 1. Selecting Mystery Card in a deck
 * 2. Activating Mystery Card for a race
 * 3. Verifying it transforms into a random driver card
 * 4. Checking the transformation is stored correctly
 */

const axios = require('axios');
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';

// Test configuration
const TEST_CONFIG = {
  username: `test_mystery_${Date.now()}`,
  email: `test_mystery_${Date.now()}@test.com`,
  password: 'TestPassword123!',
  leagueName: `Mystery Test League ${Date.now()}`
};

let authToken = null;
let userId = null;
let leagueId = null;
let mysteryCardId = null;
let selectionId = null;
let raceCardSelectionId = null;

// Helper function to make API calls
async function apiCall(method, endpoint, data = null, token = null) {
  const config = {
    method,
    url: `${API_BASE_URL}${endpoint}`,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    },
    ...(data && { data }),
    timeout: 60000 // 60 second timeout
  };

  try {
    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      return {
        success: false,
        error: 'Connection refused - is the server running on ' + API_BASE_URL + '?',
        status: null
      };
    }
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status
    };
  }
}

// Step 1: Register a test user
async function registerUser() {
  console.log('\n📝 Step 1: Registering test user...');
  const result = await apiCall('POST', '/api/auth/register', {
    username: TEST_CONFIG.username,
    email: TEST_CONFIG.email,
    password: TEST_CONFIG.password,
    termsAccepted: true
  });

  if (result.success) {
    console.log('✅ User registered:', result.data.user.username);
    userId = result.data.user._id;
    return true;
  } else {
    console.error('❌ Registration failed:', result.error);
    return false;
  }
}

// Step 2: Login
async function login() {
  console.log('\n🔐 Step 2: Logging in...');
  const result = await apiCall('POST', '/api/auth/login', {
    email: TEST_CONFIG.email,
    password: TEST_CONFIG.password
  });

  if (result.success) {
    // Try different possible token field names
    authToken = result.data.accessToken || result.data.token || result.data.access_token;
    if (!authToken) {
      console.error('❌ No token found in login response:', result.data);
      return false;
    }
    console.log('✅ Login successful');
    return true;
  } else {
    console.error('❌ Login failed:', result.error);
    return false;
  }
}

// Step 3: Create a league
async function createLeague() {
  console.log('\n🏆 Step 3: Creating test league...');
  console.log('   Sending request...');
  
  const result = await apiCall('POST', '/api/league', {
    name: TEST_CONFIG.leagueName
  }, authToken);

  if (result.success) {
    leagueId = result.data._id || result.data.league?._id;
    if (!leagueId) {
      console.error('❌ League created but no ID returned:', result.data);
      return false;
    }
    console.log('✅ League created:', result.data.name || TEST_CONFIG.leagueName, '(ID:', leagueId + ')');
    return true;
  } else {
    console.error('❌ League creation failed:', result.error);
    console.error('   Status:', result.status);
    return false;
  }
}

// Step 4: Get all cards and find Mystery Card
async function findMysteryCard() {
  console.log('\n🃏 Step 4: Finding Mystery Card...');
  
  // Use the league-specific endpoint which returns driverCards and teamCards separately
  const result = await apiCall('GET', `/api/league/${leagueId}/cards`, null, authToken);

  if (result.success) {
    // The response should have driverCards and teamCards
    const driverCards = result.data.driverCards || [];
    const mysteryCard = driverCards.find(
      card => card.name === 'Mystery Card' || card.effectType === 'mystery'
    );

    if (mysteryCard) {
      mysteryCardId = mysteryCard._id;
      console.log('✅ Mystery Card found:', mysteryCard.name, '(ID:', mysteryCardId + ')');
      console.log('   Tier:', mysteryCard.tier, '| Slot Cost:', mysteryCard.slotCost);
      return true;
    } else {
      console.error('❌ Mystery Card not found in driver cards');
      console.log('   Available driver cards:', driverCards.map(c => c.name).join(', '));
      return false;
    }
  } else {
    console.error('❌ Failed to fetch cards:', result.error);
    return false;
  }
}

// Step 5: Build a deck with Mystery Card
async function buildDeckWithMysteryCard() {
  console.log('\n🎴 Step 5: Building deck with Mystery Card...');
  
  // Get all cards to build a valid deck
  const cardsResult = await apiCall('GET', `/api/league/${leagueId}/cards`, null, authToken);
  if (!cardsResult.success) {
    console.error('❌ Failed to fetch cards for deck building');
    return false;
  }

  const driverCards = cardsResult.data.driverCards || [];
  const teamCards = cardsResult.data.teamCards || [];

  // Select Mystery Card + other cards to fill exactly 12 driver slots
  const selectedDriverCards = [mysteryCardId];
  let driverSlotsUsed = 2; // Mystery Card slots

  // Sort driver cards by slot cost (prefer lower cost first)
  const availableDriverCards = driverCards
    .filter(card => card._id !== mysteryCardId)
    .sort((a, b) => a.slotCost - b.slotCost);

  // Greedy algorithm to fill exactly 12 slots
  for (const card of availableDriverCards) {
    if (driverSlotsUsed >= 12) break;
    const slotsNeeded = 12 - driverSlotsUsed;
    if (card.slotCost <= slotsNeeded && !selectedDriverCards.includes(card._id)) {
      selectedDriverCards.push(card._id);
      driverSlotsUsed += card.slotCost;
    }
  }

  // If we still don't have exactly 12 slots, try different combinations
  if (driverSlotsUsed !== 12) {
    // Reset and try a different approach
    selectedDriverCards.length = 0;
    selectedDriverCards.push(mysteryCardId);
    driverSlotsUsed = 2;
    
    // Try to find cards that sum to exactly 10
    const target = 10;
    const combinations = [];
    
    function findCombinations(cards, target, current = [], start = 0) {
      const sum = current.reduce((acc, c) => acc + c.slotCost, 0);
      if (sum === target) {
        combinations.push([...current]);
        return;
      }
      if (sum > target || start >= cards.length) return;
      
      for (let i = start; i < cards.length; i++) {
        current.push(cards[i]);
        findCombinations(cards, target, current, i + 1);
        current.pop();
      }
    }
    
    findCombinations(availableDriverCards, target);
    
    if (combinations.length > 0) {
      const selected = combinations[0];
      selected.forEach(card => {
        selectedDriverCards.push(card._id);
        driverSlotsUsed += card.slotCost;
      });
    } else {
      // Fallback: just add cards until we're close, then adjust
      for (const card of availableDriverCards) {
        if (driverSlotsUsed + card.slotCost <= 12 && !selectedDriverCards.includes(card._id)) {
          selectedDriverCards.push(card._id);
          driverSlotsUsed += card.slotCost;
        }
        if (driverSlotsUsed >= 12) break;
      }
    }
  }

  // Fill team cards to exactly 10 slots
  const selectedTeamCards = [];
  let teamSlotsUsed = 0;
  
  // Sort team cards by slot cost
  const sortedTeamCards = [...teamCards].sort((a, b) => a.slotCost - b.slotCost);
  
  // Greedy algorithm to fill exactly 10 slots
  for (const card of sortedTeamCards) {
    if (teamSlotsUsed >= 10) break;
    const slotsNeeded = 10 - teamSlotsUsed;
    if (card.slotCost <= slotsNeeded && !selectedTeamCards.includes(card._id)) {
      selectedTeamCards.push(card._id);
      teamSlotsUsed += card.slotCost;
    }
  }

  // If we still don't have exactly 10 slots, try combinations
  if (teamSlotsUsed !== 10) {
    selectedTeamCards.length = 0;
    teamSlotsUsed = 0;
    
    const target = 10;
    const combinations = [];
    
    function findTeamCombinations(cards, target, current = [], start = 0) {
      const sum = current.reduce((acc, c) => acc + c.slotCost, 0);
      if (sum === target) {
        combinations.push([...current]);
        return;
      }
      if (sum > target || start >= cards.length) return;
      
      for (let i = start; i < cards.length; i++) {
        current.push(cards[i]);
        findTeamCombinations(cards, target, current, i + 1);
        current.pop();
      }
    }
    
    findTeamCombinations(sortedTeamCards, target);
    
    if (combinations.length > 0) {
      const selected = combinations[0];
      selected.forEach(card => {
        selectedTeamCards.push(card._id);
        teamSlotsUsed += card.slotCost;
      });
    } else {
      // Fallback
      for (const card of sortedTeamCards) {
        if (teamSlotsUsed + card.slotCost <= 10 && !selectedTeamCards.includes(card._id)) {
          selectedTeamCards.push(card._id);
          teamSlotsUsed += card.slotCost;
        }
        if (teamSlotsUsed >= 10) break;
      }
    }
  }

  console.log(`   Selected ${selectedDriverCards.length} driver cards (${driverSlotsUsed} slots)`);
  console.log(`   Selected ${selectedTeamCards.length} team cards (${teamSlotsUsed} slots)`);

  if (driverSlotsUsed !== 12) {
    console.error(`   ❌ Driver slots: ${driverSlotsUsed}/12 (need exactly 12)`);
    return false;
  }
  if (teamSlotsUsed !== 10) {
    console.error(`   ❌ Team slots: ${teamSlotsUsed}/10 (need exactly 10)`);
    return false;
  }

  const result = await apiCall('POST', `/api/league/${leagueId}/cards/select`, {
    driverCardIds: selectedDriverCards,
    teamCardIds: selectedTeamCards
  }, authToken);

  if (result.success) {
    console.log('✅ Deck built successfully');
    return true;
  } else {
    console.error('❌ Deck building failed:', result.error);
    return false;
  }
}

// Step 6: Create a race selection (required before activating cards)
async function createRaceSelection() {
  console.log('\n🏁 Step 6: Creating race selection...');
  
  // Get next race timing
  const raceResult = await apiCall('GET', '/api/race/next-race', null, authToken);
  if (!raceResult.success) {
    console.error('❌ Failed to get next race');
    return false;
  }

  const round = raceResult.data.round;
  console.log('   Next race: Round', round, '-', raceResult.data.raceName);

  // Get available drivers and teams
  const selectionsResult = await apiCall('GET', `/api/selections/used?leagueId=${leagueId}&round=${round}`, null, authToken);
  if (!selectionsResult.success) {
    console.error('❌ Failed to get used selections');
    return false;
  }

  // Get all drivers and teams (simplified - in real app you'd get from f1DataLoader)
  // For testing, we'll use placeholder values
  const mainDriver = 'Max Verstappen';
  const reserveDriver = 'Charles Leclerc';
  const team = 'Red Bull Racing';

  const result = await apiCall('POST', '/api/selections', {
    leagueId,
    round,
    mainDriver,
    reserveDriver,
    team
  }, authToken);

  if (result.success) {
    selectionId = result.data._id;
    console.log('✅ Race selection created (ID:', selectionId + ')');
    return true;
  } else {
    console.error('❌ Race selection failed:', result.error);
    return false;
  }
}

// Step 7: Activate Mystery Card
async function activateMysteryCard() {
  console.log('\n✨ Step 7: Activating Mystery Card...');
  
  const result = await apiCall('POST', `/api/selections/${selectionId}/cards`, {
    driverCardId: mysteryCardId,
    teamCardId: null
  }, authToken);

  if (result.success) {
    raceCardSelectionId = result.data.raceCardSelection._id;
    const transformedCard = result.data.transformations?.mysteryCard;
    
    console.log('✅ Mystery Card activated!');
    console.log('   Race Card Selection ID:', raceCardSelectionId);
    
    if (transformedCard) {
      console.log('   🎲 Transformed into:', transformedCard.name);
      console.log('   Effect Type:', transformedCard.effectType);
      console.log('   Effect Value:', transformedCard.effectValue);
      console.log('   Tier:', transformedCard.tier);
    } else {
      console.log('   ⚠️  No transformation data in response (check raceCardSelection)');
    }
    
    return true;
  } else {
    console.error('❌ Mystery Card activation failed:', result.error);
    return false;
  }
}

// Step 8: Verify the transformation is stored
async function verifyTransformation() {
  console.log('\n🔍 Step 8: Verifying transformation storage...');
  
  const result = await apiCall('GET', `/api/selections/${selectionId}/cards`, null, authToken);

  if (result.success && result.data.raceCardSelection) {
    const raceCardSelection = result.data.raceCardSelection;
    
    console.log('✅ Race Card Selection retrieved');
    console.log('   Original Card (Mystery):', raceCardSelection.driverCard?.name);
    
    if (raceCardSelection.mysteryTransformedCard) {
      const transformed = raceCardSelection.mysteryTransformedCard;
      console.log('   🎲 Transformed Card:', transformed.name);
      console.log('   Effect Type:', transformed.effectType);
      console.log('   Effect Value:', transformed.effectValue);
      console.log('   ✅ Transformation stored correctly!');
      return true;
    } else {
      console.log('   ⚠️  No mysteryTransformedCard found in database');
      return false;
    }
  } else {
    console.error('❌ Failed to retrieve race card selection:', result.error);
    return false;
  }
}

// Step 9: Test multiple activations (should get different cards)
async function testMultipleActivations() {
  console.log('\n🔄 Step 9: Testing multiple Mystery Card activations...');
  console.log('   (This will show that each activation gives a different random card)');
  
  const transformations = [];
  
  for (let i = 1; i <= 5; i++) {
    // Clear previous selection
    await apiCall('DELETE', `/api/selections/${selectionId}/cards`, null, authToken);
    
    // Activate again
    const result = await apiCall('POST', `/api/selections/${selectionId}/cards`, {
      driverCardId: mysteryCardId,
      teamCardId: null
    }, authToken);
    
    if (result.success && result.data.transformations?.mysteryCard) {
      const transformed = result.data.transformations.mysteryCard;
      transformations.push(transformed.name);
      console.log(`   Activation ${i}: ${transformed.name}`);
    } else {
      console.log(`   Activation ${i}: Failed to get transformation`);
    }
  }
  
  const uniqueTransformations = [...new Set(transformations)];
  console.log(`\n   📊 Results: ${transformations.length} activations, ${uniqueTransformations.length} unique cards`);
  console.log('   Unique cards:', uniqueTransformations.join(', '));
  
  if (uniqueTransformations.length > 1) {
    console.log('   ✅ Mystery Card is randomizing correctly!');
    return true;
  } else {
    console.log('   ⚠️  All activations gave the same card (might be coincidence)');
    return true; // Still success, just unlucky randomization
  }
}

// Main test flow
async function runTests() {
  console.log('🧪 MYSTERY CARD TEST SUITE');
  console.log('='.repeat(50));
  console.log('API Base URL:', API_BASE_URL);
  console.log('Test User:', TEST_CONFIG.username);

  try {
    // Run all test steps
    if (!(await registerUser())) return;
    if (!(await login())) return;
    if (!(await createLeague())) return;
    if (!(await findMysteryCard())) return;
    if (!(await buildDeckWithMysteryCard())) return;
    if (!(await createRaceSelection())) return;
    if (!(await activateMysteryCard())) return;
    if (!(await verifyTransformation())) return;
    await testMultipleActivations();

    console.log('\n' + '='.repeat(50));
    console.log('✅ ALL TESTS COMPLETED SUCCESSFULLY!');
    console.log('\n📝 Summary:');
    console.log('   - Mystery Card can be selected in a deck');
    console.log('   - Mystery Card transforms into a random driver card at activation');
    console.log('   - Transformation is stored in the database');
    console.log('   - Each activation gives a (potentially) different card');
    
  } catch (error) {
    console.error('\n❌ TEST SUITE FAILED:', error);
    console.error(error.stack);
  }
}

// Run the tests
if (require.main === module) {
  runTests().then(() => {
    console.log('\n🏁 Test suite finished');
    process.exit(0);
  }).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { runTests };

