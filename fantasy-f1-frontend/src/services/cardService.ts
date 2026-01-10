import { api } from './api';

export interface Card {
  _id: string;
  name: string;
  type: 'driver' | 'team';
  tier: 'gold' | 'silver' | 'bronze';
  slotCost: number;
  effectType: string;
  effectValue: any;
  description: string;
  requiresTarget: 'player' | 'driver' | 'team' | null;
  isActive: boolean;
  inCollection?: boolean;
  selected?: boolean;
  used?: boolean;
}

export interface PlayerCardsResponse {
  success: boolean;
  driverCards: Card[];
  teamCards: Card[];
  season: number;
}

export interface DeckResponse {
  success: boolean;
  driverCards: Card[];
  teamCards: Card[];
  driverSlots: number;
  teamSlots: number;
  driverSlotsUsed: number;
  teamSlotsUsed: number;
  driverSlotsMax: number;
  teamSlotsMax: number;
  driverCardsCount: number;
  teamCardsCount: number;
  driverCardsMax: number;
  teamCardsMax: number;
  goldTeamCardsCount: number;
  goldTeamCardsMax: number;
  season: number;
}

export interface SelectDeckRequest {
  driverCardIds: string[];
  teamCardIds: string[];
}

/**
 * Get all cards available for a league
 */
export const getPlayerCards = async (leagueId: string): Promise<PlayerCardsResponse> => {
  try {
    const response = await api.get(`/api/league/${leagueId}/cards`);
    // Handle both { success: true, driverCards, teamCards } and { driverCards, teamCards } formats
    if (response.data.success) {
      return {
        success: true,
        driverCards: response.data.driverCards || [],
        teamCards: response.data.teamCards || [],
        season: response.data.season
      };
    }
    // If response doesn't have success, add it
    return {
      success: true,
      driverCards: response.data.driverCards || [],
      teamCards: response.data.teamCards || [],
      season: response.data.season || new Date().getFullYear()
    };
  } catch (error: any) {
    console.error('getPlayerCards error:', error);
    console.error('Error response:', error.response?.data);
    throw error;
  }
};

/**
 * Get player's current deck
 */
export const getPlayerDeck = async (leagueId: string): Promise<DeckResponse> => {
  try {
    const response = await api.get(`/api/league/${leagueId}/cards/deck`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Save/select deck
 */
export const selectDeck = async (leagueId: string, deck: SelectDeckRequest): Promise<void> => {
  try {
    await api.post(`/api/league/${leagueId}/cards/select`, deck);
  } catch (error) {
    throw error;
  }
};

/**
 * Activate cards for a race selection
 */
export interface ActivateCardsRequest {
  driverCardId?: string | null;
  teamCardId?: string | null;
  targetPlayer?: string | null;
  targetDriver?: string | null;
  targetTeam?: string | null;
}

export interface RaceCardSelection {
  _id: string;
  user: string;
  league: string;
  race: string;
  round: number;
  driverCard: Card | null;
  teamCard: Card | null;
  mysteryTransformedCard: Card | null;
  randomTransformedCard: Card | null;
  targetPlayer?: {
    _id: string;
    username: string;
  };
  targetDriver?: string | null;
  targetTeam?: string | null;
  selectedAt: string;
}

export interface ActivateCardsResponse {
  success: boolean;
  message: string;
  raceCardSelection: RaceCardSelection;
  transformations?: {
    mysteryCard: Card | null;
    randomCard: Card | null;
  };
}

export const activateCards = async (
  selectionId: string,
  cards: ActivateCardsRequest
): Promise<ActivateCardsResponse> => {
  try {
    const response = await api.post(`/api/selections/${selectionId}/cards`, cards);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get race card selections
 */
export interface GetRaceCardsResponse {
  success: boolean;
  raceCardSelection: RaceCardSelection | null;
}

export const getRaceCards = async (selectionId: string): Promise<GetRaceCardsResponse> => {
  try {
    const response = await api.get(`/api/selections/${selectionId}/cards`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get used card IDs for a season
 */
export interface UsedCardsResponse {
  success: boolean;
  usedCardIds: string[];
  season: number;
}

export const getUsedCards = async (leagueId: string): Promise<UsedCardsResponse> => {
  try {
    const response = await api.get(`/api/league/${leagueId}/cards/used`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

