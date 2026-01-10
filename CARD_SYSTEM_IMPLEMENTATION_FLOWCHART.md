# Card Boost System - Implementation Flowchart

## Overview
This document outlines the step-by-step implementation plan for the card boost system in Fantasy F1.

---

## PHASE 1: Database Foundation

```
┌─────────────────────────────────────────────────────────────┐
│ STEP 1.1: Create Card Model                                 │
│ - Define card schema with all 12 cards                      │
│ - Fields: name, tier, cost, effectType, description        │
│ - Create seed script to populate initial 12 cards           │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 1.2: Create PlayerCard Model                          │
│ - Track cards owned by each player per league/season        │
│ - Fields: user, league, season, card, quantity, inDeck      │
│ - Indexes: user+league+season, inDeck queries              │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 1.3: Create CardUsage Model                            │
│ - Track when/where cards were used                         │
│ - Fields: user, league, season, round, card, inputData     │
│ - Links to RaceSelection for audit trail                   │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 1.4: Create Credits Model (or add to User)            │
│ - Track credits per user per league per season             │
│ - Fields: user, league, season, credits                    │
│ - Unique index: user+league+season                          │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 1.5: Modify RaceSelection Model                       │
│ - Add: cardUsed (ObjectId ref Card)                        │
│ - Add: basePoints (Number)                                 │
│ - Add: cardBoostPoints (Number)                            │
│ - Modify: points = basePoints + cardBoostPoints            │
└─────────────────────────────────────────────────────────────┘
```

---

## PHASE 2: Season Initialization

```
┌─────────────────────────────────────────────────────────────┐
│ STEP 2.1: Season Start Hook                                │
│ - Detect when new season starts                             │
│ - Trigger: League creation or season change                 │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 2.2: Assign Starting Credits                          │
│ FOR EACH league member:                                     │
│   - Create/Update Credits record                            │
│   - Set credits = 20                                        │
│   - Link to league + season                                 │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 2.3: Clear Previous Season Data                       │
│ - Archive or delete old PlayerCard records                  │
│ - Archive CardUsage records (keep for history)             │
│ - Reset deck status                                         │
└─────────────────────────────────────────────────────────────┘
```

---

## PHASE 3: Card Management APIs

```
┌─────────────────────────────────────────────────────────────┐
│ STEP 3.1: GET /api/cards                                    │
│ - Return all 12 available cards                             │
│ - Include: name, tier, cost, description                    │
│ - No authentication needed (public catalog)                 │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 3.2: GET /api/cards/collection                         │
│ - Get user's card collection for league/season              │
│ - Return: cards owned with quantities                       │
│ - Include: which cards are in deck                          │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 3.3: GET /api/cards/credits                            │
│ - Get user's current credits for league/season              │
│ - Return: { credits: number }                               │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 3.4: POST /api/cards/purchase                          │
│ INPUT: { leagueId, season, cardId, quantity }               │
│ PROCESS:                                                     │
│   1. Verify user has enough credits                         │
│   2. Deduct credits (card.cost * quantity)                  │
│   3. Create/Update PlayerCard record                        │
│   4. Return updated credits and collection                  │
└─────────────────────────────────────────────────────────────┘
```

---

## PHASE 4: Deck Management

```
┌─────────────────────────────────────────────────────────────┐
│ STEP 4.1: GET /api/cards/deck                               │
│ - Get user's current deck (8 cards max)                     │
│ - Return cards marked with inDeck = true                    │
│ - Include card details                                      │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 4.2: POST /api/cards/deck                              │
│ INPUT: { leagueId, season, cardIds: [8 card IDs] }         │
│ VALIDATION:                                                  │
│   - Verify user owns all cards                              │
│   - Verify deck size <= 8                                   │
│   - Verify cards are for same league/season                 │
│ PROCESS:                                                     │
│   1. Set all user's cards inDeck = false                    │
│   2. Set selected cards inDeck = true                       │
│   3. Return updated deck                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## PHASE 5: Card Usage During Selection

```
┌─────────────────────────────────────────────────────────────┐
│ STEP 5.1: Modify Selection API                             │
│ GET /api/selections/current                                 │
│ - Include available cards from deck                         │
│ - Filter out cards already used this season                 │
│ - Return: { selections, availableCards: [...] }            │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 5.2: Card Selection UI Integration                     │
│ - Show deck cards in selection interface                    │
│ - Allow user to select ONE card (optional)                  │
│ - Show card description and effect                          │
│ - For Mirror/Switcheroo: show input fields                  │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 5.3: POST /api/selections (Modified)                  │
│ INPUT: { leagueId, mainDriver, reserveDriver, team,         │
│         cardId (optional), cardInput (optional) }            │
│ VALIDATION:                                                  │
│   - Verify card is in user's deck                           │
│   - Verify card not used this season                        │
│   - Verify card input (if Mirror/Switcheroo)                │
│ PROCESS:                                                     │
│   1. Save race selection (existing logic)                   │
│   2. If cardId provided:                                     │
│      a. Create CardUsage record (pending)                   │
│      b. Link to RaceSelection                               │
│      c. Store cardInput if provided                         │
│   3. Calculate base points (without card)                   │
│   4. Store basePoints in RaceSelection                      │
│   5. Mark cardBoostPoints = 0 (calculated later)            │
└─────────────────────────────────────────────────────────────┘
```

---

## PHASE 6: Scoring Service Integration

```
┌─────────────────────────────────────────────────────────────┐
│ STEP 6.1: Modify ScoringService.calculateRacePoints()       │
│ CURRENT FLOW:                                                │
│   selection + raceResult → totalPoints                      │
│ NEW FLOW:                                                    │
│   selection + raceResult → basePoints                       │
│   basePoints + cardEffect → totalPoints                     │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 6.2: Create CardEffectCalculator Service              │
│ - Separate service to handle card logic                    │
│ - Methods for each card type:                               │
│   * calculate2xPoints(basePoints)                           │
│   * calculateMirror(targetPlayerSelection)                  │
│   * calculateSwitcheroo(targetDriverPoints)                 │
│   * calculateTeamwork2(mainDriver, teammate)                │
│   * calculateTop5Boost(mainDriverPosition)                 │
│   * etc.                                                     │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 6.3: Card Application Logic                            │
│ WHEN: Race results are available                            │
│ FOR EACH RaceSelection with cardUsed:                       │
│   1. Get CardUsage record                                   │
│   2. Check card type                                        │
│   3. IF Mystery Card: resolve to random card                │
│   4. Calculate boost based on card type:                    │
│      - Simple: 2x, +3, Teamwork → immediate                │
│      - Conditional: Top 5, Top 10 → check position          │
│      - Complex: Mirror, Switcheroo → fetch data            │
│   5. Update CardUsage with boostPoints                      │
│   6. Update RaceSelection:                                  │
│      - cardBoostPoints = calculated boost                   │
│      - points = basePoints + cardBoostPoints                │
│   7. DELETE PlayerCard record (card consumed)               │
└─────────────────────────────────────────────────────────────┘
```

---

## PHASE 7: Special Card Handling

```
┌─────────────────────────────────────────────────────────────┐
│ STEP 7.1: Mystery Card Resolution                           │
│ WHEN: Card is activated                                      │
│ PROCESS:                                                     │
│   1. Generate random number (1-11)                          │
│   2. Select card from other 11 cards                         │
│   3. Store resolvedCard in CardUsage                        │
│   4. Process as resolved card type                           │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 7.2: Mirror Card Implementation                       │
│ REQUIREMENTS:                                                │
│   - User selects target player                               │
│   - Fetch target player's RaceSelection for same round       │
│   - Get their total points (base + any card boost)          │
│   - Apply that total as boost                               │
│ STORAGE: Store targetPlayerId in CardUsage.inputData        │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 7.3: Switcheroo Card Implementation                   │
│ REQUIREMENTS:                                                │
│   - User selects target driver                              │
│   - Fetch target driver's race points from RaceResult       │
│   - Replace mainDriverPoints with target driver's points    │
│   - Recalculate total                                       │
│ STORAGE: Store targetDriver in CardUsage.inputData          │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 7.4: Teamwork Cards Implementation                     │
│ REQUIREMENTS:                                                │
│   - Identify teammate from driver data                      │
│   - Fetch teammate's race points                            │
│   - Teamwork: replace mainDriver with teammate              │
│   - Teamwork 2: add mainDriver + teammate                  │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 7.5: Position-Based Cards                             │
│ REQUIREMENTS:                                                │
│   - Move Up 1 Rank: adjust position (P11→P10)              │
│   - Top 5 Boost: check if position <= 5                    │
│   - Top 10 Boost: check if position <= 10                  │
│   - Bottom 5: check if position in last 5 classified       │
│   - Competitiveness: compare with teammate position        │
└─────────────────────────────────────────────────────────────┘
```

---

## PHASE 8: Frontend Integration

```
┌─────────────────────────────────────────────────────────────┐
│ STEP 8.1: Card Collection View                             │
│ - Display all 12 cards with details                        │
│ - Show owned quantities                                     │
│ - Show current credits                                      │
│ - Purchase interface                                        │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 8.2: Deck Builder Interface                            │
│ - Show owned cards                                          │
│ - Drag/drop or select to build deck                         │
│ - Enforce 8-card limit                                      │
│ - Save deck                                                 │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 8.3: Selection Page Integration                        │
│ - Add card selection section                                │
│ - Show available cards from deck                            │
│ - For Mirror: show player list                              │
│ - For Switcheroo: show driver list                          │
│ - Display card effect description                           │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 8.4: Results Display                                  │
│ - Show base points                                          │
│ - Show card boost points (if any)                           │
│ - Show total points                                         │
│ - Display card used (if any)                                │
└─────────────────────────────────────────────────────────────┘
```

---

## PHASE 9: Admin & Maintenance

```
┌─────────────────────────────────────────────────────────────┐
│ STEP 9.1: Admin Card Management                            │
│ - View all card purchases                                   │
│ - View card usage statistics                                │
│ - Manual credit adjustment (if needed)                      │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 9.2: Migration Script                                  │
│ - Add credits to existing users (20 per active league)      │
│ - Handle users in multiple leagues                          │
│ - Set default values for existing RaceSelections            │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 9.3: Testing & Validation                              │
│ - Unit tests for each card effect                           │
│ - Integration tests for card purchase flow                  │
│ - Test card consumption                                      │
│ - Test edge cases (no race results, DNF, etc.)             │
└─────────────────────────────────────────────────────────────┘
```

---

## DATA FLOW DIAGRAM

```
USER ACTION                    BACKEND PROCESS                    DATABASE
─────────────────────────────────────────────────────────────────────────────

Season Start
    │                              │
    ├─→ Initialize Season          │
    │                              ├─→ Create Credits (20)
    │                              ├─→ Clear old PlayerCards
    │                              └─→ Ready for purchases
    │

Purchase Card
    │                              │
    ├─→ POST /cards/purchase       │
    │   {cardId, quantity}         │
    │                              ├─→ Check credits
    │                              ├─→ Deduct credits
    │                              ├─→ Create PlayerCard
    │                              └─→ Return updated data
    │

Build Deck
    │                              │
    ├─→ POST /cards/deck           │
    │   {cardIds: [8 cards]}      │
    │                              ├─→ Validate ownership
    │                              ├─→ Update inDeck flags
    │                              └─→ Return deck
    │

Make Selection + Card
    │                              │
    ├─→ POST /selections           │
    │   {drivers, team, cardId}    │
    │                              ├─→ Save RaceSelection
    │                              ├─→ Create CardUsage (pending)
    │                              ├─→ Calculate basePoints
    │                              └─→ Store basePoints
    │

Race Results Available
    │                              │
    ├─→ Admin assigns points       │
    │                              ├─→ For each selection:
    │                              │   - Get basePoints
    │                              │   - IF cardUsed:
    │                              │     * Calculate boost
    │                              │     * Update points
    │                              │     * Delete PlayerCard
    │                              └─→ Update leaderboard
    │

Display Results
    │                              │
    ├─→ GET /selections/race       │
    │                              ├─→ Fetch RaceSelection
    │                              ├─→ Include cardUsed info
    │                              └─→ Return: {
    │                                    basePoints,
    │                                    cardBoostPoints,
    │                                    totalPoints
    │                                  }
```

---

## INTEGRATION POINTS WITH EXISTING SYSTEM

```
EXISTING SYSTEM                NEW CARD SYSTEM                  INTEGRATION
─────────────────────────────────────────────────────────────────────────────

RaceSelection Model           Card fields                      Add 3 fields
ScoringService                CardEffectCalculator             New service
Selection API                 Card selection                   Extend request
Results Display               Card boost display               Show breakdown
Leaderboard                   Total points only                No change needed
UsedSelection                 CardUsage                        Separate model
Season Management             Credits initialization           New hook
```

---

## CRITICAL DECISION POINTS

1. **When to calculate card boosts?**
   - Option A: When race results are available (recommended)
   - Option B: When selection is made (not possible for conditional cards)

2. **Card consumption timing?**
   - When selection is made (card locked)
   - When results are calculated (card consumed)

3. **Mystery Card resolution?**
   - At selection time (user sees which card)
   - At calculation time (surprise effect)

4. **Error handling?**
   - What if target player/driver not found (Mirror/Switcheroo)?
   - What if race results incomplete?
   - What if card effect can't be calculated?

5. **Backward compatibility?**
   - Existing RaceSelections without cards (basePoints = points)
   - Migration of historical data

---

## TESTING CHECKLIST

- [ ] Card purchase with sufficient credits
- [ ] Card purchase with insufficient credits
- [ ] Deck building (8 cards max)
- [ ] Deck building with unowned cards (should fail)
- [ ] Card usage during selection
- [ ] Card usage validation (not in deck, already used)
- [ ] Each card type calculation (12 cards)
- [ ] Mystery Card random resolution
- [ ] Mirror card with valid/invalid target
- [ ] Switcheroo with valid/invalid driver
- [ ] Conditional cards (Top 5, Top 10, etc.)
- [ ] Card consumption after use
- [ ] Credits reset at season start
- [ ] Base points calculation (unchanged)
- [ ] Total points = base + boost
- [ ] Leaderboard includes card boosts
- [ ] Display shows breakdown correctly

---

## ESTIMATED COMPLEXITY

| Phase | Complexity | Dependencies |
|-------|-----------|--------------|
| Phase 1: Database | Medium | None |
| Phase 2: Season Init | Low | Phase 1 |
| Phase 3: Card APIs | Medium | Phase 1, 2 |
| Phase 4: Deck APIs | Low | Phase 1, 3 |
| Phase 5: Selection | Medium | Phase 1, 4 |
| Phase 6: Scoring | High | Phase 1, 5 |
| Phase 7: Special Cards | High | Phase 6 |
| Phase 8: Frontend | Medium | Phase 3-7 |
| Phase 9: Admin | Low | All phases |

**Total Estimated Effort:** High complexity feature requiring careful implementation

---

## RISK MITIGATION

1. **Data Integrity**: Use transactions for card purchase
2. **Race Conditions**: Lock cards when selection is made
3. **Calculation Errors**: Extensive testing of each card type
4. **Performance**: Index CardUsage and PlayerCard properly
5. **User Experience**: Clear UI for card effects and limitations


