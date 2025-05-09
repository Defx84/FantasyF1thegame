import { API_BASE_URL } from '../config';

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
  let url = `${API_BASE_URL}/api/statistics/user/${userId}`;
  if (leagueId) {
    url = `${API_BASE_URL}/api/statistics/league/${leagueId}/user/${userId}`;
  }
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch user statistics');
  }
  
  return response.json();
};

export const fetchDriverTeamStatistics = async (): Promise<DriverTeamStatistics> => {
  const response = await fetch(`${API_BASE_URL}/api/statistics/driver-team`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch driver and team statistics');
  }
  
  return response.json();
}; 