# Card API Testing Guide

## Prerequisites
1. Backend server must be running: `npm run dev` (in fantasy-f1-backend directory)
2. MongoDB must be connected
3. Cards must be seeded: `node scripts/seedCards.js`

## API Endpoints to Test

### 1. Get All Cards (No Auth Required)
```bash
GET http://localhost:5000/api/cards
```
**Expected Response:**
- Status: 200
- Body: `{ success: true, cards: [...] }`
- Should return 21 cards (12 driver + 9 team)

### 2. Get Cards Filtered by Type
```bash
GET http://localhost:5000/api/cards?type=driver
GET http://localhost:5000/api/cards?type=team
```
**Expected Response:**
- Status: 200
- Driver: 12 cards
- Team: 9 cards

### 3. Get Player's Card Collection (Auth Required)
```bash
GET http://localhost:5000/api/league/:leagueId/cards
Headers: Authorization: Bearer <JWT_TOKEN>
```
**Expected Response:**
- Status: 200
- Body: `{ success: true, driverCards: [...], teamCards: [...], season: 2026 }`

### 4. Get Player's Deck (Auth Required)
```bash
GET http://localhost:5000/api/league/:leagueId/cards/deck
Headers: Authorization: Bearer <JWT_TOKEN>
```
**Expected Response:**
- Status: 200
- Body: `{ success: true, driverCards: [...], teamCards: [...], driverSlotsUsed: X, teamSlotsUsed: Y, ... }`

### 5. Select Deck (Auth Required)
```bash
POST http://localhost:5000/api/league/:leagueId/cards/select
Headers: Authorization: Bearer <JWT_TOKEN>
Body: {
  "driverCardIds": ["card_id_1", "card_id_2", ...],
  "teamCardIds": ["card_id_1", "card_id_2", ...]
}
```
**Validation Rules:**
- Max 8 driver cards
- Max 12 driver slots
- Max 6 team cards
- Max 10 team slots
- Max 1 gold team card
- No duplicates
- Season must not have started

**Expected Response:**
- Status: 200
- Body: `{ success: true, message: "Deck selected successfully", ... }`

### 6. Activate Cards for Race (Auth Required)
```bash
POST http://localhost:5000/api/selections/:selectionId/cards
Headers: Authorization: Bearer <JWT_TOKEN>
Body: {
  "driverCardId": "card_id",
  "teamCardId": "card_id",
  "targetPlayer": "user_id",  // For Mirror card
  "targetDriver": "Driver Name",  // For Switcheroo card
  "targetTeam": "Team Name"  // For Espionage card
}
```
**Validation Rules:**
- Cards must be in player's deck
- Cards must not be already used this season
- Not a sprint weekend
- After qualifying, before race start
- Season must be 2026+

**Expected Response:**
- Status: 200
- Body: `{ success: true, message: "Cards activated successfully", ... }`

### 7. Get Race Cards (Auth Required)
```bash
GET http://localhost:5000/api/selections/:selectionId/cards
Headers: Authorization: Bearer <JWT_TOKEN>
```
**Expected Response:**
- Status: 200
- Body: `{ success: true, raceCardSelection: {...} }`

## Testing with cURL

```bash
# 1. Get all cards
curl http://localhost:5000/api/cards

# 2. Get driver cards only
curl http://localhost:5000/api/cards?type=driver

# 3. Get player cards (requires auth)
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:5000/api/league/LEAGUE_ID/cards
```

## Testing with Postman/Insomnia

1. Import the endpoints above
2. Set up authentication (Bearer token)
3. Test each endpoint with valid/invalid data
4. Verify validation rules work correctly

## Common Test Cases

### Deck Selection Validation
- ✅ Valid: 2 Gold (6) + 2 Silver (4) + 2 Bronze (2) = 12 driver slots
- ✅ Valid: 1 Gold (4) + 3 Silver (6) = 10 team slots, 1 gold team card
- ❌ Invalid: 9 driver cards (max 8)
- ❌ Invalid: 13 driver slots (max 12)
- ❌ Invalid: 2 gold team cards (max 1)
- ❌ Invalid: Duplicate cards

### Card Activation Validation
- ❌ Invalid: Card not in deck
- ❌ Invalid: Card already used
- ❌ Invalid: Sprint weekend
- ❌ Invalid: Before qualifying
- ❌ Invalid: After race start
- ❌ Invalid: 2025 season (cards only for 2026+)


