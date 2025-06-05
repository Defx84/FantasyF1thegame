import { RaceTiming } from '../services/raceService';

/**
 * Calculate the lock time for selections (5 minutes before qualifying/sprint qualifying)
 */
export const getLockTime = (race: any): Date | null => {
  if (!race) return null;

  // Use sprintQualifying.startTime for sprint weekends, else qualifying.startTime
  let baseTimeStr = race.isSprintWeekend && race.sprintQualifying?.startTime
    ? race.sprintQualifying.startTime
    : race.qualifying?.startTime;

  if (!baseTimeStr) {
    console.log('[Race Utils] No qualifying time available for race:', race);
    return null;
  }

  const baseTime = new Date(baseTimeStr);
  const lockTime = new Date(baseTime.getTime() - 5 * 60 * 1000);
  
  console.log('[Race Utils] Lock time calculation:', {
    raceName: race.raceName,
    baseTime: baseTime.toISOString(),
    lockTime: lockTime.toISOString(),
    currentTime: new Date().toISOString()
  });
  
  return lockTime;
};

/**
 * Check if selections are currently locked
 */
export const isSelectionsLocked = (race: RaceTiming): boolean => {
  if (!race) {
    console.log('[Race Utils] No race data provided for lock check');
    return true;
  }

  const lockTime = getLockTime(race);
  if (!lockTime) {
    console.log('[Race Utils] Could not determine lock time for race:', race);
    return true;
  }

  const now = new Date();
  const isLocked = now >= lockTime;
  
  console.log('[Race Utils] Lock status check:', {
    raceName: race.raceName,
    lockTime: lockTime.toISOString(),
    currentTime: now.toISOString(),
    isLocked
  });
  
  return isLocked;
};

/**
 * Calculate time remaining until lock time in milliseconds
 */
export const getTimeUntilLock = (race: RaceTiming): number => {
  if (!race) return 0;
  const lockTime = getLockTime(race);
  if (!lockTime) return 0;
  
  const now = new Date();
  return Math.max(0, lockTime.getTime() - now.getTime());
};

/**
 * Format milliseconds into a human-readable countdown string
 */
export const formatTimeLeft = (ms: number): string => {
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((ms % (1000 * 60)) / 1000);
  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}; 