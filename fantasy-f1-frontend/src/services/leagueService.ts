import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { api } from './api';

const API_URL = '/api/league';

export interface League {
  _id: string;
  name: string;
  code: string;
  owner: string;
  members: string[];
  season: number;
  seasonStatus: string;
  createdAt: string;
  updatedAt: string;
}

export interface RaceResult {
  round: number;
  raceName: string;
  mainRacePoints: number;
  sprintPoints: number;
  totalPoints: number;
}

export interface DriverRaceResult extends RaceResult {
  mainDriver: string;
  reserveDriver: string;
}

export interface TeamRaceResult extends RaceResult {
  team: string;
}

export interface Standing {
  user: {
    _id: string;
    username: string;
  };
  totalPoints: number;
}

export interface DriverStanding extends Standing {
  raceResults: DriverRaceResult[];
}

export interface TeamStanding extends Standing {
  raceResults: TeamRaceResult[];
}

export interface LeaderboardData {
  league: string;
  season: number;
  lastUpdated: Date;
  driverStandings: DriverStanding[];
  constructorStandings: TeamStanding[];
}

export interface LeagueSelection {
  mainDriver: string | null;
  reserveDriver: string | null;
  team: string | null;
}

export interface LeagueSelections {
  [username: string]: LeagueSelection;
}

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export const createLeague = async (leagueData: {
  name: string;
  description?: string;
  maxMembers?: number;
}) => {
  try {
    const response = await api.post(API_URL, leagueData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const joinLeague = async (code: string) => {
  try {
    const response = await api.post(`${API_URL}/join`, { code });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getLeague = async (leagueId: string) => {
  try {
    const response = await api.get(`${API_URL}/${leagueId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getLeagueByCode = async (code: string) => {
  try {
    const response = await api.get(`${API_URL}/code/${code}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getUserLeagues = async (): Promise<League[]> => {
  const response = await api.get(`${API_URL}/user/leagues`);
  return response.data;
};

export const getLeagueSelections = async (leagueId: string): Promise<LeagueSelections> => {
  try {
    const response = await api.get(`${API_URL}/${leagueId}/selections`, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getLeagueStandings = async (leagueId: string, season: number): Promise<LeaderboardData> => {
  try {
    const response = await api.get(`${API_URL}/${leagueId}/standings/${season}`);
    return response.data;
  } catch (error) {
    throw error;
  }
}; 

export const deleteLeague = async (leagueId: string): Promise<void> => {
  try {
    await api.delete(`${API_URL}/${leagueId}`, {
      headers: getAuthHeader()
    });
  } catch (error) {
    throw error;
  }
};

// Abandon a league (user leaves league and deletes their data)
export const abandonLeague = async (leagueId: string): Promise<void> => {
  try {
    await api.post(`${API_URL}/${leagueId}/abandon`, {}, {
      headers: getAuthHeader()
    });
  } catch (error) {
    throw error;
  }
}; 