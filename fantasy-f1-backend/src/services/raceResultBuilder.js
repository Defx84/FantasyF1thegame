const RaceCalendar = require('../models/RaceCalendar');
const RaceResult = require('../models/RaceResult');

class RaceResultBuilder {
  static async buildFromScrapedData(round, scrapedData) {
    // Get static race information
    const raceInfo = await RaceCalendar.findOne({ round });
    if (!raceInfo) {
      throw new Error(`Race info not found for round ${round}`);
    }

    // Build the complete race result
    const raceResult = new RaceResult({
      // Static information from calendar
      round: raceInfo.round,
      season: raceInfo.season,
      raceName: raceInfo.raceName,
      circuit: raceInfo.circuit,
      country: raceInfo.country,
      raceStart: raceInfo.raceStart,
      date: raceInfo.date,
      qualifyingStart: raceInfo.qualifyingStart,
      isSprintWeekend: raceInfo.isSprintWeekend,
      sprintStart: raceInfo.sprintStart,
      sprintQualifyingStart: raceInfo.sprintQualifyingStart,

      // Dynamic information from scraper
      results: this.enrichDriverResults(scrapedData.results),
      teamResults: this.enrichTeamResults(scrapedData.teamResults),
      sprintResults: scrapedData.sprintResults ? 
        this.enrichDriverResults(scrapedData.sprintResults) : null,
      sprintTeamResults: scrapedData.sprintTeamResults ? 
        this.enrichTeamResults(scrapedData.sprintTeamResults) : null,
      
      // Metadata
      lastUpdated: new Date()
    });

    return raceResult;
  }

  static enrichDriverResults(results) {
    if (!results) return [];

    return results.map(driver => ({
      driver: driver.driver,
      team: driver.team,
      position: this.normalizePosition(driver.position, driver.status),
      points: driver.points || 0,
      didNotFinish: driver.status === 'DNF',
      didNotStart: driver.status === 'DNS',
      disqualified: driver.status === 'DSQ',
      laps: driver.laps,
      time: driver.time
    }));
  }

  static enrichTeamResults(teams) {
    if (!teams) return [];

    // Sort teams by points descending
    const sortedTeams = [...teams].sort((a, b) => b.points - a.points);

    // Assign positions and ensure all required fields
    return sortedTeams.map((team, idx) => ({
      team: team.team,
      points: team.points || 0,
      position: idx + 1
    }));
  }

  static normalizePosition(position, status) {
    if (['DNF', 'DNS', 'DSQ'].includes(status)) {
      return null;
    }
    return position;
  }
}

module.exports = RaceResultBuilder; 