/**
 * Season-aware F1 validation data
 * Returns driver and team lists based on the season
 */

import { getF1Data } from '../constants/f1DataLoader';

/**
 * Get list of driver names for a specific season
 * @param season - The F1 season year (e.g., 2025, 2026)
 * @returns Array of driver names
 */
export const getDrivers = (season: number): string[] => {
  const { drivers } = getF1Data(season);
  return drivers.map(driver => driver.name);
};

/**
 * Get list of team names for a specific season
 * @param season - The F1 season year (e.g., 2025, 2026)
 * @returns Array of team names
 */
export const getTeams = (season: number): string[] => {
  const { teams } = getF1Data(season);
  return teams.map(team => team.name);
};

/**
 * Get driver to team mapping for a specific season
 * @param season - The F1 season year (e.g., 2025, 2026)
 * @returns Object mapping driver names to team names
 */
export const getDriverTeams = (season: number): { [key: string]: string } => {
  const { drivers } = getF1Data(season);
  const mapping: { [key: string]: string } = {};
  drivers.forEach(driver => {
    mapping[driver.name] = driver.team;
  });
  return mapping;
};

// Default exports for backward compatibility (defaults to 2026)
// These are kept for components that haven't been updated yet
const defaultSeason = 2026;
export const drivers = getDrivers(defaultSeason);
export const teams = getTeams(defaultSeason);
export const driverTeams = getDriverTeams(defaultSeason); 