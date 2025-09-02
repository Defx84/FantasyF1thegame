import { api } from './api';

export interface UserStatistics {
  totalPoints: number;
  averagePoints: number;
  bestRace?: {
    round: number;
    points: number;
    mainDriver?: string;
    reserveDriver?: string;
    team?: string;
    status?: string;
  } | null;
  successRate?: number;
  comebackCount?: number;
  raceHistory: Array<{
    round: number;
    points: number;
    mainDriver?: string;
    reserveDriver?: string;
    team?: string;
    status?: string;
  }>;
}

export interface DriverTeamStatistics {
  drivers: {
    [key: string]: {
      totalPoints: number;
      races: number;
      averagePoints: number;
    };
  };
  teams: {
    [key: string]: {
      totalPoints: number;
      races: number;
      averagePoints: number;
    };
  };
}

export const fetchUserStatistics = async (userId: string, leagueId?: string): Promise<UserStatistics> => {
  let url = `/api/statistics/user/${userId}`;
  if (leagueId) {
    url = `/api/statistics/league/${leagueId}/user/${userId}`;
  }
  
  const response = await api.get(url);
  
  if (response.status !== 200) {
    throw new Error('Failed to fetch user statistics');
  }
  
  return response.data;
};

export const fetchDriverTeamStatistics = async (): Promise<DriverTeamStatistics> => {
  const response = await api.get('/api/statistics/driver-team');
  
  if (response.status !== 200) {
    throw new Error('Failed to fetch driver and team statistics');
  }
  
  return response.data;
}; 