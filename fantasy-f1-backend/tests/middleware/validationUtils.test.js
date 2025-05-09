const { validationResult } = require('express-validator');
const {
  validateObjectId,
  validateLeagueName,
  validateLeagueCode,
  validateSelectionInput,
  validateAdminSelection,
  validateDriverTeamCombination,
  handleValidationErrors,
  normalizedDrivers,
  normalizedTeams,
  validateDriverReuse,
  validateTeam
} = require('../../src/middleware/validationUtils');

// Mock express-validator
jest.mock('express-validator', () => ({
  body: jest.fn().mockReturnValue({
    trim: jest.fn().mockReturnThis(),
    isLength: jest.fn().mockReturnThis(),
    matches: jest.fn().mockReturnThis(),
    withMessage: jest.fn().mockReturnThis(),
    isInt: jest.fn().mockReturnThis(),
    custom: jest.fn().mockReturnThis(),
    optional: jest.fn().mockReturnThis(),
    isBoolean: jest.fn().mockReturnThis()
  }),
  param: jest.fn().mockReturnValue({
    custom: jest.fn().mockReturnThis()
  }),
  validationResult: jest.fn()
}));

describe('Validation Utils', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {
      body: {},
      params: {}
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('validateObjectId', () => {
    it('should accept valid ObjectId', async () => {
      const validId = '507f1f77bcf86cd799439011';
      mockReq.params.id = validId;
      const middleware = validateObjectId('id');
      await middleware(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should reject invalid ObjectId', async () => {
      const invalidId = 'invalid-id';
      mockReq.params.id = invalidId;
      const middleware = validateObjectId('id');
      await middleware(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should reject empty ObjectId', async () => {
      mockReq.params.id = '';
      const middleware = validateObjectId('id');
      await middleware(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should reject null ObjectId', async () => {
      mockReq.params.id = null;
      const middleware = validateObjectId('id');
      await middleware(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('validateLeagueName', () => {
    it('should accept valid league name', async () => {
      mockReq.body.leagueName = 'My Awesome League';
      const middleware = validateLeagueName[0];
      await middleware(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should reject league name with special characters', async () => {
      mockReq.body.leagueName = 'My League!@#';
      const middleware = validateLeagueName[0];
      await middleware(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should reject empty league name', async () => {
      mockReq.body.leagueName = '';
      const middleware = validateLeagueName[0];
      await middleware(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should reject league name that is too short', async () => {
      mockReq.body.leagueName = 'AB';
      const middleware = validateLeagueName[0];
      await middleware(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should reject league name that is too long', async () => {
      mockReq.body.leagueName = 'A'.repeat(51);
      const middleware = validateLeagueName[0];
      await middleware(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('validateLeagueCode', () => {
    it('should accept valid league code', async () => {
      mockReq.body.code = 'ABC123';
      const middleware = validateLeagueCode[0];
      await middleware(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should reject invalid league code format', async () => {
      mockReq.body.code = 'abc123';
      const middleware = validateLeagueCode[0];
      await middleware(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should reject league code with special characters', async () => {
      mockReq.body.code = 'ABC!23';
      const middleware = validateLeagueCode[0];
      await middleware(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should reject league code that is too short', async () => {
      mockReq.body.code = 'ABC12';
      const middleware = validateLeagueCode[0];
      await middleware(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should reject league code that is too long', async () => {
      mockReq.body.code = 'ABC1234';
      const middleware = validateLeagueCode[0];
      await middleware(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('validateSelectionInput', () => {
    it('should accept valid selection with case-insensitive driver names', async () => {
      mockReq.body = {
        mainDriver: 'max verstappen',
        reserveDriver: 'YUKI TSUNODA',
        team: 'Oracle Red Bull Racing',
        round: 1
      };
      const middleware = validateSelectionInput[0];
      await middleware(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should accept valid selection with case-insensitive team name', async () => {
      mockReq.body = {
        mainDriver: 'Max Verstappen',
        reserveDriver: 'Yuki Tsunoda',
        team: 'oracle red bull racing',
        round: 1
      };
      const middleware = validateSelectionInput[2];
      await middleware(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should reject invalid round number', async () => {
      mockReq.body = {
        mainDriver: 'Max Verstappen',
        reserveDriver: 'Yuki Tsunoda',
        team: 'Oracle Red Bull Racing',
        round: 25
      };
      const middleware = validateSelectionInput[3];
      await middleware(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should reject invalid driver name (typo)', async () => {
      mockReq.body = {
        mainDriver: 'Max Verstapen',
        reserveDriver: 'Yuki Tsunoda',
        team: 'Oracle Red Bull Racing',
        round: 1
      };
      const middleware = validateSelectionInput[0];
      await middleware(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should reject invalid team name (typo)', async () => {
      mockReq.body = {
        mainDriver: 'Max Verstappen',
        reserveDriver: 'Yuki Tsunoda',
        team: 'Red Bull Racing',
        round: 1
      };
      const middleware = validateSelectionInput[2];
      await middleware(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('validateAdminSelection', () => {
    it('should accept valid admin selection', async () => {
      mockReq.body = {
        mainDriver: 'Max Verstappen',
        reserveDriver: 'Yuki Tsunoda',
        team: 'Oracle Red Bull Racing',
        round: 1,
        applyRealScoring: true
      };
      const middleware = validateAdminSelection[0];
      await middleware(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should reject invalid boolean for applyRealScoring', async () => {
      mockReq.body = {
        mainDriver: 'Max Verstappen',
        reserveDriver: 'Yuki Tsunoda',
        team: 'Oracle Red Bull Racing',
        round: 1,
        applyRealScoring: 'not-a-boolean'
      };
      const middleware = validateAdminSelection[3];
      await middleware(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should accept missing applyRealScoring', async () => {
      mockReq.body = {
        mainDriver: 'Max Verstappen',
        reserveDriver: 'Yuki Tsunoda',
        team: 'Oracle Red Bull Racing',
        round: 1
      };
      const middleware = validateAdminSelection[3];
      await middleware(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('validateDriverTeamCombination', () => {
    it('should always pass validation since drivers and teams are independent', () => {
      mockReq.body = {
        mainDriver: 'Max Verstappen',
        reserveDriver: 'Lewis Hamilton',
        team: 'Scuderia Ferrari'
      };
      validateDriverTeamCombination(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('handleValidationErrors', () => {
    it('should call next if no errors', () => {
      validationResult.mockReturnValue({ isEmpty: () => true });
      handleValidationErrors(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should return 400 if there are errors', () => {
      validationResult.mockReturnValue({ 
        isEmpty: () => false,
        array: () => ['error1', 'error2']
      });
      handleValidationErrors(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ errors: ['error1', 'error2'] });
    });
  });

  describe('validateTeam', () => {
    it('should validate correct team name', () => {
      const result = validateTeam('Red Bull Racing');
      expect(result).toBe(true);
    });

    it('should validate team name case-insensitively', () => {
      const result = validateTeam('red bull racing');
      expect(result).toBe(true);
    });

    it('should reject invalid team name', () => {
      const result = validateTeam('Invalid Team');
      expect(result).toBe(false);
    });

    it('should validate all 2025 teams', () => {
      const teams = [
        'Red Bull Racing',
        'Mercedes',
        'Ferrari',
        'McLaren',
        'Aston Martin',
        'Alpine',
        'Williams',
        'RB',
        'Stake F1 Team Kick Sauber',
        'Haas F1 Team'
      ];
      teams.forEach(team => {
        expect(validateTeam(team)).toBe(true);
      });
    });
  });
});

describe('Driver Reuse Validation', () => {
  const mockReq = {
    body: {
      selections: []
    }
  };
  const mockRes = {};
  const mockNext = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockReq.body.selections = [];
  });

  test('should allow driver reuse after reset threshold', () => {
    const oldSelection = {
      raceId: 'race1',
      driver: 'max verstappen',
      team: 'red bull',
      timestamp: new Date('2025-01-01')
    };
    const newSelection = {
      raceId: 'race2',
      driver: 'max verstappen',
      team: 'red bull',
      timestamp: new Date('2025-04-01')
    };

    mockReq.body.selections = [oldSelection, newSelection];
    validateDriverReuse(mockReq, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });

  test('should prevent driver reuse before reset threshold', () => {
    const oldSelection = {
      raceId: 'race1',
      driver: 'max verstappen',
      team: 'red bull',
      timestamp: new Date('2025-01-01')
    };
    const newSelection = {
      raceId: 'race2',
      driver: 'max verstappen',
      team: 'red bull',
      timestamp: new Date('2025-02-15')
    };

    mockReq.body.selections = [oldSelection, newSelection];
    validateDriverReuse(mockReq, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
  });

  test('should allow different drivers within reset threshold', () => {
    const selection1 = {
      raceId: 'race1',
      driver: 'max verstappen',
      team: 'red bull',
      timestamp: new Date('2025-01-01')
    };
    const selection2 = {
      raceId: 'race2',
      driver: 'charles leclerc',
      team: 'ferrari',
      timestamp: new Date('2025-02-01')
    };

    mockReq.body.selections = [selection1, selection2];
    validateDriverReuse(mockReq, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });

  test('should handle case-insensitive driver names', () => {
    const selection1 = {
      raceId: 'race1',
      driver: 'MAX VERSTAPPEN',
      team: 'red bull',
      timestamp: new Date('2025-01-01')
    };
    const selection2 = {
      raceId: 'race2',
      driver: 'max verstappen',
      team: 'red bull',
      timestamp: new Date('2025-02-15')
    };

    mockReq.body.selections = [selection1, selection2];
    validateDriverReuse(mockReq, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
  });
}); 