import React, { useEffect, useState } from 'react';
import { fetchDriverTeamStatistics, DriverTeamStatistics } from '../../../services/statisticsService';

interface StatisticsChartProps {
  userId?: string;
  leagueId?: string;
}

const StatisticsChart: React.FC<StatisticsChartProps> = ({ userId, leagueId }) => {
  const [stats, setStats] = useState<DriverTeamStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStatistics = async () => {
      try {
        setLoading(true);
        const data = await fetchDriverTeamStatistics();
        setStats(data);
      } catch (err) {
        setError('Failed to load statistics');
        console.error('Error loading statistics:', err);
      } finally {
        setLoading(false);
      }
    };

    loadStatistics();
  }, []);

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Performance Over Time</h3>
        <div className="h-64 bg-gray-100 rounded flex items-center justify-center">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-32 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-48"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-lg text-red-600">
        {error}
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  // Sort drivers by total points
  const topDrivers = Object.entries(stats.drivers)
    .sort(([, a], [, b]) => b.totalPoints - a.totalPoints)
    .slice(0, 5);

  // Sort teams by total points
  const topTeams = Object.entries(stats.teams)
    .sort(([, a], [, b]) => b.totalPoints - a.totalPoints)
    .slice(0, 5);

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Top Performers</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Drivers */}
        <div>
          <h4 className="text-md font-medium mb-3">Top Drivers</h4>
          <div className="space-y-2">
            {topDrivers.map(([driver, stats]) => (
              <div key={driver} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="font-medium">{driver}</span>
                <span className="text-blue-600">{stats.totalPoints} pts</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Teams */}
        <div>
          <h4 className="text-md font-medium mb-3">Top Teams</h4>
          <div className="space-y-2">
            {topTeams.map(([team, stats]) => (
              <div key={team} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="font-medium">{team}</span>
                <span className="text-green-600">{stats.totalPoints} pts</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatisticsChart; 