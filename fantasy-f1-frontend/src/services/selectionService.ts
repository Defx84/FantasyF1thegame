import { api } from './api';
import { AxiosResponse } from 'axios';

export interface UsedSelections {
  usedDrivers: string[]; // Unified driver list (shared for main and reserve)
  usedTeams: string[];
  // Legacy fields for backward compatibility during migration
  usedMainDrivers?: string[];
  usedReserveDrivers?: string[];
}


export interface Selection {
  _id?: string; // Optional selection ID (returned when selection exists)
  mainDriver: string | null;
  reserveDriver: string | null;
  team: string | null;
  leagueId?: string;
}

export interface AdminOverrideSelection {
  leagueId: string;
  userId: string;
  raceId: string;
  mainDriver: string;
  reserveDriver: string;
  team: string;
  assignPoints: boolean;
  notes?: string;
}

export interface RaceSelection {
  _id: string;
  userId: string;
  username: string;
  mainDriver: string | null;
  reserveDriver: string | null;
  team: string | null;
  points: number;
  status: string;
  isAdminAssigned: boolean;
  isAutoAssigned?: boolean;
  assignedBy?: string;
  assignedAt?: Date;
  notes?: string;
}

export interface RaceSelectionsResponse {
  race: {
    _id: string;
    round: number;
    date: string;
    qualifying: {
      startTime: string;
    };
  };
  selections: RaceSelection[];
  isAdmin: boolean;
}

export const getUsedSelections = async (leagueId: string, round: number, userId?: string): Promise<UsedSelections> => {
  try {
    const response = await api.get('/api/selections/used', {
      params: {
        leagueId,
        round,
        userId
      }
    });
    return response.data;
  } catch (error: any) {
    console.error('Error getting used selections:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to get used selections');
  }
};


export const saveSelections = async (selections: Selection, leagueId: string): Promise<void> => {
  try {
    const { mainDriver, reserveDriver, team } = selections;
    
    if (!mainDriver || !reserveDriver || !team) {
      throw new Error('All selections are required');
    }

    const response = await api.post('/api/selections/save', { 
      mainDriver,
      reserveDriver,
      team,
      leagueId 
    });
    return response.data;
  } catch (error: any) {
    console.error('Error saving selections:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || 'Failed to save selections');
  }
};

export const getCurrentSelections = async (leagueId: string, round: number): Promise<Selection> => {
  const response: AxiosResponse<Selection> = await api.get(`/api/selections/current?leagueId=${leagueId}&round=${round}`);
  return response.data;
};

export const adminOverrideSelection = async (overrideData: AdminOverrideSelection): Promise<void> => {
  try {
    const response = await api.post('/api/selections/admin/override', overrideData);
    return response.data;
  } catch (error: any) {
    console.error('Error overriding selection:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to override selection');
  }
};

export const getRaceSelections = async (leagueId: string, round: number): Promise<RaceSelectionsResponse> => {
  const response: AxiosResponse<RaceSelectionsResponse> = await api.get(`/api/selections/league/${leagueId}/race/${round}`);
  return response.data;
}; 