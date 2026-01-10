const Card = require('../models/Card');
const PlayerCard = require('../models/PlayerCard');
const CardUsage = require('../models/CardUsage');
const RaceCardSelection = require('../models/RaceCardSelection');
const League = require('../models/League');
const RaceSelection = require('../models/RaceSelection');
const RaceCalendar = require('../models/RaceCalendar');
const RaceResult = require('../models/RaceResult');
const { handleError } = require('../utils/errorHandler');

/**
 * Get all card definitions
 * GET /api/cards
 */
const getAllCards = async (req, res) => {
  try {
    const { type } = req.query; // Optional filter: 'driver' or 'team'
    
    const query = { isActive: true };
    if (type && (type === 'driver' || type === 'team')) {
      query.type = type;
    }

    const cards = await Card.find(query).sort({ type: 1, tier: 1, name: 1 });
    
    res.json({
      success: true,
      cards
    });
  } catch (error) {
    handleError(res, error);
  }
};

/**
 * Get player's card collection for a league
 * GET /api/leagues/:leagueId/cards
 */
const getPlayerCards = async (req, res) => {
  try {
    const leagueId = req.params.id || req.params.leagueId;
    const userId = req.user._id;

    console.log('[getPlayerCards] Request:', { leagueId, userId });

    // Verify league exists and user is a member
    const league = await League.findById(leagueId);
    if (!league) {
      console.error('[getPlayerCards] League not found:', leagueId);
      return res.status(404).json({ error: 'League not found' });
    }

    console.log('[getPlayerCards] League found:', { id: league._id, season: league.season });

    const isMember = league.members.some(member => 
      member.toString() === userId.toString()
    );
    if (!isMember && league.owner.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'You must be a member of this league' });
    }

    // Get all cards available
    const allCards = await Card.find({ isActive: true }).sort({ type: 1, tier: 1, name: 1 });
    console.log('[getPlayerCards] Found cards:', { total: allCards.length, driver: allCards.filter(c => c.type === 'driver').length, team: allCards.filter(c => c.type === 'team').length });

    // Get player's card collection for this league/season
    const playerCards = await PlayerCard.find({
      user: userId,
      league: leagueId,
      season: league.season
    }).populate('card');

    // Filter out any playerCards with null/undefined card (in case card was deleted)
    const validPlayerCards = playerCards.filter(pc => pc.card && pc.card._id);

    // Get used cards for this season
    const usedCards = await CardUsage.find({
      user: userId,
      league: leagueId,
      season: league.season
    });

    // Extract used card IDs (card is stored as ObjectId, not populated)
    const usedCardIds = new Set(usedCards
      .filter(uc => uc.card) // Filter out any null/undefined cards
      .map(uc => uc.card.toString()) // Convert ObjectId to string
    );

    // Format response
    const driverCards = allCards
      .filter(c => c && c.type === 'driver')
      .map(card => {
        try {
          const playerCard = validPlayerCards.find(pc => 
            pc.card && pc.card._id && pc.card._id.toString() === card._id.toString()
          );
          const isUsed = usedCardIds.has(card._id.toString());
          
          return {
            _id: card._id,
            name: card.name,
            type: card.type,
            tier: card.tier,
            slotCost: card.slotCost,
            effectType: card.effectType,
            effectValue: card.effectValue,
            description: card.description,
            requiresTarget: card.requiresTarget,
            isActive: card.isActive,
            inCollection: !!playerCard,
            selected: playerCard?.selected || false,
            used: isUsed
          };
        } catch (err) {
          console.error('[getPlayerCards] Error processing driver card:', card._id, err);
          return null;
        }
      })
      .filter(card => card !== null);

    const teamCards = allCards
      .filter(c => c && c.type === 'team')
      .map(card => {
        try {
          const playerCard = validPlayerCards.find(pc => 
            pc.card && pc.card._id && pc.card._id.toString() === card._id.toString()
          );
          const isUsed = usedCardIds.has(card._id.toString());
          
          return {
            _id: card._id,
            name: card.name,
            type: card.type,
            tier: card.tier,
            slotCost: card.slotCost,
            effectType: card.effectType,
            effectValue: card.effectValue,
            description: card.description,
            requiresTarget: card.requiresTarget,
            isActive: card.isActive,
            inCollection: !!playerCard,
            selected: playerCard?.selected || false,
            used: isUsed
          };
        } catch (err) {
          console.error('[getPlayerCards] Error processing team card:', card._id, err);
          return null;
        }
      })
      .filter(card => card !== null);

    console.log('[getPlayerCards] Success:', { driverCards: driverCards.length, teamCards: teamCards.length });
    res.json({
      success: true,
      driverCards,
      teamCards,
      season: league.season
    });
  } catch (error) {
    console.error('[getPlayerCards] Error:', error);
    console.error('[getPlayerCards] Error stack:', error.stack);
    handleError(res, error);
  }
};

/**
 * Get used card IDs for a season
 * GET /api/leagues/:leagueId/cards/used
 */
const getUsedCards = async (req, res) => {
  try {
    const leagueId = req.params.id || req.params.leagueId;
    const userId = req.user._id;

    // Verify league exists and user is a member
    const league = await League.findById(leagueId);
    if (!league) {
      return res.status(404).json({ error: 'League not found' });
    }

    const isMember = league.members.some(member => 
      member.toString() === userId.toString()
    );
    if (!isMember && league.owner.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'You must be a member of this league' });
    }

    // Get used cards for this season
    const usedCards = await CardUsage.find({
      user: userId,
      league: leagueId,
      season: league.season
    }).select('card'); // Only select the card ID field

    // Extract used card IDs
    const usedCardIds = usedCards
      .filter(uc => uc.card) // Filter out any null/undefined cards
      .map(uc => uc.card.toString()); // Convert ObjectId to string

    res.json({
      success: true,
      usedCardIds,
      season: league.season
    });
  } catch (error) {
    handleError(res, error);
  }
};

/**
 * Get player's current deck
 * GET /api/leagues/:leagueId/cards/deck
 */
const getPlayerDeck = async (req, res) => {
  try {
    const leagueId = req.params.id || req.params.leagueId;
    const userId = req.user._id;

    // Verify league exists and user is a member
    const league = await League.findById(leagueId);
    if (!league) {
      return res.status(404).json({ error: 'League not found' });
    }

    const isMember = league.members.some(member => 
      member.toString() === userId.toString()
    );
    if (!isMember && league.owner.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'You must be a member of this league' });
    }

    // Get selected cards (deck)
    const deck = await PlayerCard.find({
      user: userId,
      league: leagueId,
      season: league.season,
      selected: true
    }).populate('card');

    // Filter out any null cards and map to card objects
    const driverCards = deck
      .filter(pc => pc.cardType === 'driver' && pc.card && pc.card._id)
      .map(pc => pc.card)
      .filter(card => card !== null && card !== undefined);
    
    const teamCards = deck
      .filter(pc => pc.cardType === 'team' && pc.card && pc.card._id)
      .map(pc => pc.card)
      .filter(card => card !== null && card !== undefined);

    // Calculate slot usage (with null checks)
    const driverSlots = driverCards.reduce((sum, card) => sum + (card?.slotCost || 0), 0);
    const teamSlots = teamCards.reduce((sum, card) => sum + (card?.slotCost || 0), 0);
    const goldTeamCards = teamCards.filter(c => c && c.tier === 'gold').length;

    res.json({
      success: true,
      driverCards,
      teamCards,
      driverSlots,
      teamSlots,
      driverSlotsUsed: driverSlots,
      teamSlotsUsed: teamSlots,
      driverSlotsMax: 12,
      teamSlotsMax: 10,
      driverCardsCount: driverCards.length,
      teamCardsCount: teamCards.length,
      driverCardsMax: 8,
      teamCardsMax: 6,
      goldTeamCardsCount: goldTeamCards,
      goldTeamCardsMax: 1,
      season: league.season
    });
  } catch (error) {
    handleError(res, error);
  }
};

/**
 * Build deck (select Driver + Team cards)
 * POST /api/leagues/:leagueId/cards/select
 */
const selectDeck = async (req, res) => {
  try {
    const leagueId = req.params.id || req.params.leagueId;
    const userId = req.user._id;
    const { driverCardIds, teamCardIds } = req.body;

    // Verify league exists and user is a member
    const league = await League.findById(leagueId);
    if (!league) {
      return res.status(404).json({ error: 'League not found' });
    }

    const isMember = league.members.some(member => 
      member.toString() === userId.toString()
    );
    if (!isMember && league.owner.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'You must be a member of this league' });
    }

    // Check if deck is locked (5 minutes before first race qualifying deadline)
    const currentDate = new Date();
    const firstRace = await RaceCalendar.findOne({ 
      season: league.season 
    }).sort({ date: 1 });

    if (firstRace) {
      // Calculate the lock time: 5 minutes before qualifying (or sprint qualifying if sprint weekend)
      const qualifyingTime = firstRace.isSprintWeekend && firstRace.sprintQualifyingStart
        ? new Date(firstRace.sprintQualifyingStart)
        : new Date(firstRace.qualifyingStart);
      
      const lockTime = new Date(qualifyingTime.getTime() - 5 * 60 * 1000); // 5 minutes before

      if (currentDate >= lockTime) {
        return res.status(400).json({ 
          error: 'Deck cannot be changed after the first race selection deadline. The deck is locked for the entire season.' 
        });
      }
    }

    // Validate input
    if (!Array.isArray(driverCardIds) || !Array.isArray(teamCardIds)) {
      return res.status(400).json({ error: 'driverCardIds and teamCardIds must be arrays' });
    }

    // Get card details
    const driverCards = await Card.find({ 
      _id: { $in: driverCardIds },
      type: 'driver',
      isActive: true
    });
    const teamCards = await Card.find({ 
      _id: { $in: teamCardIds },
      type: 'team',
      isActive: true
    });

    // Validate driver cards
    if (driverCards.length !== driverCardIds.length) {
      return res.status(400).json({ error: 'Invalid driver card IDs' });
    }
    const driverSlots = driverCards.reduce((sum, card) => sum + card.slotCost, 0);
    if (driverSlots > 12) {
      return res.status(400).json({ error: 'Maximum 12 driver card slots allowed' });
    }
    if (driverSlots < 12) {
      return res.status(400).json({ error: 'You must use all 12 driver card slots' });
    }

    // Validate team cards
    if (teamCards.length !== teamCardIds.length) {
      return res.status(400).json({ error: 'Invalid team card IDs' });
    }
    const teamSlots = teamCards.reduce((sum, card) => sum + card.slotCost, 0);
    if (teamSlots > 10) {
      return res.status(400).json({ error: 'Maximum 10 team card slots allowed' });
    }
    if (teamSlots < 10) {
      return res.status(400).json({ error: 'You must use all 10 team card slots' });
    }
    const goldTeamCards = teamCards.filter(c => c.tier === 'gold');
    if (goldTeamCards.length > 1) {
      return res.status(400).json({ error: 'Maximum 1 gold team card allowed' });
    }

    // Check for duplicates
    const uniqueDriverIds = [...new Set(driverCardIds)];
    const uniqueTeamIds = [...new Set(teamCardIds)];
    if (uniqueDriverIds.length !== driverCardIds.length) {
      return res.status(400).json({ error: 'Duplicate driver cards not allowed' });
    }
    if (uniqueTeamIds.length !== teamCardIds.length) {
      return res.status(400).json({ error: 'Duplicate team cards not allowed' });
    }

    // Get existing player cards
    const existingPlayerCards = await PlayerCard.find({
      user: userId,
      league: leagueId,
      season: league.season
    });

    // Mark all existing cards as not selected
    for (const playerCard of existingPlayerCards) {
      playerCard.selected = false;
      await playerCard.save();
    }

    // Create or update player cards for selected driver cards
    for (const cardId of driverCardIds) {
      let playerCard = existingPlayerCards.find(
        pc => pc.card.toString() === cardId.toString() && pc.cardType === 'driver'
      );
      
      if (playerCard) {
        playerCard.selected = true;
        await playerCard.save();
      } else {
        playerCard = new PlayerCard({
          user: userId,
          league: leagueId,
          season: league.season,
          card: cardId,
          cardType: 'driver',
          selected: true
        });
        await playerCard.save();
      }
    }

    // Create or update player cards for selected team cards
    for (const cardId of teamCardIds) {
      let playerCard = existingPlayerCards.find(
        pc => pc.card.toString() === cardId.toString() && pc.cardType === 'team'
      );
      
      if (playerCard) {
        playerCard.selected = true;
        await playerCard.save();
      } else {
        playerCard = new PlayerCard({
          user: userId,
          league: leagueId,
          season: league.season,
          card: cardId,
          cardType: 'team',
          selected: true
        });
        await playerCard.save();
      }
    }

    res.json({
      success: true,
      message: 'Deck selected successfully',
      driverCards: driverCards.length,
      teamCards: teamCards.length,
      driverSlots,
      teamSlots
    });
  } catch (error) {
    handleError(res, error);
  }
};

/**
 * Activate cards for a race
 * POST /api/selections/:selectionId/cards
 */
const activateCards = async (req, res) => {
  try {
    const { selectionId } = req.params;
    const userId = req.user._id;
    const { driverCardId, teamCardId, targetPlayer, targetDriver, targetTeam } = req.body;

    // Get the race selection
    const selection = await RaceSelection.findById(selectionId)
      .populate('league')
      .populate('race');
    
    if (!selection) {
      return res.status(404).json({ error: 'Selection not found' });
    }

    // Verify user owns this selection
    if (selection.user.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'You can only activate cards for your own selections' });
    }

    const league = selection.league;
    let race = selection.race;

    // Log selection details first
    console.log('[activateCards] Selection details:', {
      selectionId: selection._id,
      round: selection.round,
      raceId: selection.race,
      raceIdType: typeof selection.race,
      leagueSeason: league.season
    });

    // Check if race was populated
    if (!race) {
      console.error('[activateCards] Race not populated for selection:', selectionId);
      console.error('[activateCards] Selection object:', JSON.stringify(selection, null, 2));
      return res.status(400).json({ error: 'Race information not found' });
    }
    
    // IMPORTANT: Verify the race matches the league season and round
    // If the race is from a different season, fetch the correct race
    if (race.season !== league.season) {
      console.warn('[activateCards] ⚠️ Race season mismatch!', {
        raceSeason: race.season,
        leagueSeason: league.season,
        round: selection.round,
        raceId: race._id
      });
      
      // Fetch the correct race for this season and round
      const correctRace = await RaceCalendar.findOne({
        season: league.season,
        round: selection.round
      });
      
      if (correctRace) {
        console.log('[activateCards] ✅ Found correct race:', {
          raceId: correctRace._id,
          raceName: correctRace.raceName,
          season: correctRace.season,
          round: correctRace.round
        });
        race = correctRace;
      } else {
        console.error('[activateCards] ❌ Could not find correct race for season', league.season, 'round', selection.round);
        return res.status(400).json({ 
          error: 'Race not found for this season and round',
          details: {
            leagueSeason: league.season,
            round: selection.round,
            oldRaceSeason: race.season
          }
        });
      }
    }
    
    // Log race details
    console.log('[activateCards] Race details:', {
      raceId: race._id,
      raceName: race.raceName,
      round: race.round,
      season: race.season,
      qualifyingStart: race.qualifyingStart,
      raceStart: race.raceStart,
      qualifyingStartType: typeof race.qualifyingStart,
      raceStartType: typeof race.raceStart
    });

    // Check if league is 2026+ (cards only for 2026+)
    if (league.season < 2026) {
      return res.status(400).json({ error: 'Cards are only available for 2026+ seasons' });
    }

    // Check if it's a sprint weekend (cards not allowed)
    const raceResult = await RaceResult.findOne({ round: selection.round });
    if (raceResult && raceResult.isSprintWeekend) {
      return res.status(400).json({ error: 'Cards cannot be used on sprint weekends' });
    }

    // Cards must be selected before qualifying (same deadline as driver/team selections)
    const now = new Date();
    
    // Check if qualifying has started (cards must be selected BEFORE qualifying)
    if (race.qualifyingStart) {
      const qualifyingStartDate = new Date(race.qualifyingStart);
      
      // Debug logging with detailed date info
      console.log('[activateCards] Date check:', {
        now: now.toISOString(),
        nowTimestamp: now.getTime(),
        nowLocal: now.toString(),
        qualifyingStart: race.qualifyingStart,
        qualifyingStartISO: qualifyingStartDate.toISOString(),
        qualifyingStartTimestamp: qualifyingStartDate.getTime(),
        qualifyingStartLocal: qualifyingStartDate.toString(),
        raceName: race.raceName,
        round: selection.round,
        isQualifyingStartValid: !isNaN(qualifyingStartDate.getTime())
      });
      
      if (!isNaN(qualifyingStartDate.getTime())) {
        const timeDiff = qualifyingStartDate.getTime() - now.getTime();
        const daysUntilQualifying = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        const hoursUntilQualifying = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        
        console.log('[activateCards] Time until qualifying:', {
          milliseconds: timeDiff,
          days: daysUntilQualifying,
          hours: hoursUntilQualifying,
          comparison: now >= qualifyingStartDate ? 'NOW >= QUALIFYING (BLOCKED)' : 'NOW < QUALIFYING (ALLOWED)'
        });
        
        // Block if qualifying has started (cards must be selected before qualifying)
        if (now >= qualifyingStartDate) {
          console.log('[activateCards] ❌ BLOCKING: Qualifying has started or passed');
          return res.status(400).json({ 
            error: 'Cards must be selected before qualifying starts',
            details: {
              now: now.toISOString(),
              qualifyingStart: qualifyingStartDate.toISOString(),
              timeUntilQualifying: `${daysUntilQualifying} days, ${hoursUntilQualifying} hours`
            }
          });
        } else {
          console.log('[activateCards] ✅ ALLOWING: Qualifying has not started yet');
        }
      } else {
        console.error('[activateCards] Invalid qualifyingStart date:', race.qualifyingStart);
      }
    } else {
      console.log('[activateCards] No qualifyingStart date found, skipping qualifying check');
    }
    
    // Also check if race has started (additional safety check)
    if (race.raceStart) {
      const raceStartDate = new Date(race.raceStart);
      if (!isNaN(raceStartDate.getTime()) && now >= raceStartDate) {
        console.log('[activateCards] Race has started, blocking card activation');
        return res.status(400).json({ error: 'Cards must be selected before the race starts' });
      }
    }

    // Validate cards are in player's deck
    if (driverCardId) {
      const playerDriverCard = await PlayerCard.findOne({
        user: userId,
        league: league._id,
        season: league.season,
        card: driverCardId,
        cardType: 'driver',
        selected: true
      });
      if (!playerDriverCard) {
        return res.status(400).json({ error: 'Driver card not in your deck' });
      }

      // Check if card already used this season (excluding current race if updating)
      const existingRaceCardSelection = await RaceCardSelection.findOne({
        user: userId,
        league: league._id,
        race: race._id
      });
      const currentRaceRound = existingRaceCardSelection ? selection.round : null;
      
      const cardUsageQuery = {
        user: userId,
        league: league._id,
        season: league.season,
        card: driverCardId
      };
      
      // If we're updating an existing selection, exclude the current race from the check
      if (currentRaceRound) {
        cardUsageQuery.race = { $ne: currentRaceRound };
      }
      
      const cardUsage = await CardUsage.findOne(cardUsageQuery);
      if (cardUsage) {
        return res.status(400).json({ error: 'Driver card already used this season' });
      }
    }

    if (teamCardId) {
      const playerTeamCard = await PlayerCard.findOne({
        user: userId,
        league: league._id,
        season: league.season,
        card: teamCardId,
        cardType: 'team',
        selected: true
      });
      if (!playerTeamCard) {
        return res.status(400).json({ error: 'Team card not in your deck' });
      }

      // Check if card already used this season (excluding current race if updating)
      const existingRaceCardSelection = await RaceCardSelection.findOne({
        user: userId,
        league: league._id,
        race: race._id
      });
      const currentRaceRound = existingRaceCardSelection ? selection.round : null;
      
      const cardUsageQuery = {
        user: userId,
        league: league._id,
        season: league.season,
        card: teamCardId
      };
      
      // If we're updating an existing selection, exclude the current race from the check
      if (currentRaceRound) {
        cardUsageQuery.race = { $ne: currentRaceRound };
      }
      
      const cardUsage = await CardUsage.findOne(cardUsageQuery);
      if (cardUsage) {
        return res.status(400).json({ error: 'Team card already used this season' });
      }
    }

    // Validate special card targets
    let mysteryTransformedCardId = null;
    let randomTransformedCardId = null;

    if (driverCardId) {
      const driverCard = await Card.findById(driverCardId);
      if (driverCard.requiresTarget === 'player' && !targetPlayer) {
        return res.status(400).json({ error: 'Target player required for Mirror card' });
      }
      if (driverCard.requiresTarget === 'driver' && !targetDriver) {
        return res.status(400).json({ error: 'Target driver required for Switcheroo card' });
      }
      
      // Handle Mystery Card transformation at activation time
      if (driverCard.effectType === 'mystery') {
        // Exclude Mystery Card itself from possible transformations
        const allDriverCards = await Card.find({ 
          type: 'driver', 
          isActive: true, 
          effectType: { $ne: 'mystery' } 
        });
        if (allDriverCards.length === 0) {
          return res.status(400).json({ error: 'No driver cards available for Mystery Card transformation' });
        }
        const randomCard = allDriverCards[Math.floor(Math.random() * allDriverCards.length)];
        mysteryTransformedCardId = randomCard._id;
        console.log(`[activateCards] Mystery Card transformed into: ${randomCard.name} (${randomCard.effectType})`);
      }
    }

    if (teamCardId) {
      const teamCard = await Card.findById(teamCardId);
      if (teamCard.requiresTarget === 'team' && !targetTeam) {
        return res.status(400).json({ error: 'Target team required for Espionage card' });
      }
      
      // Handle Random card transformation at activation time
      if (teamCard.effectType === 'random') {
        const allTeamCards = await Card.find({ type: 'team', isActive: true });
        const randomCard = allTeamCards[Math.floor(Math.random() * allTeamCards.length)];
        randomTransformedCardId = randomCard._id;
      }
    }

    // Create or update race card selection
    let raceCardSelection = await RaceCardSelection.findOne({
      user: userId,
      league: league._id,
      race: race._id
    });

    // Store old card IDs before updating (to remove old CardUsage records)
    const oldDriverCardId = raceCardSelection?.driverCard?.toString() || null;
    const oldTeamCardId = raceCardSelection?.teamCard?.toString() || null;

    if (raceCardSelection) {
      raceCardSelection.driverCard = driverCardId || null;
      raceCardSelection.teamCard = teamCardId || null;
      raceCardSelection.targetPlayer = targetPlayer || null;
      raceCardSelection.targetDriver = targetDriver || null;
      raceCardSelection.targetTeam = targetTeam || null;
      raceCardSelection.mysteryTransformedCard = mysteryTransformedCardId || null;
      raceCardSelection.randomTransformedCard = randomTransformedCardId || null;
      raceCardSelection.selectedAt = new Date();
      await raceCardSelection.save();
    } else {
      raceCardSelection = new RaceCardSelection({
        user: userId,
        league: league._id,
        race: race._id,
        round: selection.round,
        driverCard: driverCardId || null,
        teamCard: teamCardId || null,
        targetPlayer: targetPlayer || null,
        targetDriver: targetDriver || null,
        targetTeam: targetTeam || null,
        mysteryTransformedCard: mysteryTransformedCardId || null,
        randomTransformedCard: randomTransformedCardId || null
      });
      await raceCardSelection.save();
    }

    // Remove old CardUsage records for this race if card was changed
    if (oldDriverCardId && oldDriverCardId !== (driverCardId?.toString() || null)) {
      await CardUsage.deleteOne({
        user: userId,
        league: league._id,
        season: league.season,
        card: oldDriverCardId,
        race: selection.round
      });
      console.log(`[activateCards] Removed old driver card usage for card ${oldDriverCardId} in race ${selection.round}`);
    }

    if (oldTeamCardId && oldTeamCardId !== (teamCardId?.toString() || null)) {
      await CardUsage.deleteOne({
        user: userId,
        league: league._id,
        season: league.season,
        card: oldTeamCardId,
        race: selection.round
      });
      console.log(`[activateCards] Removed old team card usage for card ${oldTeamCardId} in race ${selection.round}`);
    }

    // Mark cards as used (only when race actually starts - for now we'll do it here)
    // Note: In production, you might want to mark as used only after race completion
    // Check if CardUsage already exists before creating (to avoid duplicates)
    if (driverCardId) {
      const existingDriverUsage = await CardUsage.findOne({
        user: userId,
        league: league._id,
        season: league.season,
        card: driverCardId,
        race: selection.round
      });
      
      if (!existingDriverUsage) {
        const driverCardUsage = new CardUsage({
          user: userId,
          league: league._id,
          season: league.season,
          card: driverCardId,
          cardType: 'driver',
          race: selection.round
        });
        await driverCardUsage.save();
      }
    }

    if (teamCardId) {
      const existingTeamUsage = await CardUsage.findOne({
        user: userId,
        league: league._id,
        season: league.season,
        card: teamCardId,
        race: selection.round
      });
      
      if (!existingTeamUsage) {
        const teamCardUsage = new CardUsage({
          user: userId,
          league: league._id,
          season: league.season,
          card: teamCardId,
          cardType: 'team',
          race: selection.round
        });
        await teamCardUsage.save();
      }
    }

    const populatedSelection = await RaceCardSelection.findById(raceCardSelection._id)
      .populate('driverCard')
      .populate('teamCard')
      .populate('mysteryTransformedCard')
      .populate('randomTransformedCard')
      .populate('targetPlayer', 'username');

    res.json({
      success: true,
      message: 'Cards activated successfully',
      raceCardSelection: populatedSelection,
      // Include transformation info for Mystery/Random cards
      transformations: {
        mysteryCard: mysteryTransformedCardId ? await Card.findById(mysteryTransformedCardId) : null,
        randomCard: randomTransformedCardId ? await Card.findById(randomTransformedCardId) : null
      }
    });
  } catch (error) {
    handleError(res, error);
  }
};

/**
 * Get active cards for a race
 * GET /api/selections/:selectionId/cards
 */
const getRaceCards = async (req, res) => {
  try {
    const { selectionId } = req.params;
    const userId = req.user._id;

    // Get the race selection
    const selection = await RaceSelection.findById(selectionId)
      .populate('league')
      .populate('race');
    
    if (!selection) {
      return res.status(404).json({ error: 'Selection not found' });
    }

    // Verify user owns this selection or is league member
    const league = selection.league;
    const isMember = league.members.some(member => 
      member.toString() === userId.toString()
    );
    if (selection.user.toString() !== userId.toString() && !isMember && league.owner.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // IMPORTANT: Get the correct race for this season and round
    // The selection might be linked to a wrong race (e.g., 2025 instead of 2026)
    let race = selection.race;
    if (race.season !== league.season) {
      console.log('[getRaceCards] Race season mismatch, fetching correct race:', {
        raceSeason: race.season,
        leagueSeason: league.season,
        round: selection.round
      });
      const correctRace = await RaceCalendar.findOne({
        season: league.season,
        round: selection.round
      });
      if (correctRace) {
        race = correctRace;
        console.log('[getRaceCards] Found correct race:', correctRace._id);
      } else {
        console.error('[getRaceCards] Could not find correct race for season', league.season, 'round', selection.round);
      }
    }

    // Get race card selection using the correct race
    // Try by race ID first, then fallback to round + season if not found
    let raceCardSelection = await RaceCardSelection.findOne({
      user: selection.user,
      league: league._id,
      race: race._id
    })
      .populate('driverCard')
      .populate('teamCard')
      .populate('targetPlayer', 'username');
    
    // If not found by race ID, try by round (in case cards were saved with wrong race)
    if (!raceCardSelection) {
      console.log('[getRaceCards] Not found by race ID, trying by round:', selection.round);
      raceCardSelection = await RaceCardSelection.findOne({
        user: selection.user,
        league: league._id,
        round: selection.round
      })
        .populate('driverCard')
        .populate('teamCard')
        .populate('targetPlayer', 'username');
      
      // If found by round but race is wrong, update it to the correct race
      if (raceCardSelection && raceCardSelection.race.toString() !== race._id.toString()) {
        console.log('[getRaceCards] Updating race reference from', raceCardSelection.race, 'to', race._id);
        raceCardSelection.race = race._id;
        await raceCardSelection.save();
      }
    }

    res.json({
      success: true,
      raceCardSelection: raceCardSelection || null
    });
  } catch (error) {
    handleError(res, error);
  }
};

module.exports = {
  getAllCards,
  getPlayerCards,
  getPlayerDeck,
  getUsedCards,
  selectDeck,
  activateCards,
  getRaceCards
};

