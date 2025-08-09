export interface Player {
  id: string; // Add user ID for avatars
  username: string;
  selectionMade: boolean;
  selections: {
    mainDriver: string | null;
    reserveDriver: string | null;
    team: string | null;
  };
} 