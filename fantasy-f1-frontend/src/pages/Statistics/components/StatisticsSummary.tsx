import React, { useEffect, useState } from 'react';
import { fetchUserStatistics } from '../../../services/statisticsService';
import ReactCardFlip from 'react-card-flip';
import { FaChevronDown, FaInfoCircle } from 'react-icons/fa';
import type { FC } from 'react';
import ChampionshipProgressionChart from './ChampionshipProgressionChart';

interface StatisticsSummaryProps {
  userId?: string;
  leagueId?: string;
  glassShade?: string;
}

interface UserStatistics {
  totalPoints: number;
  averagePoints: number;
  bestRace?: {
    round: number;
    points: number;
    mainDriver?: string;
    reserveDriver?: string;
    team?: string;
    status?: string;
    isAdminAssigned?: boolean;
    isAutoAssigned?: boolean;
  } | null;
  successRate?: number;
  comebackCount?: number;
  powerCardPointsDriver?: number;
  powerCardPointsTeam?: number;
  raceHistory: Array<{
    round: number;
    points: number;
    mainDriver?: string;
    reserveDriver?: string;
    team?: string;
    status?: string;
    isAdminAssigned?: boolean;
    isAutoAssigned?: boolean;
  }>;
  driverPoints?: number;
  teamPoints?: number;
  driverAverages?: number[];
  teamAverages?: number[];
}

const ChevronIcon = FaChevronDown as unknown as FC<{ size?: number }>;
const InfoIcon = FaInfoCircle as unknown as FC<{ size?: number }>;

const StatisticsSummary: React.FC<StatisticsSummaryProps> = ({ userId, leagueId, glassShade = 'bg-white/20' }) => {
  const [stats, setStats] = useState<UserStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBestRaceFlipped, setIsBestRaceFlipped] = useState(false);
  const [isPowerCardFlipped, setIsPowerCardFlipped] = useState(false);
  const [isTotalPointsFlipped, setIsTotalPointsFlipped] = useState(false);
  const [isAveragePointsFlipped, setIsAveragePointsFlipped] = useState(false);

  useEffect(() => {
    const loadStats = async () => {
      if (!userId || !leagueId) return;
      try {
        setLoading(true);
        const data = await fetchUserStatistics(userId, leagueId);
        setStats(data);
      } catch (err) {
        setError('Failed to load statistics');
        console.error('Error loading statistics:', err);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, [userId, leagueId]);

  if (loading) {
    return (
      <div className={`p-6 rounded-lg shadow ${glassShade} backdrop-blur-md border border-white/20`}>
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4 animate-pulse"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2 animate-pulse"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2 animate-pulse"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2 animate-pulse"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 rounded-lg text-red-600 ${glassShade} backdrop-blur-md border border-white/20`}>
        {error}
      </div>
    );
  }

  if (!stats) return null;

  // Calculate main driver and team points (now from backend fields)
  const mainDriverPoints = stats.driverPoints ?? 0;
  const teamPoints = stats.teamPoints ?? 0;

  return (
    <>
    <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
      {/* Total Points Card - Flippable */}
      <ReactCardFlip isFlipped={isTotalPointsFlipped} flipDirection="horizontal" flipSpeedBackToFront={0.6} flipSpeedFrontToBack={0.6}>
        {/* Front Side */}
        <div
          key="front-total"
          className="flex flex-col justify-center items-center p-6 h-40 rounded-lg shadow bg-red-200/30 border border-white/10 cursor-pointer relative"
          onClick={() => setIsTotalPointsFlipped(true)}
        >
          <h3 className="text-lg font-semibold mb-2 text-center text-white">Total Points</h3>
          <span className="text-3xl font-bold text-white text-center">{stats.totalPoints}</span>
          <span className="absolute bottom-2 inset-x-0 mx-auto w-fit text-red-400 opacity-70 animate-bounce">
            <ChevronIcon size={22} />
          </span>
        </div>
        {/* Back Side */}
        <div
          key="back-total"
          className="flex flex-col justify-center items-center p-6 h-40 rounded-lg shadow bg-red-200/30 border border-white/10 cursor-pointer"
          onClick={() => setIsTotalPointsFlipped(false)}
        >
          <h3 className="text-lg font-semibold mb-2 text-center text-white">Breakdown</h3>
          <span className="text-lg font-bold text-white text-center">Driver Points: {mainDriverPoints}</span>
          <span className="text-lg font-bold text-white text-center">Team Points: {teamPoints}</span>
        </div>
      </ReactCardFlip>
      {/* Average Points Card - Flippable */}
      <ReactCardFlip isFlipped={isAveragePointsFlipped} flipDirection="horizontal" flipSpeedBackToFront={0.6} flipSpeedFrontToBack={0.6}>
        {/* Front Side */}
        <div
          key="front-average"
          className="flex flex-col justify-center items-center p-6 h-40 rounded-lg shadow bg-red-200/30 border border-white/10 cursor-pointer relative"
          onClick={() => setIsAveragePointsFlipped(true)}
        >
          <h3 className="text-lg font-semibold mb-2 text-center text-white">Average Points</h3>
          <span className="text-3xl font-bold text-white text-center">{stats.averagePoints.toFixed(2)}</span>
          <span className="absolute bottom-2 inset-x-0 mx-auto w-fit text-red-400 opacity-70 animate-bounce">
            <ChevronIcon size={22} />
          </span>
        </div>
        {/* Back Side */}
        <div
          key="back-average"
          className="flex flex-col justify-center items-center p-6 h-40 rounded-lg shadow bg-red-200/30 border border-white/10 cursor-pointer"
          onClick={() => setIsAveragePointsFlipped(false)}
        >
          <h3 className="text-base font-semibold mb-1 text-center text-white">Progressive Averages</h3>
          <div className="flex flex-col items-center space-y-1 w-full">
            <span className="text-sm font-medium text-white text-center break-words">Driver Avg: <span className="font-bold">{stats.driverAverages && stats.driverAverages.length > 0 ? stats.driverAverages[stats.driverAverages.length - 1].toFixed(2) : '-'}</span></span>
            <span className="text-sm font-medium text-white text-center break-words">Team Avg: <span className="font-bold">{stats.teamAverages && stats.teamAverages.length > 0 ? stats.teamAverages[stats.teamAverages.length - 1].toFixed(2) : '-'}</span></span>
          </div>
        </div>
      </ReactCardFlip>
      {/* Success Rate Card (now in the middle) */}
      <div className={`flex flex-col justify-center items-center p-6 h-40 rounded-lg shadow bg-red-200/30 border border-white/10 relative`}>
        <h3 className="text-lg font-semibold mb-2 text-center text-white">Success Rate</h3>
        <span className="text-3xl font-bold text-white text-center">{stats.successRate !== undefined ? `${stats.successRate.toFixed(1)}%` : '-'}</span>
        {/* Info Icon with Tooltip */}
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex flex-col items-center group">
          <span className="cursor-pointer text-blue-300 opacity-80 group-hover:opacity-100">
            <InfoIcon size={18} />
          </span>
          <div className="z-10 hidden group-hover:block absolute bottom-6 left-1/2 -translate-x-1/2 w-56 bg-gray-900 text-white text-xs rounded-lg shadow-lg p-3 text-center pointer-events-none">
            Success Rate: The percentage of races where your score was above the league average for that round.
          </div>
        </div>
      </div>
      {/* Best Race Card - Flippable */}
      <ReactCardFlip isFlipped={isBestRaceFlipped} flipDirection="horizontal" flipSpeedBackToFront={0.6} flipSpeedFrontToBack={0.6}>
        {/* Front Side */}
        <div
          key="front-best"
          className="flex flex-col justify-center items-center p-6 h-40 rounded-lg shadow bg-red-200/30 border border-white/10 cursor-pointer relative"
          onClick={() => setIsBestRaceFlipped(true)}
        >
          <h3 className="text-lg font-semibold mb-2 text-center text-white">Best Race</h3>
          {stats.bestRace ? (
            <span className="text-2xl font-bold text-white text-center">Round {stats.bestRace.round}</span>
          ) : (
            <span className="text-2xl font-bold text-white text-center">-</span>
          )}
          <span className="absolute bottom-2 inset-x-0 mx-auto w-fit text-red-400 opacity-70 animate-bounce">
            <ChevronIcon size={22} />
          </span>
        </div>
        {/* Back Side */}
        <div
          key="back-best"
          className="flex flex-col justify-center items-center p-6 h-40 rounded-lg shadow bg-red-200/30 border border-white/10 cursor-pointer"
          onClick={() => setIsBestRaceFlipped(false)}
        >
          {stats.bestRace ? (
            <>
              <span className="text-lg font-bold text-white text-center">{stats.bestRace.points} pts</span>
              {stats.bestRace.mainDriver && <span className="text-sm text-white text-center">Main: {stats.bestRace.mainDriver}</span>}
              {stats.bestRace.reserveDriver && <span className="text-sm text-white text-center">Reserve: {stats.bestRace.reserveDriver}</span>}
              {stats.bestRace.team && <span className="text-sm text-white text-center">Team: {stats.bestRace.team}</span>}
              {(stats.bestRace.isAdminAssigned || stats.bestRace.isAutoAssigned || stats.bestRace.status) && (
                <span className="text-xs text-white text-center">
                  {stats.bestRace.isAdminAssigned ? 'admin-assigned' : stats.bestRace.isAutoAssigned ? 'auto-assigned' : stats.bestRace.status}
                </span>
              )}
            </>
          ) : (
            <span className="text-2xl font-bold text-white text-center">-</span>
          )}
        </div>
      </ReactCardFlip>
      {/* Power Card Points Card - Flippable (driver vs team breakdown) */}
      <ReactCardFlip isFlipped={isPowerCardFlipped} flipDirection="horizontal" flipSpeedBackToFront={0.6} flipSpeedFrontToBack={0.6}>
        {/* Front Side */}
        <div
          key="front-powercard"
          className="flex flex-col justify-center items-center p-6 h-40 rounded-lg shadow bg-red-200/30 border border-white/10 cursor-pointer relative"
          onClick={() => setIsPowerCardFlipped(true)}
        >
          <h3 className="text-lg font-semibold mb-2 text-center text-white">Power Cards detail</h3>
          <span className="absolute bottom-2 inset-x-0 mx-auto w-fit text-red-400 opacity-70 animate-bounce">
            <ChevronIcon size={22} />
          </span>
        </div>
        {/* Back Side */}
        <div
          key="back-powercard"
          className="flex flex-col justify-center items-center p-6 h-40 rounded-lg shadow bg-red-200/30 border border-white/10 cursor-pointer"
          onClick={() => setIsPowerCardFlipped(false)}
        >
          <div className="flex flex-col gap-2 text-center">
            <span className="text-lg font-bold text-white whitespace-nowrap">Drivers: {stats.powerCardPointsDriver ?? 0} pts</span>
            <span className="text-lg font-bold text-white whitespace-nowrap">Teams: {stats.powerCardPointsTeam ?? 0} pts</span>
          </div>
        </div>
      </ReactCardFlip>
    </div>
    
    {/* Championship Progression Chart */}
    {leagueId && (
      <ChampionshipProgressionChart leagueId={leagueId} glassShade={glassShade} />
    )}
    </>
  );
};

export default StatisticsSummary; 