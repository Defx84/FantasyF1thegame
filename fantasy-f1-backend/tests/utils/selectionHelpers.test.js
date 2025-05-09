const { subMinutes, addMinutes } = require('date-fns');
const {
  isRaceLocked,
  checkDriverReuse,
  checkTeamReuse,
  validateSelection
} = require('../../src/utils/selectionHelpers');

describe('Selection Helpers', () => {
  describe('isRaceLocked', () => {
    it('should return false if qualifying time is not provided', () => {
      expect(isRaceLocked(null)).toBe(false);
      expect(isRaceLocked(undefined)).toBe(false);
    });

    it('should return false if current time is before lock time', () => {
      const qualifyingTime = addMinutes(new Date(), 10); // 10 minutes in the future
      expect(isRaceLocked(qualifyingTime)).toBe(false);
    });

    it('should return true if current time is after lock time', () => {
      const qualifyingTime = subMinutes(new Date(), 6); // 6 minutes in the past
      expect(isRaceLocked(qualifyingTime)).toBe(true);
    });

    it('should return true if current time is exactly at lock time', () => {
      const qualifyingTime = addMinutes(new Date(), 5); // Exactly at lock time
      expect(isRaceLocked(qualifyingTime)).toBe(true);
    });
  });

  describe('checkDriverReuse', () => {
    it('should allow reuse if no past selections', () => {
      const result = checkDriverReuse([], 'Max Verstappen');
      expect(result.canReuse).toBe(true);
    });

    it('should allow reuse if all 20 drivers have been used', () => {
      const pastSelections = Array(20).fill().map((_, i) => ({
        mainDriver: `Driver ${i + 1}`,
        reserveDriver: `Driver ${i + 21}`
      }));
      const result = checkDriverReuse(pastSelections, 'Max Verstappen');
      expect(result.canReuse).toBe(true);
    });

    it('should prevent reuse if driver has been used before (case insensitive)', () => {
      const pastSelections = [{
        mainDriver: 'max verstappen',
        reserveDriver: 'YUKI TSUNODA'
      }];
      const result = checkDriverReuse(pastSelections, 'Max Verstappen');
      expect(result.canReuse).toBe(false);
      expect(result.reason).toContain('has already been used');
    });

    it('should allow new driver selection', () => {
      const pastSelections = [{
        mainDriver: 'Max Verstappen',
        reserveDriver: 'Yuki Tsunoda'
      }];
      const result = checkDriverReuse(pastSelections, 'Lewis Hamilton');
      expect(result.canReuse).toBe(true);
    });
  });

  describe('checkTeamReuse', () => {
    it('should allow team selection if no past selections', () => {
      const result = checkTeamReuse([], 'Red Bull Racing');
      expect(result).toBe(true);
    });

    it('should allow team selection if team not used in past 5 races', () => {
      const pastSelections = [
        { round: 1, team: 'red bull racing' },
        { round: 2, team: 'Ferrari' },
        { round: 3, team: 'Mercedes' },
        { round: 4, team: 'McLaren' },
        { round: 5, team: 'Aston Martin' }
      ];
      const result = checkTeamReuse(pastSelections, 'Red Bull Racing');
      expect(result).toBe(true);
    });

    it('should not allow team selection if team used in past 5 races', () => {
      const pastSelections = [
        { round: 1, team: 'Red Bull Racing' },
        { round: 2, team: 'Ferrari' },
        { round: 3, team: 'Mercedes' },
        { round: 4, team: 'McLaren' },
        { round: 5, team: 'Red Bull Racing' }
      ];
      const result = checkTeamReuse(pastSelections, 'Red Bull Racing');
      expect(result).toBe(false);
    });

    it('should allow reuse if all 10 teams have been used', () => {
      const pastSelections = Array(10).fill().map((_, i) => ({
        team: `Team ${i + 1}`
      }));
      const result = checkTeamReuse(pastSelections, 'Oracle Red Bull Racing');
      expect(result.canReuse).toBe(true);
    });

    it('should prevent reuse if team has been used before (case insensitive)', () => {
      const pastSelections = [{
        team: 'oracle red bull racing'
      }];
      const result = checkTeamReuse(pastSelections, 'Oracle Red Bull Racing');
      expect(result.canReuse).toBe(false);
      expect(result.reason).toContain('has already been used');
    });

    it('should allow new team selection', () => {
      const pastSelections = [{
        team: 'Oracle Red Bull Racing'
      }];
      const result = checkTeamReuse(pastSelections, 'Scuderia Ferrari');
      expect(result.canReuse).toBe(true);
    });
  });

  describe('validateSelection', () => {
    it('should validate a valid selection', () => {
      const selection = {
        mainDriver: 'Max Verstappen',
        reserveDriver: 'Yuki Tsunoda',
        team: 'Oracle Red Bull Racing'
      };
      const pastSelections = [];
      const qualifyingTime = addMinutes(new Date(), 10);

      const result = validateSelection(selection, pastSelections, qualifyingTime);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect race lock violation', () => {
      const selection = {
        mainDriver: 'Max Verstappen',
        reserveDriver: 'Yuki Tsunoda',
        team: 'Oracle Red Bull Racing'
      };
      const pastSelections = [];
      const qualifyingTime = subMinutes(new Date(), 6);

      const result = validateSelection(selection, pastSelections, qualifyingTime);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Race is locked. Selections cannot be made after qualifying starts.');
    });

    it('should detect driver reuse violation', () => {
      const selection = {
        mainDriver: 'Max Verstappen',
        reserveDriver: 'Yuki Tsunoda',
        team: 'Oracle Red Bull Racing'
      };
      const pastSelections = [{
        mainDriver: 'Max Verstappen',
        reserveDriver: 'Lewis Hamilton',
        team: 'Mercedes-AMG Petronas F1 Team'
      }];
      const qualifyingTime = addMinutes(new Date(), 10);

      const result = validateSelection(selection, pastSelections, qualifyingTime);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Driver Max Verstappen has already been used. You must use all 20 drivers before reusing.');
    });

    it('should detect team reuse violation', () => {
      const selection = {
        mainDriver: 'Max Verstappen',
        reserveDriver: 'Yuki Tsunoda',
        team: 'Oracle Red Bull Racing'
      };
      const pastSelections = [{
        mainDriver: 'Lewis Hamilton',
        reserveDriver: 'George Russell',
        team: 'Oracle Red Bull Racing'
      }];
      const qualifyingTime = addMinutes(new Date(), 10);

      const result = validateSelection(selection, pastSelections, qualifyingTime);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Team Red Bull has already been used. You must use all 10 teams before reusing.');
    });

    it('should detect multiple violations', () => {
      const selection = {
        mainDriver: 'Max Verstappen',
        reserveDriver: 'Yuki Tsunoda',
        team: 'Scuderia Ferrari'
      };
      const pastSelections = [{
        mainDriver: 'Max Verstappen',
        reserveDriver: 'Lewis Hamilton',
        team: 'Oracle Red Bull Racing'
      }];
      const qualifyingTime = subMinutes(new Date(), 6);

      const result = validateSelection(selection, pastSelections, qualifyingTime);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });
}); 