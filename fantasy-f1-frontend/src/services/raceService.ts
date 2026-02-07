import { api } from './api';
import { AxiosResponse } from 'axios';

export interface RaceTiming {
  hasUpcomingRace: boolean;
  raceName: string;
  round: number;
  isSprintWeekend: boolean;
  qualifying: {
    startTime: string;
    timeUntil: number;
  };
  race: {
    startTime: string;
    timeUntil: number;
  };
  sprintQualifying?: {
    startTime: string;
    timeUntil: number;
  };
  sprint?: {
    startTime: string;
    timeUntil: number;
  };
  status?: string;
  endOfWeekend?: string;
  raceStart: string;
}

export const TEAM_COLORS: Record<string, string> = {
  'McLaren': '#F58020', // Orange
  'Ferrari': '#E8002D', // Red
  'Red Bull Racing': '#3671C6', // Blue
  'Mercedes': '#6CD3BF', // Teal
  'Aston Martin': '#358C75', // Green
  'Alpine': '#FF87BC', // Pink
  'Haas F1 Team': '#B6BABD', // Grey
  'RB': '#6692FF', // Blue
  'Williams': '#64C4FF', // Light Blue
  'Stake F1 Team Kick Sauber': '#00FF87' // Bright Green
};

export const DRIVER_TEAMS: Record<string, string> = {
  // McLaren
  'Oscar Piastri': 'McLaren',
  'Lando Norris': 'McLaren',
  // Ferrari
  'Charles Leclerc': 'Ferrari',
  'Lewis Hamilton': 'Ferrari',
  // Red Bull Racing
  'Max Verstappen': 'Red Bull Racing',
  'Yuki Tsunoda': 'Red Bull Racing',
  // Mercedes
  'George Russell': 'Mercedes',
  'Kimi Antonelli': 'Mercedes',
  // Aston Martin
  'Lance Stroll': 'Aston Martin',
  'Fernando Alonso': 'Aston Martin',
  // Alpine
  'Pierre Gasly': 'Alpine',
  'Franco Colapinto': 'Alpine',
  // Haas F1 Team
  'Esteban Ocon': 'Haas F1 Team',
  'Oliver Bearman': 'Haas F1 Team',
  // RB
  'Liam Lawson': 'RB',
  'Isack Hadjar': 'RB',
  // Williams
  'Alexander Albon': 'Williams',
  'Carlos Sainz': 'Williams',
  // Stake F1 Team Kick Sauber
  'Nico Hulkenberg': 'Stake F1 Team Kick Sauber',
  'Gabriel Bortoleto': 'Stake F1 Team Kick Sauber'
};

export const getNextRaceTiming = async (params?: { season?: number; leagueId?: string }): Promise<RaceTiming> => {
  const response: AxiosResponse<RaceTiming> = await api.get('/api/race/next-race', {
    params: params?.leagueId ? { leagueId: params.leagueId } : params?.season ? { season: params.season } : undefined
  });
  return response.data;
}; 