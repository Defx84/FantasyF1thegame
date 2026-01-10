import { Card } from '../services/cardService';

export interface Player {
  id: string; // Add user ID for avatars
  username: string;
  selectionMade: boolean;
  selections: {
    mainDriver: string | null;
    reserveDriver: string | null;
    team: string | null;
  };
  cards?: {
    driverCard: Card | null;
    teamCard: Card | null;
    mysteryTransformedCard?: Card | null;
    randomTransformedCard?: Card | null;
  };
  selectionId?: string; // ID of the race selection for fetching cards
} 