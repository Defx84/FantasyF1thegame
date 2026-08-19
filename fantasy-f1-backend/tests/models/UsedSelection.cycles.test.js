const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const League = require('../../src/models/League');
const UsedSelection = require('../../src/models/UsedSelection');
const { F1_DRIVERS_2026 } = require('../../src/constants/f1DriverData2026');
const { F1_TEAMS_2026 } = require('../../src/constants/f1Data2026');
const {
  getCurrentCycleUsedLists,
  rebuildUsedSelectionCyclesFromPast,
  filterUsedListsForCurrentRoster
} = require('../../src/controllers/selectionController');
const { getF1Validation } = require('../../src/constants/f1DataLoader');

let mongoServer;
let league;
let userId;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await League.deleteMany({});
  await UsedSelection.deleteMany({});
  userId = new mongoose.Types.ObjectId();
  league = await League.create({
    name: 'Cycle Test League',
    code: 'CYCLE1',
    owner: userId,
    members: [userId],
    season: 2026
  });
});

describe('UsedSelection cycle reset', () => {
  it('starts a new empty driver cycle after all season drivers are used', async () => {
    const used = new UsedSelection({
      user: userId,
      league: league._id,
      driverCycles: [[]],
      teamCycles: [[]]
    });

    for (const driver of F1_DRIVERS_2026) {
      await used.addUsedDriver(driver.shortName);
    }

    expect(used.driverCycles.length).toBe(2);
    expect(used.driverCycles[0]).toHaveLength(F1_DRIVERS_2026.length);
    expect(used.driverCycles[1]).toEqual([]);

    const lists = getCurrentCycleUsedLists(used);
    expect(lists.usedDrivers).toEqual([]);
  });

  it('starts a new empty team cycle after all season teams are used', async () => {
    const used = new UsedSelection({
      user: userId,
      league: league._id,
      driverCycles: [[]],
      teamCycles: [[]]
    });

    for (const team of F1_TEAMS_2026) {
      await used.addUsedTeam(team.name);
    }

    expect(used.teamCycles.length).toBe(2);
    expect(used.teamCycles[0]).toHaveLength(F1_TEAMS_2026.length);
    expect(used.teamCycles[1]).toEqual([]);

    const lists = getCurrentCycleUsedLists(used);
    expect(lists.usedTeams).toEqual([]);
  });

  it('rebuild from past selections returns empty lists after a full pool', async () => {
    const { normalizeDriverName, normalizeTeamName } = getF1Validation(2026);
    const used = new UsedSelection({
      user: userId,
      league: league._id,
      driverCycles: [['stale-entry']],
      teamCycles: [['stale-team']]
    });

    // 11 races × 2 drivers = 22 (full 2026 pool); 11 teams = full team pool
    const pastSelections = [];
    for (let i = 0; i < F1_TEAMS_2026.length; i++) {
      const d1 = F1_DRIVERS_2026[i * 2];
      const d2 = F1_DRIVERS_2026[i * 2 + 1];
      pastSelections.push({
        round: i + 1,
        mainDriver: d1.shortName,
        reserveDriver: d2.shortName,
        team: F1_TEAMS_2026[i].name
      });
    }

    await rebuildUsedSelectionCyclesFromPast(
      used,
      pastSelections,
      normalizeDriverName,
      normalizeTeamName
    );

    const lists = getCurrentCycleUsedLists(used);
    expect(lists.usedDrivers).toEqual([]);
    expect(lists.usedTeams).toEqual([]);
    expect(used.driverCycles.length).toBeGreaterThanOrEqual(2);
    expect(used.teamCycles.length).toBeGreaterThanOrEqual(2);
  });

  it('rebuild keeps partial current cycle before pool is exhausted', async () => {
    const { normalizeDriverName, normalizeTeamName } = getF1Validation(2026);
    const used = new UsedSelection({
      user: userId,
      league: league._id,
      driverCycles: [[]],
      teamCycles: [[]]
    });

    const pastSelections = [
      {
        round: 1,
        mainDriver: F1_DRIVERS_2026[0].shortName,
        reserveDriver: F1_DRIVERS_2026[1].shortName,
        team: F1_TEAMS_2026[0].name
      },
      {
        round: 2,
        mainDriver: F1_DRIVERS_2026[2].shortName,
        reserveDriver: F1_DRIVERS_2026[3].shortName,
        team: F1_TEAMS_2026[1].name
      }
    ];

    await rebuildUsedSelectionCyclesFromPast(
      used,
      pastSelections,
      normalizeDriverName,
      normalizeTeamName
    );

    const lists = getCurrentCycleUsedLists(used);
    expect(lists.usedDrivers).toHaveLength(4);
    expect(lists.usedTeams).toHaveLength(2);
  });

  it('rebuild continues when a historical driver is no longer on the roster', async () => {
    const { normalizeDriverName, normalizeTeamName, isValidDriver } = getF1Validation(2026);
    const used = new UsedSelection({
      user: userId,
      league: league._id,
      driverCycles: [[]],
      teamCycles: [[]]
    });

    const pastSelections = [
      {
        round: 1,
        mainDriver: F1_DRIVERS_2026[0].shortName,
        reserveDriver: F1_DRIVERS_2026[1].shortName,
        team: F1_TEAMS_2026[0].name
      },
      {
        round: 2,
        mainDriver: 'I. Hadjar',
        reserveDriver: F1_DRIVERS_2026[2].shortName,
        team: F1_TEAMS_2026[1].name
      },
      {
        round: 3,
        mainDriver: F1_DRIVERS_2026[3].shortName,
        reserveDriver: F1_DRIVERS_2026[4].shortName,
        team: F1_TEAMS_2026[2].name
      }
    ];

    await rebuildUsedSelectionCyclesFromPast(
      used,
      pastSelections,
      normalizeDriverName,
      normalizeTeamName
    );

    expect(isValidDriver('I. Hadjar')).toBe(false);
    expect(used.driverCycles[0]).toHaveLength(6);
    expect(used.teamCycles[0]).toHaveLength(3);

    const lists = getCurrentCycleUsedLists(used);
    const clientLists = filterUsedListsForCurrentRoster(
      lists,
      isValidDriver,
      (team) => Boolean(team)
    );
    expect(clientLists.usedDrivers).toHaveLength(5);
    expect(clientLists.usedDrivers).not.toContain('I. Hadjar');
    expect(clientLists.usedDrivers).toContain(F1_DRIVERS_2026[4].shortName);
  });

  it('rebuild still resets after a removed driver filled a full-cycle slot', async () => {
    const { normalizeDriverName, normalizeTeamName, isValidDriver, isValidTeam } = getF1Validation(2026);
    const used = new UsedSelection({
      user: userId,
      league: league._id,
      driverCycles: [[]],
      teamCycles: [[]]
    });

    const driversExceptTsunoda = F1_DRIVERS_2026.filter((d) => d.shortName !== 'Y. Tsunoda');
    const oldRoster = [...driversExceptTsunoda, { shortName: 'I. Hadjar' }];
    expect(oldRoster).toHaveLength(F1_DRIVERS_2026.length);

    const pastSelections = [];
    for (let i = 0; i < F1_TEAMS_2026.length; i++) {
      const d1 = oldRoster[i * 2];
      const d2 = oldRoster[i * 2 + 1];
      pastSelections.push({
        round: i + 1,
        mainDriver: d1.shortName,
        reserveDriver: d2.shortName,
        team: F1_TEAMS_2026[i].name
      });
    }

    await rebuildUsedSelectionCyclesFromPast(
      used,
      pastSelections,
      normalizeDriverName,
      normalizeTeamName
    );

    expect(used.driverCycles.length).toBeGreaterThanOrEqual(2);
    expect(used.driverCycles[used.driverCycles.length - 1]).toEqual([]);
    expect(used.teamCycles[used.teamCycles.length - 1]).toEqual([]);

    const lists = filterUsedListsForCurrentRoster(
      getCurrentCycleUsedLists(used),
      isValidDriver,
      isValidTeam
    );
    expect(lists.usedDrivers).toEqual([]);
    expect(lists.usedTeams).toEqual([]);
  });
});
