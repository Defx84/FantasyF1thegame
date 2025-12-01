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
    if (!data) return [];

    const players = championshipType === 'driver' 
      ? data.driverChampionship 
      : data.teamChampionship;

    // Create data points for each round
    return data.rounds.map((round, roundIndex) => {
      const dataPoint: any = { round };
      players.forEach((player, playerIndex) => {
        dataPoint[`player_${playerIndex}`] = player.cumulativePoints[roundIndex] || 0;
      });
      return dataPoint;
    });
  }, [data, championshipType]);

  // Custom label component for car marker at end of line
  const CarMarkerLabel = (props: any) => {
    const { x, y, payload, index, dataKey } = props;
    const players = championshipType === 'driver' 
      ? data?.driverChampionship 
      : data?.teamChampionship;
    
    if (!players || !data?.rounds) return null;
    
    // Only show on the last data point
    const isLastPoint = index === data.rounds.length - 1;
    if (!isLastPoint) return null;

    const playerIndex = parseInt(dataKey.replace('player_', ''), 10);
    const color = PLAYER_COLORS[playerIndex % PLAYER_COLORS.length];
    const carSize = 20;
    const carHeight = carSize * 0.6;
    
    return (
      <g transform={`translate(${x - carSize / 2}, ${y - carHeight / 2})`}>
        {/* Car body - main shape */}
        <path
          d="M2 21 L3 15 L5 12 L7 11 L10 11 L13 12 L15 15 L17 18 L18 21 L18 24 L17 25 L15 25 L14 27 L6 27 L5 25 L3 25 L2 24 Z"
          fill={color}
          stroke={color}
          strokeWidth="0.3"
        />
        {/* Front wing */}
        <path
          d="M3 15 L4 14 L5 12"
          stroke={color}
          strokeWidth="0.4"
          fill="none"
        />
        {/* Rear wing */}
        <path
          d="M15 15 L16 14 L17 18"
          stroke={color}
          strokeWidth="0.4"
          fill="none"
        />
        {/* Cockpit */}
        <ellipse
          cx="10"
          cy="15"
          rx="1.6"
          ry="1"
          fill="rgba(0, 0, 0, 0.3)"
        />
        {/* Wheels */}
        <circle cx="5" cy="25" r="0.8" fill="rgba(0, 0, 0, 0.5)" />
        <circle cx="15" cy="25" r="0.8" fill="rgba(0, 0, 0, 0.5)" />
      </g>
    );
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
          {players.map((player, index) => (
            <Line
              key={player.userId}
              type="monotone"
              dataKey={`player_${index}`}
              stroke={PLAYER_COLORS[index % PLAYER_COLORS.length]}
              strokeWidth={2}
              dot={{ r: 3 }}
              name={player.username}
            >
              <LabelList content={<CarMarkerLabel />} />
            </Line>
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ChampionshipProgressionChart;

