import React, { useEffect, useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';
import { fetchChampionshipProgression, ChampionshipProgression } from '../../../services/statisticsService';

interface ChampionshipProgressionChartProps {
  leagueId?: string;
  glassShade?: string;
}

// Color palette for player lines
const PLAYER_COLORS = [
  '#EF4444', // Red
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Amber
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#F97316', // Orange
  '#6366F1', // Indigo
  '#14B8A6', // Teal
  '#F43F5E', // Rose
  '#A855F7', // Violet
  '#22C55E', // Emerald
  '#EAB308', // Yellow
];

const ChampionshipProgressionChart: React.FC<ChampionshipProgressionChartProps> = ({ 
  leagueId, 
  glassShade = 'bg-white/20' 
}) => {
  const [data, setData] = useState<ChampionshipProgression | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [championshipType, setChampionshipType] = useState<'driver' | 'team'>('driver');

  useEffect(() => {
    const loadData = async () => {
      if (!leagueId) return;
      try {
        setLoading(true);
        setError(null);
        const progressionData = await fetchChampionshipProgression(leagueId);
        setData(progressionData);
      } catch (err) {
        setError('Failed to load championship progression');
        console.error('Error loading championship progression:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [leagueId]);

  // Transform data for recharts format
  const chartData = useMemo(() => {
    if (!data || !data.rounds || data.rounds.length === 0) return [];

    const players = championshipType === 'driver' 
      ? data.driverChampionship 
      : data.teamChampionship;

    if (!players || players.length === 0) return [];

    // Create data points for each round
    return data.rounds.map((round, roundIndex) => {
      const dataPoint: any = { round };
      players.forEach((player, playerIndex) => {
        if (player && player.cumulativePoints && Array.isArray(player.cumulativePoints)) {
          dataPoint[`player_${playerIndex}`] = player.cumulativePoints[roundIndex] || 0;
        } else {
          dataPoint[`player_${playerIndex}`] = 0;
        }
      });
      return dataPoint;
    });
  }, [data, championshipType]);

  // Create car marker label function with proper closure - improved F1 car silhouette
  const createCarMarkerLabel = (playerIndex: number, totalRounds: number) => {
    return (props: any) => {
      try {
        const { x, y, index } = props;
        
        if (x === undefined || y === undefined || index === undefined) {
          return null;
        }
        
        // Only show on the last data point
        if (index !== totalRounds - 1) {
          return null;
        }
        
        const color = PLAYER_COLORS[playerIndex % PLAYER_COLORS.length];
        const carWidth = 40;
        const carHeight = 18;
        
        return (
          <g transform={`translate(${x - carWidth / 2}, ${y - carHeight / 2})`}>
            {/* Main car body - F1 silhouette shape */}
            <path
              d="M5 14 L7 7 L12 5 L16 5 L20 5 L24 7 L28 9 L32 11 L34 14 L34 16 L32 17 L30 17 L28 18 L12 18 L10 17 L8 17 L6 16 L5 14 Z"
              fill={color}
              stroke="rgba(0, 0, 0, 0.4)"
              strokeWidth="0.8"
            />
            {/* Front wing - prominent multi-element */}
            <path
              d="M7 7 L9 4 L12 5"
              stroke={color}
              strokeWidth="1.2"
              fill="none"
            />
            <path
              d="M7 7 L8 5.5 L9 4"
              stroke={color}
              strokeWidth="1"
              fill="none"
            />
            {/* Rear wing - prominent multi-element */}
            <path
              d="M24 7 L26 5 L28 9"
              stroke={color}
              strokeWidth="1.2"
              fill="none"
            />
            <path
              d="M26 5 L27 6.5 L28 9"
              stroke={color}
              strokeWidth="1"
              fill="none"
            />
            {/* Cockpit/air intake - more visible */}
            <ellipse
              cx="18"
              cy="9"
              rx="4"
              ry="2.5"
              fill="rgba(0, 0, 0, 0.5)"
            />
            {/* Side pod detail */}
            <path
              d="M14 11 L22 11 L22 13 L14 13 Z"
              fill="rgba(0, 0, 0, 0.3)"
            />
            {/* Front wheel - larger with white outline like reference */}
            <circle 
              cx="12" 
              cy="17" 
              r="3" 
              fill="rgba(0, 0, 0, 0.7)"
              stroke="rgba(255, 255, 255, 0.5)"
              strokeWidth="0.8"
            />
            <circle 
              cx="12" 
              cy="17" 
              r="2" 
              fill="rgba(0, 0, 0, 0.9)"
            />
            {/* Rear wheel - larger with white outline like reference */}
            <circle 
              cx="28" 
              cy="17" 
              r="3" 
              fill="rgba(0, 0, 0, 0.7)"
              stroke="rgba(255, 255, 255, 0.5)"
              strokeWidth="0.8"
            />
            <circle 
              cx="28" 
              cy="17" 
              r="2" 
              fill="rgba(0, 0, 0, 0.9)"
            />
            {/* Nose detail - pointed F1 nose */}
            <path
              d="M5 14 L6 11 L7 7"
              stroke={color}
              strokeWidth="0.8"
              fill="none"
            />
            {/* Engine cover detail */}
            <path
              d="M20 5 L22 7 L24 7"
              stroke="rgba(0, 0, 0, 0.3)"
              strokeWidth="0.6"
              fill="none"
            />
          </g>
        );
      } catch (error) {
        console.error('Error rendering car marker:', error);
        return null;
      }
    };
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className={`${glassShade} backdrop-blur-md border border-white/20 rounded-lg p-3 shadow-lg`}>
          <p className="text-white font-semibold mb-2">Round {label}</p>
          {payload.map((entry: any, index: number) => {
            const players = championshipType === 'driver' 
              ? data?.driverChampionship 
              : data?.teamChampionship;
            const playerIndex = parseInt(entry.dataKey.replace('player_', ''), 10);
            const player = players?.[playerIndex];
            if (!player) return null;
            return (
              <p key={index} style={{ color: entry.color }} className="text-sm">
                {player.username}: {entry.value} pts
              </p>
            );
          })}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className={`mt-8 p-6 rounded-lg shadow ${glassShade} backdrop-blur-md border border-white/20`}>
        <div className="h-64 flex items-center justify-center">
          <div className="animate-pulse text-white">Loading championship progression...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`mt-8 p-4 rounded-lg text-red-600 ${glassShade} backdrop-blur-md border border-white/20`}>
        {error}
      </div>
    );
  }

  if (!data || !data.rounds || data.rounds.length === 0) {
    return (
      <div className={`mt-8 p-4 rounded-lg text-white ${glassShade} backdrop-blur-md border border-white/20`}>
        No championship data available yet.
      </div>
    );
  }

  const players = championshipType === 'driver' 
    ? data.driverChampionship 
    : data.teamChampionship;

  if (players.length === 0) {
    return (
      <div className={`mt-8 p-4 rounded-lg text-white ${glassShade} backdrop-blur-md border border-white/20`}>
        No players found in this championship.
      </div>
    );
  }

  return (
    <div className={`mt-8 p-6 rounded-lg shadow ${glassShade} backdrop-blur-md border border-white/20`}>
      {/* Toggle and Title */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-4 sm:mb-0">
          Championship Progression
        </h2>
        <div className="inline-flex rounded-full bg-white/10 p-1 border border-white/20">
          <button
            className={`px-4 py-2 rounded-full font-semibold focus:outline-none transition-colors duration-200 text-sm ${
              championshipType === 'driver'
                ? 'bg-red-600 text-white shadow border border-red-700'
                : 'bg-transparent text-red-600 hover:bg-red-100/20 border border-transparent'
            }`}
            onClick={() => setChampionshipType('driver')}
          >
            Driver
          </button>
          <button
            className={`px-4 py-2 rounded-full font-semibold focus:outline-none transition-colors duration-200 text-sm ${
              championshipType === 'team'
                ? 'bg-red-600 text-white shadow border border-red-700'
                : 'bg-transparent text-red-600 hover:bg-red-100/20 border border-transparent'
            }`}
            onClick={() => setChampionshipType('team')}
          >
            Team
          </button>
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
            <XAxis 
              dataKey="round" 
              stroke="rgba(255, 255, 255, 0.7)"
              tick={{ fill: 'rgba(255, 255, 255, 0.7)' }}
            />
            <YAxis 
              stroke="rgba(255, 255, 255, 0.7)"
              tick={{ fill: 'rgba(255, 255, 255, 0.7)' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ paddingTop: '20px', color: 'rgba(255, 255, 255, 0.7)' }}
              iconType="line"
            />
            {players.map((player, index) => {
              try {
                return (
                  <Line
                    key={player.userId || `player-${index}`}
                    type="monotone"
                    dataKey={`player_${index}`}
                    stroke={PLAYER_COLORS[index % PLAYER_COLORS.length]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    name={player.username || `Player ${index + 1}`}
                  >
                    <LabelList content={createCarMarkerLabel(index, data?.rounds?.length || 0)} />
                  </Line>
                );
              } catch (error) {
                console.error('Error rendering line for player:', player, error);
                return null;
              }
            })}
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-64 flex items-center justify-center text-white">
          No chart data available
        </div>
      )}
    </div>
  );
};

export default ChampionshipProgressionChart;

