const RaceCalendar = require('../models/RaceCalendar');
const RaceResult = require('../models/RaceResult');

function getEndOfWeekend(raceDate) {
  const end = new Date(raceDate);
  const day = end.getUTCDay();
  end.setUTCDate(end.getUTCDate() + ((7 - day) % 7));
  end.setUTCHours(23, 59, 0, 0);
  return end;
}

/**
 * Which RaceCalendar row drives "next race" UI and lock timing for a season.
 * Must match getNextRaceTiming in raceController (current weekend slot, else next qualifying).
 * If `season` is omitted, queries across all seasons (same as empty seasonFilter there).
 */
async function resolveNextRaceCalendarDoc({ season, now = new Date() } = {}) {
  const nowMs = now.getTime();
  const seasonFilter =
    season != null && !Number.isNaN(Number(season)) ? { season: Number(season) } : {};

  const currentRace = await RaceCalendar.findOne({
    ...seasonFilter,
    qualifyingStart: { $lte: now }
  }).sort({ qualifyingStart: -1 });

  if (currentRace) {
    const endOfWeekend = getEndOfWeekend(currentRace.raceStart || currentRace.date);
    const raceEndTime = currentRace.raceStart
      ? new Date(currentRace.raceStart.getTime() + 3 * 60 * 60 * 1000)
      : null;

    let raceStatus = 'scheduled';
    const raceResult = await RaceResult.findOne({
      round: currentRace.round,
      season: currentRace.season
    });
    if (raceResult && raceResult.status) {
      raceStatus = raceResult.status;
    }

    const isRaceOver = raceStatus === 'completed' ||
      (raceEndTime && nowMs >= raceEndTime.getTime());

    if (!isRaceOver && nowMs < endOfWeekend.getTime()) {
      return currentRace;
    }
  }

  let nextRace = await RaceCalendar.findOne({
    ...seasonFilter,
    qualifyingStart: { $gt: now }
  }).sort({ qualifyingStart: 1 });

  if (!nextRace) {
    nextRace = await RaceCalendar.findOne({
      qualifyingStart: { $gt: now }
    }).sort({ qualifyingStart: 1 });
  }

  return nextRace;
}

module.exports = {
  resolveNextRaceCalendarDoc,
  getEndOfWeekend
};
