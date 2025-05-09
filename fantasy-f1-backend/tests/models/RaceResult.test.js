const RaceResult = require('../../src/models/RaceResult');
const mongoose = require('mongoose');

describe('RaceResult Model', () => {
  let raceResult;

  beforeEach(() => {
    raceResult = new RaceResult({
      raceId: 'test-race',
      round: 1,
      raceName: 'Test Grand Prix',
      date: new Date(),
      isSprintWeekend: false,
      results: [
        {
          position: 1,
          driver: 'Max Verstappen',
          team: 'Oracle Red Bull Racing',
          points: 25,
          didNotFinish: false,
          didNotStart: false
        },
        {
          position: 2,
          driver: 'Lewis Hamilton',
          team: 'Scuderia Ferrari',
          points: 18,
          didNotFinish: false,
          didNotStart: false
        }
      ],
      sprintResults: [
        {
          position: 1,
          driver: 'Max Verstappen',
          team: 'Oracle Red Bull Racing',
          points: 8,
          didNotFinish: false,
          didNotStart: false
        },
        {
          position: 2,
          driver: 'Lewis Hamilton',
          team: 'Scuderia Ferrari',
          points: 7,
          didNotFinish: false,
          didNotStart: false
        }
      ],
      teamResults: [
        {
          team: 'Oracle Red Bull Racing',
          points: 25,
          position: 1
        },
        {
          team: 'Scuderia Ferrari',
          points: 18,
          position: 2
        }
      ]
    });
  });

  describe('getDriverPoints', () => {
    it('should return correct points for main race', () => {
      expect(raceResult.getDriverPoints('Max Verstappen')).toBe(25);
      expect(raceResult.getDriverPoints('Lewis Hamilton')).toBe(18);
    });

    it('should return correct points for sprint race', () => {
      expect(raceResult.getDriverPoints('Max Verstappen', true)).toBe(8);
      expect(raceResult.getDriverPoints('Lewis Hamilton', true)).toBe(7);
    });

    it('should return 0 for DNS in main race', () => {
      raceResult.results[0].didNotStart = true;
      expect(raceResult.getDriverPoints('Max Verstappen')).toBe(0);
    });

    it('should return points for DNF if driver completed enough laps', () => {
      raceResult.results[0].didNotFinish = true;
      raceResult.results[0].points = 12; // Points awarded for completing enough laps
      expect(raceResult.getDriverPoints('Max Verstappen')).toBe(12);
    });

    it('should return 0 for DSQ but count as participation', () => {
      raceResult.results[0].disqualified = true;
      expect(raceResult.getDriverPoints('Max Verstappen')).toBe(0);
      // DSQ doesn't trigger reserve driver
      expect(raceResult.shouldActivateReserve('Max Verstappen')).toBe(false);
    });

    it('should return 0 for DSQ in sprint race but count as participation', () => {
      raceResult.sprintResults[0].disqualified = true;
      expect(raceResult.getDriverPoints('Max Verstappen', true)).toBe(0);
      // Sprint DSQ doesn't affect reserve driver activation
      expect(raceResult.shouldActivateReserve('Max Verstappen', true)).toBe(false);
    });

    it('should return 0 for non-existent driver', () => {
      expect(raceResult.getDriverPoints('Non Existent Driver')).toBe(0);
    });
  });

  describe('shouldActivateReserve', () => {
    it('should activate reserve for DNS in main race', () => {
      raceResult.results[0].didNotStart = true;
      expect(raceResult.shouldActivateReserve('Max Verstappen')).toBe(true);
    });

    it('should not activate reserve for DNS in sprint race', () => {
      raceResult.sprintResults[0].didNotStart = true;
      expect(raceResult.shouldActivateReserve('Max Verstappen', true)).toBe(false);
    });

    it('should not activate reserve for DNF as it counts as participation', () => {
      raceResult.results[0].didNotFinish = true;
      expect(raceResult.shouldActivateReserve('Max Verstappen')).toBe(false);
    });

    it('should not activate reserve for DSQ as it counts as participation', () => {
      raceResult.results[0].disqualified = true;
      expect(raceResult.shouldActivateReserve('Max Verstappen')).toBe(false);
    });

    it('should not activate reserve for non-existent driver', () => {
      expect(raceResult.shouldActivateReserve('Non Existent Driver')).toBe(false);
    });
  });

  describe('getTeamPoints', () => {
    it('should return correct points for regular race weekend', () => {
      expect(raceResult.getTeamPoints('Red Bull Racing')).toBe(25);
      expect(raceResult.getTeamPoints('Ferrari')).toBe(18);
    });

    it('should return combined points for sprint weekend', () => {
      raceResult.isSprintWeekend = true;
      expect(raceResult.getTeamPoints('Red Bull Racing')).toBe(33); // 25 + 8
      expect(raceResult.getTeamPoints('Ferrari')).toBe(25); // 18 + 7
    });

    it('should count DSQ as 0 points but participation in sprint', () => {
      raceResult.isSprintWeekend = true;
      raceResult.sprintResults[0].disqualified = true; // DSQ in sprint
      expect(raceResult.getTeamPoints('Red Bull Racing')).toBe(25); // Only main race points
      // The driver still counts as having participated
      expect(raceResult.shouldActivateReserve('Max Verstappen')).toBe(false);
    });

    it('should return 0 for non-existent team', () => {
      expect(raceResult.getTeamPoints('Non Existent Team')).toBe(0);
    });

    it('should handle case-insensitive team names', () => {
      expect(raceResult.getTeamPoints('red bull racing')).toBe(25);
      expect(raceResult.getTeamPoints('FERRARI')).toBe(18);
    });
  });

  describe('Independent Scoring', () => {
    it('should score driver and team independently', () => {
      // Select Max Verstappen (Red Bull) with Ferrari team
      const driverPoints = raceResult.getDriverPoints('Max Verstappen');
      const teamPoints = raceResult.getTeamPoints('Ferrari');
      
      expect(driverPoints).toBe(25); // Max's points
      expect(teamPoints).toBe(18); // Ferrari's points
    });

    it('should handle sprint weekend with mismatched selections', () => {
      raceResult.isSprintWeekend = true;
      
      // Select Lewis Hamilton (Ferrari) with Red Bull team
      const mainRacePoints = raceResult.getDriverPoints('Lewis Hamilton');
      const sprintPoints = raceResult.getDriverPoints('Lewis Hamilton', true);
      const teamPoints = raceResult.getTeamPoints('Red Bull Racing');
      
      expect(mainRacePoints).toBe(18); // Lewis's main race points
      expect(sprintPoints).toBe(7); // Lewis's sprint points
      expect(teamPoints).toBe(33); // Red Bull's combined points
    });
  });
}); 