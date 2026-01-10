/**
 * Full Season Simulation with Comprehensive Report
 * 
 * Simulates a complete 2026 F1 season with 6 players and generates a detailed report
 * including:
 * - Race-by-race results
 * - Player standings
 * - Card usage and activations
 * - Points breakdown
 * - Statistics and analysis
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';

// Test configuration
const NUM_PLAYERS = 6;
const TEST_CONFIG = {
  baseUsername: `full_season_${Date.now()}`,
  baseEmail: `full_season_${Date.now()}`,
  password: 'TestPassword123!',
  leagueName: `Full Season Test ${new Date().toISOString().split('T')[0]}`
};

let players = [];
let leagueId = null;
let season = 2026;
let races = [];
let allCards = { driverCards: [], teamCards: [] };
let raceResults = [];
let reportData = {
  league: null,
  players: [],
  races: [],
  standings: null,
  cardUsage: {},
  statistics: {}
};

// Helper function to make API calls
async function apiCall(method, endpoint, data = null, token = null, extraHeaders = {}) {
  const config = {
    method,
    url: `${API_BASE_URL}${endpoint}`,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...extraHeaders
    },
    ...(data && { data }),
    timeout: 60000
  };

  try {
    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status
    };
  }
}

// Step 1: Setup
async function setup() {
  console.log('\n📋 STEP 1: SETUP');
  console.log('='.repeat(60));
  
  for (let i = 0; i < NUM_PLAYERS; i++) {
    const username = `${TEST_CONFIG.baseUsername}_${i + 1}`;
    const email = `${TEST_CONFIG.baseEmail}_${i + 1}@test.com`;
    
    const registerResult = await apiCall('POST', '/api/auth/register', {
      username,
      email,
      password: TEST_CONFIG.password,
      termsAccepted: true
    });

    if (!registerResult.success) {
      console.error(`❌ Registration failed for ${username}`);
      continue;
    }

    const loginResult = await apiCall('POST', '/api/auth/login', {
      email,
      password: TEST_CONFIG.password
    });

    if (!loginResult.success) {
      console.error(`❌ Login failed for ${username}`);
      continue;
    }

    const authToken = loginResult.data.accessToken || loginResult.data.token;
    const userId = registerResult.data.user?._id || registerResult.data.user?.id || registerResult.data?._id;
    
    if (!userId) {
      console.error(`❌ No userId found for ${username}`);
      continue;
    }
    
    players.push({ username, email, userId, authToken });
    console.log(`✅ User ${i + 1}/${NUM_PLAYERS}: ${username}`);
  }

  if (players.length === 0) {
    throw new Error('No players registered');
  }

  const leagueResult = await apiCall('POST', '/api/league', {
    name: TEST_CONFIG.leagueName
  }, players[0].authToken);

  if (!leagueResult.success) {
    throw new Error('League creation failed');
  }
  
  leagueId = leagueResult.data._id;
  season = leagueResult.data.season || 2026;
  reportData.league = {
    id: leagueId,
    name: TEST_CONFIG.leagueName,
    season: season
  };
  
  console.log(`✅ League created: ${TEST_CONFIG.leagueName} (Season ${season})`);

  for (let i = 1; i < players.length; i++) {
    await apiCall('POST', '/api/league/join', {
      code: leagueResult.data.code
    }, players[i].authToken);
    console.log(`✅ Player ${i + 1} joined league`);
  }

  return true;
}

// Step 2: Get race calendar and cards
async function getRaceCalendarAndCards() {
  console.log('\n📅 STEP 2: GET RACE CALENDAR AND CARDS');
  console.log('='.repeat(60));
  
  const racesResult = await apiCall('GET', `/api/race/league/${leagueId}`, null, players[0].authToken);
  if (racesResult.success) {
    races = racesResult.data.races || racesResult.data || [];
    console.log(`✅ Found ${races.length} races for season ${season}`);
  }

  const cardsResult = await apiCall('GET', `/api/league/${leagueId}/cards`, null, players[0].authToken);
  if (cardsResult.success) {
    allCards.driverCards = cardsResult.data.driverCards || [];
    allCards.teamCards = cardsResult.data.teamCards || [];
    console.log(`✅ Found ${allCards.driverCards.length} driver cards and ${allCards.teamCards.length} team cards`);
  }

  return true;
}

// Step 3: Build decks
async function buildDecks() {
  console.log('\n🎴 STEP 3: BUILD DECKS');
  console.log('='.repeat(60));

  const driverCardPool = [...allCards.driverCards];
  const teamCardPool = [...allCards.teamCards];
  
  function shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  const shuffledDriverCards = shuffle(driverCardPool);
  const shuffledTeamCards = shuffle(teamCardPool);

  for (let i = 0; i < players.length; i++) {
    const player = players[i];
    console.log(`\n3.${i + 1} Building deck for ${player.username}...`);

    const startDriverIdx = (i * 3) % shuffledDriverCards.length;
    const startTeamIdx = (i * 2) % shuffledTeamCards.length;
    
    const selectedDriverCards = [];
    let driverSlotsUsed = 0;
    let goldDriverCount = 0;
    const targetDriverSlots = 12;
    const maxGoldDrivers = 2;

    const availableDriverCards = shuffledDriverCards
      .filter(c => {
        if (c.tier === 'gold' && goldDriverCount >= maxGoldDrivers) return false;
        return true;
      });
    
    function findDriverCombination(cards, target, current = [], start = 0, goldCount = 0) {
      const sum = current.reduce((acc, c) => acc + c.slotCost, 0);
      if (sum === target && goldCount <= maxGoldDrivers) return current;
      if (sum > target || start >= cards.length) return null;
      
      for (let i = start; i < cards.length; i++) {
        const card = cards[i];
        if (card.tier === 'gold' && goldCount >= maxGoldDrivers) continue;
        const newGoldCount = card.tier === 'gold' ? goldCount + 1 : goldCount;
        const result = findDriverCombination(cards, target, [...current, card], i + 1, newGoldCount);
        if (result) return result;
      }
      return null;
    }
    
    const driverCombination = findDriverCombination(availableDriverCards, targetDriverSlots);
    if (driverCombination) {
      driverCombination.forEach(card => {
        selectedDriverCards.push(card._id);
        driverSlotsUsed += card.slotCost;
        if (card.tier === 'gold') goldDriverCount++;
      });
    }

    const selectedTeamCards = [];
    let teamSlotsUsed = 0;
    let goldTeamCount = 0;
    const targetTeamSlots = 10;
    const maxGoldTeams = 1;

    const availableTeamCards = shuffledTeamCards
      .filter(c => {
        if (c.tier === 'gold' && goldTeamCount >= maxGoldTeams) return false;
        return true;
      });
    
    function findTeamCombination(cards, target, current = [], start = 0, goldCount = 0) {
      const sum = current.reduce((acc, c) => acc + c.slotCost, 0);
      if (sum === target && goldCount <= maxGoldTeams) return current;
      if (sum > target || start >= cards.length) return null;
      
      for (let i = start; i < cards.length; i++) {
        const card = cards[i];
        if (card.tier === 'gold' && goldCount >= maxGoldTeams) continue;
        const newGoldCount = card.tier === 'gold' ? goldCount + 1 : goldCount;
        const result = findTeamCombination(cards, target, [...current, card], i + 1, newGoldCount);
        if (result) return result;
      }
      return null;
    }
    
    const teamCombination = findTeamCombination(availableTeamCards, targetTeamSlots);
    if (teamCombination) {
      teamCombination.forEach(card => {
        selectedTeamCards.push(card._id);
        teamSlotsUsed += card.slotCost;
        if (card.tier === 'gold') goldTeamCount++;
      });
    }

    console.log(`   Driver cards: ${selectedDriverCards.length} (${driverSlotsUsed} slots)`);
    console.log(`   Team cards: ${selectedTeamCards.length} (${teamSlotsUsed} slots)`);

    if (driverSlotsUsed !== targetDriverSlots || teamSlotsUsed !== targetTeamSlots) {
      throw new Error(`Invalid deck configuration for ${player.username}`);
    }

    const deckResult = await apiCall('POST', `/api/league/${leagueId}/cards/select`, {
      driverCardIds: selectedDriverCards,
      teamCardIds: selectedTeamCards
    }, player.authToken);

    if (deckResult.success) {
      console.log(`   ✅ Deck built successfully`);
      
      // Store deck info in report
      reportData.players.push({
        username: player.username,
        userId: player.userId,
        deck: {
          driverCards: selectedDriverCards.length,
          teamCards: selectedTeamCards.length,
          driverSlots: driverSlotsUsed,
          teamSlots: teamSlotsUsed
        },
        races: []
      });
    } else {
      throw new Error(`Deck building failed: ${deckResult.error}`);
    }
  }

  return true;
}

// Step 4: Simulate races
async function simulateRaces() {
  console.log('\n🏁 STEP 4: SIMULATE RACES');
  console.log('='.repeat(60));

  const { getAllF1Data } = require('../src/constants/f1DataLoader');
  const f1Data = getAllF1Data(season);
  const { normalizeDriverName, normalizeTeamName } = f1Data;
  
  const allDrivers = (f1Data.drivers || []).map(d => {
    if (typeof d === 'string') return normalizeDriverName(d) || d;
    return normalizeDriverName(d.shortName || d.name || d) || (d.shortName || d.name || d);
  }).filter(d => d);
  
  const allTeams = (f1Data.teams || []).map(t => {
    if (typeof t === 'string') return normalizeTeamName(t) || t;
    return normalizeTeamName(t.name || t.shortName || t) || (t.name || t.shortName || t);
  }).filter(t => t);

  console.log(`   Loaded ${allDrivers.length} drivers and ${allTeams.length} teams`);

  // Track card usage per player
  const playerCardUsage = new Map();
  players.forEach(p => {
    playerCardUsage.set(p.userId, {
      usedDriverCards: new Set(),
      usedTeamCards: new Set(),
      cardActivations: []
    });
  });

  // Simulate all races
  for (let raceIdx = 0; raceIdx < races.length; raceIdx++) {
    const race = races[raceIdx];
    const isSprintWeekend = race.isSprintWeekend;
    
    console.log(`\n--- Race ${raceIdx + 1}/${races.length}: Round ${race.round} - ${race.raceName} ---`);
    if (isSprintWeekend) {
      console.log('   🏃 SPRINT WEEKEND (cards not allowed)');
    }

    const raceReport = {
      round: race.round,
      raceName: race.raceName,
      date: race.date,
      isSprintWeekend: isSprintWeekend,
      players: []
    };

    // Randomly decide which players skip selections (10% chance)
    const playersToSkip = new Set();
    for (let playerIdx = 0; playerIdx < players.length; playerIdx++) {
      if (Math.random() < 0.1) {
        playersToSkip.add(playerIdx);
      }
    }

    // Each player makes selections
    for (let playerIdx = 0; playerIdx < players.length; playerIdx++) {
      const player = players[playerIdx];
      const shouldSkip = playersToSkip.has(playerIdx);
      
      const playerRaceReport = {
        username: player.username,
        skipped: shouldSkip,
        selections: null,
        cards: null,
        points: 0
      };

      if (shouldSkip) {
        console.log(`   ⏭️  ${player.username} skipped selection (will be auto-assigned)`);
        playerRaceReport.selections = { autoAssigned: true };
        raceReport.players.push(playerRaceReport);
        continue;
      }
      
      const driverOffset = (raceIdx * players.length + playerIdx) % allDrivers.length;
      const teamOffset = (raceIdx * players.length + playerIdx) % allTeams.length;

      let mainDriver = allDrivers[driverOffset];
      let reserveDriverIdx = (driverOffset + 1) % allDrivers.length;
      let reserveDriver = allDrivers[reserveDriverIdx];
      
      if (mainDriver === reserveDriver) {
        reserveDriverIdx = (reserveDriverIdx + 1) % allDrivers.length;
        reserveDriver = allDrivers[reserveDriverIdx];
      }
      
      const normalizedMainDriver = normalizeDriverName(mainDriver) || mainDriver;
      const normalizedReserveDriver = normalizeDriverName(reserveDriver) || reserveDriver;
      const normalizedTeam = normalizeTeamName(allTeams[teamOffset]) || allTeams[teamOffset];

      // Make selections
      const selectionResult = await apiCall('POST', '/api/selections/save', {
        leagueId,
        round: race.round,
        mainDriver: normalizedMainDriver,
        reserveDriver: normalizedReserveDriver,
        team: normalizedTeam
      }, player.authToken);

      if (!selectionResult.success) {
        console.error(`   ❌ Selection failed for ${player.username}:`, selectionResult.error);
        playerRaceReport.selections = { error: selectionResult.error };
        raceReport.players.push(playerRaceReport);
        continue;
      }

      const selectionId = selectionResult.data._id || 
                         selectionResult.data.selection?._id || 
                         selectionResult.data.id;

      playerRaceReport.selections = {
        mainDriver: normalizedMainDriver,
        reserveDriver: normalizedReserveDriver,
        team: normalizedTeam
      };

      // Activate cards (if not sprint weekend)
      if (!isSprintWeekend) {
        const deckResult = await apiCall('GET', `/api/league/${leagueId}/cards/deck`, null, player.authToken);
        if (deckResult.success) {
          const driverCards = deckResult.data.driverCards || [];
          const teamCards = deckResult.data.teamCards || [];
          const usage = playerCardUsage.get(player.userId);

          const availableDriverCards = driverCards.filter(c => 
            !c.used && !usage.usedDriverCards.has(c._id)
          );
          const availableTeamCards = teamCards.filter(c => 
            !c.used && !usage.usedTeamCards.has(c._id)
          );

          let driverCard = null;
          let teamCard = null;
          let targetPlayer = null;
          let targetTeam = null;
          let targetDriver = null;

          // Select available cards
          if (availableDriverCards.length > 0) {
            driverCard = availableDriverCards[Math.floor(Math.random() * availableDriverCards.length)];
          }
          if (availableTeamCards.length > 0) {
            teamCard = availableTeamCards[Math.floor(Math.random() * availableTeamCards.length)];
          }

          // Handle special cards
          if (driverCard?.requiresTarget === 'player') {
            const opponents = players.filter(p => p.userId !== player.userId);
            if (opponents.length > 0) {
              const selectedOpponent = opponents[Math.floor(Math.random() * opponents.length)];
              targetPlayer = selectedOpponent.userId?.toString() || selectedOpponent.userId;
            }
          } else if (driverCard?.requiresTarget === 'driver') {
            if (allDrivers.length > 0) {
              targetDriver = allDrivers[Math.floor(Math.random() * allDrivers.length)];
            }
          }

          if (teamCard?.requiresTarget === 'team') {
            if (allTeams.length > 0) {
              targetTeam = allTeams[Math.floor(Math.random() * allTeams.length)];
            }
          }

          if (driverCard || teamCard) {
            const activateResult = await apiCall('POST', `/api/selections/${selectionId}/cards`, {
              driverCardId: driverCard?._id || null,
              teamCardId: teamCard?._id || null,
              targetPlayer: targetPlayer || null,
              targetDriver: targetDriver || null,
              targetTeam: targetTeam || null
            }, player.authToken);

            if (activateResult.success) {
              const cardReport = {
                driverCard: null,
                teamCard: null,
                transformations: {}
              };

              if (driverCard) {
                usage.usedDriverCards.add(driverCard._id);
                const transformed = activateResult.data.transformations;
                if (transformed?.mysteryCard) {
                  cardReport.driverCard = {
                    original: driverCard.name,
                    transformed: transformed.mysteryCard.name,
                    type: 'mystery'
                  };
                  cardReport.transformations.mystery = transformed.mysteryCard.name;
                } else {
                  cardReport.driverCard = {
                    name: driverCard.name,
                    tier: driverCard.tier,
                    target: targetPlayer || targetDriver || null
                  };
                }
                console.log(`   ✅ ${player.username}: Driver card: ${driverCard.name}`);
              }

              if (teamCard) {
                usage.usedTeamCards.add(teamCard._id);
                const transformed = activateResult.data.transformations;
                if (transformed?.randomCard) {
                  cardReport.teamCard = {
                    original: teamCard.name,
                    transformed: transformed.randomCard.name,
                    type: 'random'
                  };
                  cardReport.transformations.random = transformed.randomCard.name;
                } else {
                  cardReport.teamCard = {
                    name: teamCard.name,
                    tier: teamCard.tier,
                    target: targetTeam || null
                  };
                }
                console.log(`   ✅ ${player.username}: Team card: ${teamCard.name}`);
              }

              playerRaceReport.cards = cardReport;
              usage.cardActivations.push({
                round: race.round,
                raceName: race.raceName,
                ...cardReport
              });
            }
          }
        }
      }

      raceReport.players.push(playerRaceReport);
    }

    reportData.races.push(raceReport);
    
    // Small delay
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Store card usage in report
  players.forEach(player => {
    const usage = playerCardUsage.get(player.userId);
    const playerData = reportData.players.find(p => p.userId === player.userId);
    if (playerData) {
      playerData.cardUsage = {
        driverCardsUsed: usage.usedDriverCards.size,
        teamCardsUsed: usage.usedTeamCards.size,
        activations: usage.cardActivations
      };
    }
  });

  return true;
}

// Step 5: Simulate race results
async function simulateRaceResults() {
  console.log('\n🏆 STEP 5: SIMULATE RACE RESULTS');
  console.log('='.repeat(60));

  const { getAllF1Data } = require('../src/constants/f1DataLoader');
  const f1Data = getAllF1Data(season);
  const { getDriverTeam } = f1Data;
  
  const allDrivers = (f1Data.drivers || []).map(d => {
    if (typeof d === 'string') return d;
    return d.shortName || d.name || d;
  });

  const serverKey = process.env.SERVER_KEY || '0&i45LVr=TV';

  for (let raceIdx = 0; raceIdx < races.length; raceIdx++) {
    const race = races[raceIdx];
    
    const now = new Date();
    const raceDate = new Date(race.date);
    if (raceDate > now) {
      continue;
    }

    console.log(`\n   📊 Processing race ${race.round}: ${race.raceName}...`);

    const shuffledDrivers = [...allDrivers].sort(() => Math.random() - 0.5);
    const raceResults = shuffledDrivers.map((driver, idx) => {
      const team = getDriverTeam(driver) || 'Unknown';
      return {
        driver: driver,
        team: team,
        position: idx + 1,
        points: calculatePointsFromPosition(idx + 1, false), // Main race points
        fastestLap: idx === 0 && !race.isSprintWeekend,
        dnf: false
      };
    });

    // Calculate team results from race results
    const racePointsByTeam = {};
    raceResults.forEach(result => {
      if (!result.team) return;
      racePointsByTeam[result.team] = (racePointsByTeam[result.team] || 0) + (result.points || 0);
    });

    // Build sprint results if it's a sprint weekend
    let sprintResults = undefined;
    let sprintPointsByTeam = {};
    if (race.isSprintWeekend) {
      const sprintShuffled = [...allDrivers].sort(() => Math.random() - 0.5);
      sprintResults = sprintShuffled.map((driver, idx) => {
        const team = getDriverTeam(driver) || 'Unknown';
        return {
          driver: driver,
          team: team,
          position: idx + 1,
          points: calculatePointsFromPosition(idx + 1, true), // Sprint points
          dnf: false
        };
      });
      
      sprintResults.forEach(result => {
        if (!result.team) return;
        sprintPointsByTeam[result.team] = (sprintPointsByTeam[result.team] || 0) + (result.points || 0);
      });
    }

    // Merge into final team results
    const teamNames = new Set([
      ...Object.keys(racePointsByTeam),
      ...Object.keys(sprintPointsByTeam)
    ]);

    const teamResults = Array.from(teamNames).map(team => {
      const racePoints = racePointsByTeam[team] || 0;
      const sprintPoints = race.isSprintWeekend ? (sprintPointsByTeam[team] || 0) : 0;
      const totalPoints = racePoints + sprintPoints;

      return {
        team,
        racePoints,
        sprintPoints,
        totalPoints
      };
    });

    const raceResultPayload = {
      raceResults: raceResults,
      teamResults: teamResults,
      sprintResults: sprintResults,
      sprintTeamResults: race.isSprintWeekend ? teamResults : undefined
    };

    const updateResult = await apiCall('POST', `/api/race/update-race-results/${race.round}`, 
      raceResultPayload, null, { 'x-server-key': serverKey });

    if (updateResult.success) {
      console.log(`   ✅ Race results updated (status: completed)`);
      console.log(`   ⏳ Waiting for scoring to complete...`);
      // Wait longer for scoring to complete (post-save hook processes all leagues)
      await new Promise(resolve => setTimeout(resolve, 3000));
      console.log(`   ✅ Scoring completed`);
    } else {
      console.error(`   ❌ Failed to update race results:`, updateResult.error);
    }
  }

  return true;
}

function calculatePointsFromPosition(position, isSprint = false) {
  if (isSprint) {
    const sprintPoints = { 1: 8, 2: 7, 3: 6, 4: 5, 5: 4, 6: 3, 7: 2, 8: 1 };
    return sprintPoints[position] || 0;
  } else {
    const racePoints = { 1: 25, 2: 18, 3: 15, 4: 12, 5: 10, 6: 8, 7: 6, 8: 4, 9: 2, 10: 1 };
    return racePoints[position] || 0;
  }
}

// Step 6: Get final standings and statistics
async function getFinalData() {
  console.log('\n📊 STEP 6: GET FINAL STANDINGS AND STATISTICS');
  console.log('='.repeat(60));

  // Wait a bit more for any final scoring to complete
  console.log('   ⏳ Waiting for final scoring to complete...');
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Get standings with retry
  let standingsResult = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    standingsResult = await apiCall('GET', `/api/league/${leagueId}/standings/${season}`, null, players[0].authToken);
    if (standingsResult.success && standingsResult.data) {
      const hasPoints = standingsResult.data.driverStandings?.some(s => s.totalPoints > 0) ||
                        standingsResult.data.teamStandings?.some(s => s.totalPoints > 0);
      if (hasPoints || attempt === 2) {
        break; // Got standings with points, or last attempt
      }
      console.log(`   ⏳ Standings not ready yet, waiting... (attempt ${attempt + 1}/3)`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  if (standingsResult && standingsResult.success) {
    reportData.standings = standingsResult.data;
    const totalPoints = standingsResult.data.driverStandings?.reduce((sum, s) => sum + (s.totalPoints || 0), 0) || 0;
    console.log(`✅ Standings retrieved (total points: ${totalPoints})`);
  } else {
    console.warn(`⚠️ Could not retrieve standings or standings show 0 points`);
  }

  // Get statistics for each player
  for (const player of players) {
    const statsResult = await apiCall('GET', `/api/statistics/league/${leagueId}/user/${player.userId}`, null, player.authToken);
    if (statsResult.success) {
      const playerData = reportData.players.find(p => p.userId === player.userId);
      if (playerData) {
        playerData.statistics = statsResult.data;
      }
    }
  }

  return true;
}

// Step 7: Generate comprehensive report
function generateReport() {
  console.log('\n📄 STEP 7: GENERATING COMPREHENSIVE REPORT');
  console.log('='.repeat(60));

  const report = {
    simulationDate: new Date().toISOString(),
    league: reportData.league,
    summary: {
      totalRaces: races.length,
      totalPlayers: players.length,
      sprintWeekends: races.filter(r => r.isSprintWeekend).length,
      regularWeekends: races.filter(r => !r.isSprintWeekend).length
    },
    players: reportData.players.map(player => {
      const standings = reportData.standings?.driverStandings?.find(s => 
        s.user._id === player.userId || s.user.username === player.username
      );
      const teamStandings = reportData.standings?.constructorStandings?.find(s => 
        s.user._id === player.userId || s.user.username === player.username
      );

      return {
        username: player.username,
        deck: player.deck,
        cardUsage: player.cardUsage,
        standings: {
          driver: standings ? {
            position: standings.position,
            totalPoints: standings.totalPoints,
            races: standings.raceResults?.length || 0
          } : null,
          team: teamStandings ? {
            position: teamStandings.position,
            totalPoints: teamStandings.totalPoints,
            races: teamStandings.raceResults?.length || 0
          } : null
        },
        statistics: player.statistics
      };
    }),
    races: reportData.races.map(race => ({
      round: race.round,
      raceName: race.raceName,
      date: race.date,
      isSprintWeekend: race.isSprintWeekend,
      players: race.players.map(p => ({
        username: p.username,
        skipped: p.skipped,
        selections: p.selections,
        cards: p.cards,
        points: p.points
      }))
    })),
    standings: {
      driverStandings: reportData.standings?.driverStandings?.map(s => ({
        position: s.position,
        username: s.user.username,
        totalPoints: s.totalPoints,
        races: s.raceResults?.length || 0
      })) || [],
      teamStandings: reportData.standings?.constructorStandings?.map(s => ({
        position: s.position,
        username: s.user.username,
        totalPoints: s.totalPoints,
        races: s.raceResults?.length || 0
      })) || []
    }
  };

  // Save report to file
  const reportPath = path.join(__dirname, `full_season_report_${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n✅ Report saved to: ${reportPath}`);

  // Print summary
  console.log('\n📊 SIMULATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`League: ${report.league.name} (Season ${report.league.season})`);
  console.log(`Players: ${report.summary.totalPlayers}`);
  console.log(`Races: ${report.summary.totalRaces}`);
  console.log(`Sprint Weekends: ${report.summary.sprintWeekends}`);
  console.log(`Regular Weekends: ${report.summary.regularWeekends}`);

  console.log('\n🏆 FINAL DRIVER STANDINGS:');
  report.standings.driverStandings.slice(0, 10).forEach((standing, idx) => {
    console.log(`   ${idx + 1}. ${standing.username}: ${standing.totalPoints} pts (${standing.races} races)`);
  });

  console.log('\n🏆 FINAL TEAM STANDINGS:');
  report.standings.teamStandings.slice(0, 10).forEach((standing, idx) => {
    console.log(`   ${idx + 1}. ${standing.username}: ${standing.totalPoints} pts (${standing.races} races)`);
  });

  console.log('\n🎴 CARD USAGE SUMMARY:');
  report.players.forEach(player => {
    console.log(`\n   ${player.username}:`);
    console.log(`      Driver cards used: ${player.cardUsage?.driverCardsUsed || 0}`);
    console.log(`      Team cards used: ${player.cardUsage?.teamCardsUsed || 0}`);
    console.log(`      Total activations: ${player.cardUsage?.activations?.length || 0}`);
  });

  return report;
}

// Main execution
async function runSimulation() {
  console.log('🧪 FULL SEASON SIMULATION WITH COMPREHENSIVE REPORT');
  console.log('='.repeat(60));
  console.log('API Base URL:', API_BASE_URL);
  console.log('Number of Players:', NUM_PLAYERS);
  console.log('Season:', season);

  try {
    await setup();
    await getRaceCalendarAndCards();
    await buildDecks();
    await simulateRaces();
    await simulateRaceResults();
    await getFinalData();
    const report = generateReport();
    
    console.log('\n✅ Full season simulation completed successfully!');
    return report;
  } catch (error) {
    console.error('\n❌ SIMULATION FAILED:', error);
    console.error(error.stack);
    throw error;
  }
}

if (require.main === module) {
  runSimulation()
    .then(() => {
      console.log('\n🏁 Simulation finished');
      process.exit(0);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { runSimulation };

