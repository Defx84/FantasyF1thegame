const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');
const RaceSelection = require('../../src/models/RaceSelection');
const RaceResult = require('../../src/models/RaceResult');
const League = require('../../src/models/League');
const UsedSelection = require('../../src/models/UsedSelection');
const { normalizedDrivers, normalizedTeams } = require('../../src/utils/validation');

let mongoServer;
let league;
let regularUser;
let adminUser;
let regularUserToken;
let adminUserToken;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);

  // Create test users
  regularUser = new mongoose.Types.ObjectId();
  adminUser = new mongoose.Types.ObjectId();

  // Create test tokens
  regularUserToken = jwt.sign({ userId: regularUser }, 'test-secret');
  adminUserToken = jwt.sign({ userId: adminUser }, 'test-secret');

  // Create test league
  league = await League.create({
    name: 'Test League',
    code: 'TEST123',
    createdBy: adminUser,
    members: [
      { user: adminUser, isAdmin: true },
      { user: regularUser, isAdmin: false }
    ]
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await RaceSelection.deleteMany({});
  await RaceResult.deleteMany({});
  await League.deleteMany({});
  await UsedSelection.deleteMany({});
});

describe('Admin Controller Tests', () => {
  let race;
  let race2;

  beforeEach(async () => {
    const now = new Date();
    
    // Create first test race
    race = await RaceResult.create({
      raceId: `test-race-${now.getTime()}`,
      round: 1,
      raceName: 'Test Race',
      date: now,
      raceStart: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      qualifyingStart: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      status: 'upcoming',
      results: [
        {
          driver: 'Max Verstappen',
          team: 'Red Bull Racing',
          position: 1,
          points: 25
        },
        {
          driver: 'Lewis Hamilton',
          team: 'Mercedes',
          position: 2,
          points: 18
        }
      ]
    });

    // Create second test race
    race2 = await RaceResult.create({
      raceId: `test-race-2-${now.getTime()}`,
      round: 2,
      raceName: 'Test Race 2',
      date: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      raceStart: new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000),
      qualifyingStart: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000),
      status: 'upcoming',
      results: [
        {
          driver: 'Max Verstappen',
          team: 'Red Bull Racing',
          position: 1,
          points: 25
        },
        {
          driver: 'Lewis Hamilton',
          team: 'Mercedes',
          position: 2,
          points: 18
        }
      ]
    });

    // Create UsedSelection for the user
    await UsedSelection.create({
      user: regularUser,
      league: league._id,
      usedMainDrivers: [],
      usedReserveDrivers: [],
      usedTeams: []
    });
  });

  describe('assignMissedSelection', () => {
    it('should allow admin to assign a missed selection', async () => {
      const response = await request(app)
        .post('/api/admin/assign-missed')
        .set('Authorization', `Bearer ${adminUserToken}`)
        .send({
          leagueId: league._id,
          userId: regularUser,
          raceId: race._id,
          mainDriver: 'Max Verstappen',
          reserveDriver: 'Lewis Hamilton',
          team: 'Red Bull Racing'
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('Selection assigned successfully');

      const selection = await RaceSelection.findOne({
        user: regularUser,
        race: race._id,
        league: league._id
      });

      expect(selection).toBeTruthy();
      expect(selection.mainDriver.toLowerCase()).toBe('max verstappen');
      expect(selection.reserveDriver.toLowerCase()).toBe('lewis hamilton');
      expect(selection.team.toLowerCase()).toBe('red bull racing');
    });

    it('should not allow non-admin to assign selections', async () => {
      const response = await request(app)
        .post('/api/admin/assign-missed')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .send({
          leagueId: league._id,
          userId: regularUser,
          raceId: race._id,
          mainDriver: 'Max Verstappen',
          reserveDriver: 'Lewis Hamilton',
          team: 'Red Bull Racing'
        });

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('Not authorized');
    });
  });

  describe('assignLateJoinSelection', () => {
    it('should allow admin to assign a late join selection', async () => {
      const response = await request(app)
        .post('/api/admin/assign-late-join')
        .set('Authorization', `Bearer ${adminUserToken}`)
        .send({
          leagueId: league._id,
          userId: regularUser,
          raceId: race._id,
          mainDriver: 'Max Verstappen',
          reserveDriver: 'Lewis Hamilton',
          team: 'Red Bull Racing'
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('Selection assigned successfully');

      const selection = await RaceSelection.findOne({
        user: regularUser,
        race: race._id,
        league: league._id
      });

      expect(selection).toBeTruthy();
      expect(selection.mainDriver.toLowerCase()).toBe('max verstappen');
      expect(selection.reserveDriver.toLowerCase()).toBe('lewis hamilton');
      expect(selection.team.toLowerCase()).toBe('red bull racing');
    });

    it('should not allow non-admin to assign late join selections', async () => {
      const response = await request(app)
        .post('/api/admin/assign-late-join')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .send({
          leagueId: league._id,
          userId: regularUser,
          raceId: race._id,
          mainDriver: 'Max Verstappen',
          reserveDriver: 'Lewis Hamilton',
          team: 'Red Bull Racing'
        });

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('Not authorized');
    });
  });

  describe('getAdminAssignments', () => {
    it('should allow admin to view assignments', async () => {
      // Create a test selection
      await RaceSelection.create({
        league: league._id,
        user: regularUser,
        race: race._id,
        mainDriver: 'Max Verstappen',
        reserveDriver: 'Lewis Hamilton',
        team: 'Red Bull Racing',
        points: 43
      });

      const response = await request(app)
        .get('/api/admin/assignments')
        .set('Authorization', `Bearer ${adminUserToken}`)
        .query({ leagueId: league._id });

      expect(response.status).toBe(200);
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBe(1);
      expect(response.body[0].mainDriver.toLowerCase()).toBe('max verstappen');
    });

    it('should not allow non-admin to view assignments', async () => {
      const response = await request(app)
        .get('/api/admin/assignments')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .query({ leagueId: league._id });

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('Not authorized');
    });
  });

  describe('Race Status Transitions', () => {
    it('should automatically update race status based on timing', async () => {
      const now = new Date();
      const race = await RaceResult.create({
        raceId: `test-race-${now.getTime()}`,
        round: 1,
        raceName: 'Test Race',
        date: now,
        raceStart: new Date(now.getTime() + 24 * 60 * 60 * 1000), // 1 day in future
        qualifyingStart: new Date(now.getTime() - 24 * 60 * 60 * 1000), // 1 day in past
        status: 'upcoming'
      });

      // Verify initial status
      expect(race.status).toBe('upcoming');

      // Update qualifying start to be in the past
      race.qualifyingStart = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
      await race.save();

      // Verify status updated to 'qualifying'
      const updatedRace = await RaceResult.findById(race._id);
      expect(updatedRace.status).toBe('qualifying');

      // Update race start to be in the past
      updatedRace.raceStart = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago
      await updatedRace.save();

      // Verify status updated to 'in_progress'
      const finalRace = await RaceResult.findById(race._id);
      expect(finalRace.status).toBe('in_progress');
    });

    it('should not allow selections after race start', async () => {
      const now = new Date();
      const race = await RaceResult.create({
        raceId: `test-race-${now.getTime()}`,
        round: 1,
        raceName: 'Test Race',
        date: now,
        raceStart: new Date(now.getTime() - 60 * 60 * 1000), // 1 hour ago
        qualifyingStart: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        status: 'in_progress'
      });

      const response = await request(app)
        .post('/api/admin/assign-missed')
        .set('user', adminUser.toString())
        .send({
          leagueId: league._id,
          userId: regularUser._id,
          raceId: race._id,
          mainDriver: 'Max Verstappen',
          reserveDriver: 'None',
          team: 'Red Bull Racing'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Race has already started');
    });
  });
}); 