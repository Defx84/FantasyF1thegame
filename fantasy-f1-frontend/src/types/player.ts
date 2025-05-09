export interface Player {
  username: string;
  selectionMade: boolean;
  selections: {
    mainDriver: string | null;
    reserveDriver: string | null;
    team: string | null;
  };
} 