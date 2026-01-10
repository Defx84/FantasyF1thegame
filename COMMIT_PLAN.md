# Commit Plan - Organized by Feature/Phase

## Phase 1: UI/UX Improvements - Welcome & Rules Pages
**Files:**
- `fantasy-f1-frontend/src/pages/Welcome.tsx` - How to play overlay, Instagram button, shine effects, background fixes
- `fantasy-f1-frontend/src/pages/Rules.tsx` - Power Cards section, formatting improvements
- `fantasy-f1-frontend/src/index.css` - Shine animations, mobile background optimizations

**Commit Message:**
```
feat(ui): Improve Welcome and Rules pages UX

- Add "How to play" overlay with game overview
- Move Instagram button below "How to play" button
- Add shine animation to "How to play" and "Sign in" buttons
- Fix Welcome page background for mobile devices
- Add Power Cards section to Rules page
- Improve Rules page formatting (list-outside for better readability)
- Fix text alignment to prevent overlap with navigation dots
```

---

## Phase 2: UI/UX Improvements - Dashboard & Navigation
**Files:**
- `fantasy-f1-frontend/src/pages/Dashboard.tsx` - Logo visibility, background images, button sizing, mobile detection
- `fantasy-f1-frontend/src/index.css` - Dashboard mobile background styles

**Commit Message:**
```
feat(ui): Enhance Dashboard page with responsive backgrounds

- Add mobile-specific background image (Dashboard_mobile.png)
- Implement responsive background switching (mobile/desktop)
- Remove duplicate logo overlay (use background logo)
- Reduce Profile and Logout button sizes
- Improve mobile background visibility and fit
- Add resize handler for dynamic background switching
```

---

## Phase 3: UI/UX Improvements - Page Backgrounds
**Files:**
- `fantasy-f1-frontend/src/pages/LeagueDetails.tsx` - Background image update
- `fantasy-f1-frontend/src/pages/NextRaceSelections.tsx` - Background image update
- `fantasy-f1-frontend/src/pages/RaceHistory.tsx` - Background image update
- `fantasy-f1-frontend/public/My_league_background.png` (new)
- `fantasy-f1-frontend/public/Selection_page.png` (new)
- `fantasy-f1-frontend/public/Race_history.png` (new)

**Commit Message:**
```
feat(ui): Update page backgrounds with new images

- Update League Details page background (My_league_background.png)
- Update Selection page background (Selection_page.png)
- Update Race History page background (Race_history.png)
```

---

## Phase 4: Feature Implementation - Authentication
**Files:**
- `fantasy-f1-frontend/src/pages/ForgotPassword.tsx` - Implement forgot password API call
- `fantasy-f1-frontend/src/pages/ResetPassword.tsx` - Fix reset password to match backend API

**Commit Message:**
```
feat(auth): Implement forgot password functionality

- Connect ForgotPassword page to backend API
- Fix ResetPassword to use correct API parameters (newPassword)
- Add proper error handling and user feedback
- Fix navigation links to use correct routes
- Add token validation on reset page
```

---

## Phase 5: Feature Implementation - Power Cards Tracking
**Files:**
- `fantasy-f1-backend/src/controllers/cardController.js` - Add getUsedCards endpoint
- `fantasy-f1-backend/src/routes/leagueRoutes.js` - Add used cards route
- `fantasy-f1-frontend/src/services/cardService.ts` - Add getUsedCards service
- `fantasy-f1-frontend/src/pages/NextRaceSelections.tsx` - Integrate used cards tracking

**Commit Message:**
```
feat(cards): Add used cards tracking API and frontend integration

- Add GET /api/league/:leagueId/cards/used endpoint
- Return used card IDs for current season
- Integrate used cards tracking in NextRaceSelections component
- Remove TODO comment and implement proper card usage tracking
```

---

## Phase 6: Bug Fixes - Data & Logic
**Files:**
- `fantasy-f1-backend/src/services/LeaderboardService.js` - Fix season filtering
- `fantasy-f1-backend/src/utils/initializeLeaderboard.js` - Fix season filtering
- `fantasy-f1-backend/src/controllers/cardController.js` - Fix deck locking logic
- `fantasy-f1-frontend/src/pages/DeckBuilder.tsx` - Fix deck locking to check first race
- `fantasy-f1-backend/src/controllers/leagueController.js` - Fix Opponents Briefing season filtering

**Commit Message:**
```
fix(data): Fix season filtering and deck locking logic

- Fix leaderboard to filter race results by season
- Fix deck locking to use first race deadline (5 min before qualifying)
- Align frontend and backend deck locking logic
- Fix Opponents Briefing to filter future races by season
- Ensure all season-specific queries use correct season filter
```

---

## Phase 7: UI/UX Improvements - League Details
**Files:**
- `fantasy-f1-frontend/src/pages/LeagueDetails.tsx` - My Deck tab positioning and styling

**Commit Message:**
```
feat(ui): Improve League Details page layout

- Move "My Deck" tab to beginning of action buttons row
- Change "My Deck" tab color to orange
- Improve visual hierarchy of action buttons
```

---

## Phase 8: Minor Fixes
**Files:**
- `fantasy-f1-frontend/src/pages/Dashboard.tsx` - Profile navigation handler

**Commit Message:**
```
fix(ui): Complete profile navigation handler

- Implement handleProfileClick to navigate to profile page
- Remove TODO comment
```

---

## Execution Order

1. **Phase 1** - Welcome & Rules (UI improvements, no breaking changes)
2. **Phase 2** - Dashboard (UI improvements, no breaking changes)
3. **Phase 3** - Page Backgrounds (UI improvements, no breaking changes)
4. **Phase 4** - Authentication (New feature, backward compatible)
5. **Phase 5** - Power Cards Tracking (New feature, backward compatible)
6. **Phase 6** - Bug Fixes (Critical fixes, should be tested)
7. **Phase 7** - League Details (UI improvements, no breaking changes)
8. **Phase 8** - Minor Fixes (Small cleanup)

---

## Notes

- Each phase is independent and can be committed separately
- Phases 1-3, 7-8 are safe UI changes
- Phase 4 adds new functionality but is backward compatible
- Phase 5 adds new API endpoint (ensure backend is deployed first)
- Phase 6 contains critical bug fixes - test thoroughly before deploying

