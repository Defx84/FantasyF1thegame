/**
 * Season-aware F1 Data Loader (Frontend)
 * Returns the appropriate season's driver and team data based on the season parameter
 */

import { F1_DRIVERS_2025, F1_TEAMS_2025 } from './f1Data2025';
import { F1_DRIVERS_2026, F1_TEAMS_2026 } from './f1Data2026';

interface Driver {
  name: string;
  team: string;
  shortName: string;
  alternateNames: string[];
}

interface Team {
  name: string;
  shortName: string;
  displayName: string;
  alternateNames: string[];
}

interface F1Data {
  drivers: Driver[];
  teams: Team[];
}

/**
 * Get F1 data for a specific season
 * @param season - The F1 season year (e.g., 2025, 2026)
 * @returns Object containing drivers and teams for that season
 */
export const getF1Data = (season: number): F1Data => {
  switch(season) {
    case 2025:
      return {
        drivers: F1_DRIVERS_2025,
        teams: F1_TEAMS_2025
      };
    case 2026:
      return {
        drivers: F1_DRIVERS_2026,
        teams: F1_TEAMS_2026
      };
    default:
      // Default to current year, or fallback to most recent available season
      const currentYear = new Date().getFullYear();
      if (currentYear >= 2026) {
        return {
          drivers: F1_DRIVERS_2026,
          teams: F1_TEAMS_2026
        };
      } else {
        return {
          drivers: F1_DRIVERS_2025,
          teams: F1_TEAMS_2025
        };
      }
  }
};

/**
 * Get F1 drivers for a specific season
 * @param season - The F1 season year
 * @returns Array of driver objects
 */
export const getF1Drivers = (season: number): Driver[] => {
  return getF1Data(season).drivers;
};

/**
 * Get F1 teams for a specific season
 * @param season - The F1 season year
 * @returns Array of team objects
 */
export const getF1Teams = (season: number): Team[] => {
  return getF1Data(season).teams;
};

/** Test seasons (e.g. 3026) use 2026 data */
function getDriverListForSeason(season: number): Driver[] {
  const data = getF1Data(season >= 2026 ? 2026 : season);
  return data.drivers;
}

function getTeamListForSeason(season: number): Team[] {
  const data = getF1Data(season >= 2026 ? 2026 : season);
  return data.teams;
}

/**
 * Normalize a driver name to shortName for a given season.
 * Used so used-drivers check matches backend (which stores short names).
 */
export function normalizeDriverForSeason(name: string | null | undefined, season: number): string {
  if (!name || name === 'None') return '';
  const key = name.toLowerCase().trim();
  const drivers = getDriverListForSeason(season);
  for (const d of drivers) {
    if (d.name.toLowerCase().trim() === key) return d.shortName;
    if (d.shortName.toLowerCase().trim() === key) return d.shortName;
    if (d.alternateNames?.some(alt => alt.toLowerCase().trim() === key)) return d.shortName;
    if (d.shortName.includes('.') && d.shortName.replace('.', '').toLowerCase().trim() === key) return d.shortName;
  }
  return key;
}

/**
 * Normalize a team name to the canonical name (team.name) for a given season.
 * Used so used-teams check matches backend (which stores canonical names).
 */
export function normalizeTeamForSeason(name: string | null | undefined, season: number): string {
  if (!name || name === 'None') return '';
  const key = name.toLowerCase().trim();
  const teams = getTeamListForSeason(season);
  for (const t of teams) {
    if (t.name.toLowerCase().trim() === key) return t.name;
    if (t.shortName.toLowerCase().trim() === key) return t.name;
    if (t.alternateNames?.some(alt => alt.toLowerCase().trim() === key)) return t.name;
  }
  return key;
}

