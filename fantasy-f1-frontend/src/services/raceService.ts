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
}

export const TEAM_COLORS: Record<string, string> = {
  'McLaren': '#F58020', // Orange
  'Ferrari': '#E8002D', // Red
  'Red Bull Racing': '#3671C6', // Blue
  'Mercedes': '#6CD3BF', // Teal
  'Aston Martin': '#358C75', // Green
  'Alpine': '#FF87BC', // Pink
  'Haas F1 Team': '#B6BABD', // Grey
  'Racing Bulls': '#6692FF', // Blue
  'Williams': '#64C4FF', // Light Blue
  'Kick Sauber': '#52E252' // Green
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
  // Racing Bulls
  'Liam Lawson': 'Racing Bulls',
  'Isack Hadjar': 'Racing Bulls',
  // Williams
  'Alexander Albon': 'Williams',
  'Carlos Sainz': 'Williams',
  // Kick Sauber
  'Nico Hulkenberg': 'Kick Sauber',
  'Gabriel Bortoleto': 'Kick Sauber'
};

export const getNextRaceTiming = async (): Promise<RaceTiming> => {
  const response: AxiosResponse<RaceTiming> = await api.get('/api/race/next-race');
  return response.data;
}; 