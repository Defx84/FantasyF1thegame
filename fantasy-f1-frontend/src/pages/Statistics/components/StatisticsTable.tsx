import React, { useEffect, useState } from 'react';
import { fetchUserStatistics } from '../../../services/statisticsService';

interface StatisticsTableProps {
  userId?: string;
  leagueId?: string;
  glassShade?: string;
}

interface RaceHistory {
  round: number;
  points: number;
  mainDriver?: string;
  reserveDriver?: string;
  team?: string;
  status?: string;
  isAdminAssigned?: boolean;
  isAutoAssigned?: boolean;
}

const StatisticsTable: React.FC<StatisticsTableProps> = ({ userId, leagueId, glassShade = 'bg-white/20' }) => {
  const [raceHistory, setRaceHistory] = useState<RaceHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRaceHistory = async () => {
      if (!userId || !leagueId) return;
      try {
        setLoading(true);
        const data = await fetchUserStatistics(userId, leagueId);
        setRaceHistory(data.raceHistory);
      } catch (err) {
        setError('Failed to load race history');
        console.error('Error loading race history:', err);
      } finally {
        setLoading(false);
      }
    };
    loadRaceHistory();
  }, [userId, leagueId]);

  if (loading) {
    return (
      <div className={`overflow-x-auto rounded-lg shadow ${glassShade} backdrop-blur-md border border-white/20`}>
        <table className="min-w-full">
          <thead>
            <tr className="bg-white/10">
              <th className="py-3 px-4 text-left">Round</th>
              <th className="py-3 px-4 text-left">Points</th>
              <th className="py-3 px-4 text-left">Main Driver</th>
              <th className="py-3 px-4 text-left">Reserve Driver</th>
              <th className="py-3 px-4 text-left">Team</th>
              <th className="py-3 px-4 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3].map((_, index) => (
              <tr key={index} className="border-t border-white/10">
                {[...Array(6)].map((__, i) => (
                  <td key={i} className="py-3 px-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
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

  return (
    <div className={`overflow-x-auto rounded-lg shadow ${glassShade} backdrop-blur-md border border-white/20`}>
      <table className="min-w-full">
        <thead>
          <tr className="bg-white/10">
            <th className="py-3 px-4 text-left text-white">Round</th>
            <th className="py-3 px-4 text-left text-white">Points</th>
            <th className="py-3 px-4 text-left text-white">Main Driver</th>
            <th className="py-3 px-4 text-left text-white">Reserve Driver</th>
            <th className="py-3 px-4 text-left text-white">Team</th>
            <th className="py-3 px-4 text-left text-white">Status</th>
          </tr>
        </thead>
        <tbody>
          {raceHistory.map((race, index) => (
            <tr
              key={index}
              className={
                `border-t border-white/10 ` +
                (index % 2 === 0
                  ? 'bg-gradient-to-r from-blue-900/40 via-blue-800/20 to-transparent'
                  : 'bg-transparent')
              }
            >
              <td className="py-3 px-4 text-white">{race.round}</td>
              <td className="py-3 px-4 text-white">{race.points}</td>
              <td className="py-3 px-4 text-white">{race.mainDriver || '-'}</td>
              <td className="py-3 px-4 text-white">{race.reserveDriver || '-'}</td>
              <td className="py-3 px-4 text-white">{race.team || '-'}</td>
              <td className="py-3 px-4 text-white">
                {race.isAdminAssigned ? 'admin-assigned' : race.isAutoAssigned ? 'auto-assigned' : (race.status || '-')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default StatisticsTable; 