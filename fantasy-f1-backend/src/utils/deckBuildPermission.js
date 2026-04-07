const RaceCalendar = require('../models/RaceCalendar');

/**
 * Qualifying lock = 5 minutes before qualifying (or sprint qualifying on sprint weekends).
 */
function lockTimeForRace(race) {
  if (!race) return null;
  const qualifyingTime =
    race.isSprintWeekend && race.sprintQualifyingStart
      ? new Date(race.sprintQualifyingStart)
      : new Date(race.qualifyingStart);
  return new Date(qualifyingTime.getTime() - 5 * 60 * 1000);
}

/**
 * @param {import('mongoose').Document} league
 * @param {import('mongoose').Types.ObjectId} userId
 * @returns {Date}
 */
function getUserJoinedAtInLeague(league, userId) {
  const uid = userId.toString();
  const rows = league.memberJoinDates || [];
  const entry = rows.find((e) => e.user && e.user.toString() === uid);
  if (entry && entry.joinedAt) {
    return new Date(entry.joinedAt);
  }
  // Legacy leagues: no row — assume member since league creation (best effort)
  return league.createdAt ? new Date(league.createdAt) : new Date();
}

/**
 * Env-based extension (backward compatible): usernames may edit deck until next race lock.
 */
async function envDeckExtensionAllowed(username, season, currentDate) {
  const extensionUsers = (process.env.DECK_BUILD_EXTENSION_USERS || '')
    .split(',')
    .map((u) => u.trim().toLowerCase())
    .filter(Boolean);
  if (!extensionUsers.includes((username || '').toLowerCase())) {
    return { allowed: false, deadline: null };
  }
  const nextRace = await RaceCalendar.findOne({
    season,
    status: 'scheduled',
    $or: [{ qualifyingStart: { $gt: currentDate } }, { sprintQualifyingStart: { $gt: currentDate } }]
  }).sort({ qualifyingStart: 1 });
  if (!nextRace) {
    return { allowed: false, deadline: null };
  }
  const lt = lockTimeForRace(nextRace);
  return { allowed: currentDate < lt, deadline: lt };
}

/**
 * First scheduled race in season (by calendar date).
 */
async function getFirstScheduledRace(season) {
  return RaceCalendar.findOne({ season, status: 'scheduled' }).sort({ date: 1 });
}

/**
 * All scheduled races for season, sorted by date.
 */
async function getScheduledRaces(season) {
  return RaceCalendar.find({ season, status: 'scheduled' }).sort({ date: 1 }).lean();
}

/**
 * First selection deadline strictly after `joinedAt` (the "next race" window for a new member).
 */
function firstPersonalDeckDeadlineAfterJoin(sortedRaces, joinedAt) {
  const t = joinedAt.getTime();
  for (const race of sortedRaces) {
    const lt = lockTimeForRace(race);
    if (lt && lt.getTime() > t) {
      return lt;
    }
  }
  return null;
}

/**
 * @returns {Promise<{ allowedToBuild: boolean, locked: boolean, nextExtensionDeadline: string | null }>}
 */
async function resolveDeckBuildStatus(league, userId, username) {
  if (!league || league.season < 2026) {
    return {
      allowedToBuild: true,
      locked: false,
      nextExtensionDeadline: null
    };
  }

  const currentDate = new Date();
  const firstRace = await getFirstScheduledRace(league.season);

  if (!firstRace) {
    return {
      allowedToBuild: true,
      locked: false,
      nextExtensionDeadline: null
    };
  }

  const firstLock = lockTimeForRace(firstRace);

  // Before the first race lock of the season — everyone may build
  if (currentDate < firstLock) {
    return {
      allowedToBuild: true,
      locked: false,
      nextExtensionDeadline: null
    };
  }

  const joinedAt = getUserJoinedAtInLeague(league, userId);

  // Joined before first race lock: original "founding" behaviour — locked after first lock unless env extension
  if (joinedAt.getTime() < firstLock.getTime()) {
    const env = await envDeckExtensionAllowed(username, league.season, currentDate);
    return {
      allowedToBuild: env.allowed,
      locked: true,
      nextExtensionDeadline: env.deadline ? env.deadline.toISOString() : null
    };
  }

  // Joined on or after first race lock: allow until the first selection deadline after join
  const races = await getScheduledRaces(league.season);
  const personalDeadline = firstPersonalDeckDeadlineAfterJoin(races, joinedAt);

  if (personalDeadline && currentDate < personalDeadline) {
    return {
      allowedToBuild: true,
      locked: true,
      nextExtensionDeadline: personalDeadline.toISOString()
    };
  }

  // Missed window — still check env for ops / legacy accounts
  const env = await envDeckExtensionAllowed(username, league.season, currentDate);
  return {
    allowedToBuild: env.allowed,
    locked: true,
    nextExtensionDeadline: env.deadline ? env.deadline.toISOString() : null
  };
}

module.exports = {
  lockTimeForRace,
  getUserJoinedAtInLeague,
  resolveDeckBuildStatus,
  getFirstScheduledRace
};
