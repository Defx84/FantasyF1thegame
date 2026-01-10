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


