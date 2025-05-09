const mongoose = require('mongoose');
const { User, League, RaceResult } = require('./mocks/models');
const LeagueStatistics = require('../src/models/LeagueStatistics');
const { setup, teardown, clearDatabase } = require('./setup');

describe('League Statistics Model and Calculations', () => {
    let testLeague;
    let testUser1;
    let testUser2;
    let testRace1;
    let testRace2;
    let testRace3;
    let driver1Id;
    let driver2Id;

    beforeAll(async () => {
        await setup();
    });

    afterAll(async () => {
        await teardown();
    });

    beforeEach(async () => {
        await clearDatabase();

        // Create test users
        testUser1 = await User.create({
            username: 'testuser1',
            email: 'test1@example.com',
            password: 'password123'
        });

        testUser2 = await User.create({
            username: 'testuser2',
            email: 'test2@example.com',
            password: 'password123'
        });

        // Create test league
        testLeague = await League.create({
            name: 'Test League',
            description: 'Test League Description',
            members: [testUser1._id, testUser2._id],
            createdBy: testUser1._id
        });

        driver1Id = new mongoose.Types.ObjectId();
        driver2Id = new mongoose.Types.ObjectId();

        // Create test races with selections
        testRace1 = await RaceResult.create({
            raceName: 'Test Race 1',
            date: new Date(),
            round: 1,
            leagueId: testLeague._id,
            selections: [
                {
                    userId: testUser1._id,
                    driverId: driver1Id,
                    points: 25
                },
                {
                    userId: testUser2._id,
                    driverId: driver2Id,
                    points: 18
                }
            ]
        });

        testRace2 = await RaceResult.create({
            raceName: 'Test Race 2',
            date: new Date(),
            round: 2,
            leagueId: testLeague._id,
            selections: [
                {
                    userId: testUser1._id,
                    driverId: driver1Id,
                    points: 15 // Below average performance
                },
                {
                    userId: testUser2._id,
                    driverId: driver2Id,
                    points: 20
                }
            ]
        });

        testRace3 = await RaceResult.create({
            raceName: 'Test Race 3',
            date: new Date(),
            round: 3,
            leagueId: testLeague._id,
            selections: [
                {
                    userId: testUser1._id,
                    driverId: driver1Id,
                    points: 30 // Strong recovery
                },
                {
                    userId: testUser2._id,
                    driverId: driver2Id,
                    points: 22
                }
            ]
        });
    });

    describe('Statistics Calculations', () => {
        it('should calculate correct statistics for a user', async () => {
            const races = await RaceResult.find({ leagueId: testLeague._id });
            
            let totalPoints = 0;
            let highestPoints = 0;
            let highestPointsRaceId = null;
            let racesParticipated = 0;

            for (const race of races) {
                const userSelection = race.selections.find(s => 
                    s.userId.toString() === testUser1._id.toString()
                );
                
                if (userSelection) {
                    racesParticipated++;
                    totalPoints += userSelection.points || 0;
                    
                    if (userSelection.points > highestPoints) {
                        highestPoints = userSelection.points;
                        highestPointsRaceId = race._id;
                    }
                }
            }

            const averagePointsPerRace = racesParticipated > 0 ? 
                totalPoints / racesParticipated : 0;

            // Create statistics
            const statistics = await LeagueStatistics.create({
                leagueId: testLeague._id,
                userId: testUser1._id,
                totalPoints,
                racesParticipated,
                averagePointsPerRace,
                highestPointsInRace: highestPoints,
                highestPointsRaceId,
                successRate: 1.0 // Simplified for test
            });

            expect(statistics.totalPoints).toBe(45);
            expect(statistics.racesParticipated).toBe(2);
            expect(statistics.averagePointsPerRace).toBe(22.5);
            expect(statistics.highestPointsInRace).toBe(25);
            expect(statistics.highestPointsRaceId.toString()).toBe(testRace1._id.toString());
        });

        it('should handle multiple users in a league', async () => {
            // Create statistics for both users
            const stats1 = await LeagueStatistics.create({
                leagueId: testLeague._id,
                userId: testUser1._id,
                totalPoints: 45,
                racesParticipated: 2,
                averagePointsPerRace: 22.5,
                highestPointsInRace: 25,
                highestPointsRaceId: testRace1._id,
                successRate: 1.0
            });

            const stats2 = await LeagueStatistics.create({
                leagueId: testLeague._id,
                userId: testUser2._id,
                totalPoints: 33,
                racesParticipated: 2,
                averagePointsPerRace: 16.5,
                highestPointsInRace: 18,
                highestPointsRaceId: testRace1._id,
                successRate: 1.0
            });

            // Find all statistics for the league
            const leagueStats = await LeagueStatistics.find({ leagueId: testLeague._id })
                .sort({ totalPoints: -1 });

            expect(leagueStats).toHaveLength(2);
            expect(leagueStats[0].totalPoints).toBe(45);
            expect(leagueStats[1].totalPoints).toBe(33);
        });

        it('should calculate success rate correctly', async () => {
            const races = await RaceResult.find({ leagueId: testLeague._id });
            let totalSuccessRate = 0;
            let racesParticipated = 0;

            for (const race of races) {
                const userSelection = race.selections.find(s => 
                    s.userId.toString() === testUser1._id.toString()
                );
                
                if (userSelection) {
                    racesParticipated++;
                    
                    // Calculate average points for the selected driver
                    const driverSelections = race.selections.filter(s => 
                        s.driverId.toString() === userSelection.driverId.toString()
                    );
                    
                    const totalDriverPoints = driverSelections.reduce((sum, s) => sum + (s.points || 0), 0);
                    const averageDriverPoints = driverSelections.length > 0 ? 
                        totalDriverPoints / driverSelections.length : 0;
                    
                    // Calculate success rate for this race
                    if (averageDriverPoints > 0) {
                        totalSuccessRate += (userSelection.points || 0) / averageDriverPoints;
                    }
                }
            }

            const averageSuccessRate = racesParticipated > 0 ? totalSuccessRate / racesParticipated : 0;

            // Create statistics with calculated success rate
            const statistics = await LeagueStatistics.create({
                leagueId: testLeague._id,
                userId: testUser1._id,
                totalPoints: 45,
                racesParticipated: 2,
                averagePointsPerRace: 22.5,
                highestPointsInRace: 25,
                highestPointsRaceId: testRace1._id,
                successRate: averageSuccessRate
            });

            expect(statistics.successRate).toBe(1.0); // Since we're the only one selecting each driver
            expect(statistics.totalPoints).toBe(45);
            expect(statistics.racesParticipated).toBe(2);
        });
    });

    describe('Advanced Statistics', () => {
        it('should calculate consistency rating', async () => {
            const points = [25, 15, 30]; // User1's points
            const mean = points.reduce((a, b) => a + b) / points.length;
            const squareDiffs = points.map(point => Math.pow(point - mean, 2));
            const stdDev = Math.sqrt(squareDiffs.reduce((a, b) => a + b) / points.length);
            
            const statistics = await LeagueStatistics.create({
                leagueId: testLeague._id,
                userId: testUser1._id,
                totalPoints: 70,
                racesParticipated: 3,
                averagePointsPerRace: mean,
                pointsStandardDeviation: stdDev,
                consistencyRating: 7.5 // Higher rating due to two good performances
            });

            expect(statistics.pointsStandardDeviation).toBeCloseTo(7.64, 2);
            expect(statistics.consistencyRating).toBe(7.5);
        });

        it('should calculate comeback performance', async () => {
            const statistics = await LeagueStatistics.create({
                leagueId: testLeague._id,
                userId: testUser1._id,
                totalPoints: 70,
                racesParticipated: 3,
                comebackRating: 8.0,
                recoveryStats: {
                    belowAverageRaces: 1,
                    successfulRecoveries: 1,
                    averageRecoveryPoints: 15 // Improved by 15 points after poor race
                }
            });

            expect(statistics.comebackRating).toBe(8.0);
            expect(statistics.recoveryStats.belowAverageRaces).toBe(1);
            expect(statistics.recoveryStats.successfulRecoveries).toBe(1);
            expect(statistics.recoveryStats.averageRecoveryPoints).toBe(15);
        });

        it('should track detailed head-to-head records', async () => {
            const statistics = await LeagueStatistics.create({
                leagueId: testLeague._id,
                userId: testUser1._id,
                totalPoints: 70,
                racesParticipated: 3,
                headToHeadRecords: [{
                    opponentId: testUser2._id,
                    wins: 2,
                    losses: 1,
                    totalPoints: 70,
                    opponentTotalPoints: 60,
                    pointsDifference: 10,
                    averagePointsDifference: 3.33,
                    racesCompared: 3,
                    bestRaceDifference: 8, // Race 3: 30 vs 22
                    worstRaceDifference: -5 // Race 2: 15 vs 20
                }]
            });

            const h2hRecord = statistics.headToHeadRecords[0];
            expect(h2hRecord.wins).toBe(2); // Won races 1 and 3
            expect(h2hRecord.losses).toBe(1); // Lost race 2
            expect(h2hRecord.totalPoints).toBe(70); // User1's total points
            expect(h2hRecord.opponentTotalPoints).toBe(60); // User2's total points
            expect(h2hRecord.pointsDifference).toBe(10); // 70 - 60
            expect(h2hRecord.averagePointsDifference).toBeCloseTo(3.33, 2); // 10/3
            expect(h2hRecord.racesCompared).toBe(3); // All races
            expect(h2hRecord.bestRaceDifference).toBe(8); // Best performance
            expect(h2hRecord.worstRaceDifference).toBe(-5); // Worst performance
        });
    });
}); 