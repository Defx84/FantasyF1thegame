import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaTrophy, FaMedal, FaChevronDown, FaChevronUp, FaInfoCircle } from 'react-icons/fa';
import IconWrapper from '../utils/iconWrapper';
import { api } from '../services/api';

interface RaceResult {
  round: number;
  raceName: string;
  mainRacePoints: number;
  sprintPoints: number;
  totalPoints: number;
  breakdown?: {
    mainDriver: string;
    reserveDriver: string;
    team: string;
    mainDriverPoints: number;
    reserveDriverPoints: number;
    teamPoints: number;
    isSprintWeekend: boolean;
  };
}

interface DriverRaceResult extends RaceResult {
  mainDriver: string;
  reserveDriver: string;
}

interface TeamRaceResult extends RaceResult {
  team: string;
}

interface Standing {
  user: {
    _id: string;
    username: string;
  };
  totalPoints: number;
}

interface DriverStanding extends Standing {
  raceResults: DriverRaceResult[];
}

interface TeamStanding extends Standing {
  raceResults: TeamRaceResult[];
}

interface LeaderboardData {
  league: string;
  season: number;
  lastUpdated: Date;
  driverStandings: DriverStanding[];
  constructorStandings: TeamStanding[];
}

const FaInfoCircleIcon = FaInfoCircle as React.FC<{ className?: string }>;

const Standings: React.FC = () => {
  const { leagueId } = useParams<{ leagueId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'drivers' | 'teams'>('drivers');
  const [leaderboard, setLeaderboard] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchStandings = async () => {
      try {
        setLoading(true);
        const currentYear = 2025; // Hardcode to 2025 for now since that's the season we're using
        const response = await api.get(`/api/league/${leagueId}/standings/${currentYear}`);
        setLeaderboard(response.data);
      } catch (err) {
        console.error('Error fetching standings:', err);
        setError('Failed to load standings');
      } finally {
        setLoading(false);
      }
    };

    fetchStandings();
  }, [leagueId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
      </div>
    );
  }

  if (error || !leaderboard) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-2xl">{error || 'No standings data available'}</div>
      </div>
    );
  }

  const toggleRowExpansion = (userId: string) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(userId)) {
      newExpandedRows.delete(userId);
    } else {
      newExpandedRows.add(userId);
    }
    setExpandedRows(newExpandedRows);
  };

  const renderPointsBreakdown = (result: RaceResult) => {
    return (
      <div className="pl-4 py-2 bg-gray-800">
        <div className="grid grid-cols-2 gap-2 text-sm">
          {result.breakdown?.isSprintWeekend ? (
            <>
              <div className="text-gray-400">Main Race Points:</div>
              <div className="text-white">{result.breakdown.mainDriverPoints}</div>
              <div className="text-gray-400">Sprint Race Points:</div>
              <div className="text-white">{result.breakdown.reserveDriverPoints}</div>
              <div className="text-gray-400">Team Points (Main + Sprint):</div>
              <div className="text-white">{result.breakdown.teamPoints * 2}</div>
            </>
          ) : (
            <>
              <div className="text-gray-400">Main Race Points:</div>
              <div className="text-white">{result.breakdown?.mainDriverPoints}</div>
              <div className="text-gray-400">Team Points:</div>
              <div className="text-white">{result.breakdown?.teamPoints}</div>
            </>
          )}
        </div>
      </div>
    );
  };

  const renderRaceName = (result: RaceResult) => {
    return (
      <div className="flex items-center">
        <span>{result.raceName}</span>
        {result.breakdown?.isSprintWeekend && (
          <span className="ml-2 px-2 py-1 text-xs bg-yellow-600 text-white rounded">
            Sprint Weekend
          </span>
        )}
      </div>
    );
  };

  const renderStandingsSummary = (standing: DriverStanding | TeamStanding) => {
    const totalPoints = standing.totalPoints;
    const totalRaces = standing.raceResults.length;
    
    // Type guard to handle both DriverRaceResult and TeamRaceResult
    const isDriverResult = (result: DriverRaceResult | TeamRaceResult): result is DriverRaceResult => {
      return 'mainDriver' in result;
    };

    // Cast raceResults to an array of RaceResult to handle the union type
    const sprintWeekends = (standing.raceResults as RaceResult[]).reduce<number>(
      (count: number, result: RaceResult) => {
        return count + (result.breakdown?.isSprintWeekend ? 1 : 0);
      },
      0
    );

    return (
      <div className="mb-4 p-4 bg-gray-800 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Season Summary</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="text-gray-400">Total Races:</div>
          <div className="text-white">{totalRaces}</div>
          <div className="text-gray-400">Sprint Weekends:</div>
          <div className="text-white">{sprintWeekends}</div>
          <div className="text-gray-400">Total Points:</div>
          <div className="text-white">{totalPoints}</div>
        </div>
      </div>
    );
  };

  const renderStandingRow = (standing: DriverStanding | TeamStanding, index: number) => {
    const isExpanded = expandedRows.has(standing.user._id);

    // Sort race results by round in descending order (most recent first)
    const sortedResults = [...standing.raceResults].sort((a, b) => b.round - a.round);

    return (
      <div key={standing.user._id} className="backdrop-blur-sm bg-white/[0.02] rounded-lg mb-4 border border-white/5 overflow-hidden transition-all duration-200">
        <div 
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/[0.05] transition-colors"
          onClick={() => toggleRowExpansion(standing.user._id)}
        >
          <div className="flex items-center">
            <span className="text-2xl font-bold mr-4 text-white/90">{index + 1}</span>
            <div>
              <div className="text-lg font-semibold text-white/90">{standing.user.username}</div>
              <div className="text-sm text-white/60">Total Points: {standing.totalPoints}</div>
            </div>
          </div>
          <div className="flex items-center text-white/60">
            {isExpanded ? <IconWrapper icon={FaChevronUp} /> : <IconWrapper icon={FaChevronDown} />}
          </div>
        </div>
        
        {isExpanded && (
          <div className="border-t border-white/5">
            <div className="space-y-1 p-2">
              {sortedResults && sortedResults.length > 0 ? (
                sortedResults.map((result, idx) => (
                  <div 
                    key={idx} 
                    className="flex justify-between items-center p-2 rounded hover:bg-white/[0.05] transition-colors"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-white/60 text-sm">Round {result.round}</span>
                      <span className="text-white/90">{result.raceName}</span>
                      {result.breakdown?.isSprintWeekend && (
                        <span className="px-2 py-0.5 text-xs bg-yellow-600/20 text-yellow-400 rounded">
                          Sprint
                        </span>
                      )}
                    </div>
                    <div className="text-white/90 font-medium">
                      {typeof result.totalPoints === 'number' ? `${result.totalPoints} pts` : '-'}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-white/40 py-4">
                  No race results available
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-gray-800 pb-12">
      <div className="max-w-4xl mx-auto px-4 pt-12">
        <div className="backdrop-blur-md bg-black/40 rounded-xl p-6 mb-6 shadow-lg">
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2">Championship Standings</h1>
          <div className="text-lg text-white/80 mb-4">Season 2025</div>
          <div className="flex items-center gap-4 mb-6">
            <button
              className={`px-6 py-2 rounded-lg font-bold text-lg transition-all duration-200 ${activeTab === 'drivers' ? 'bg-white text-red-600' : 'bg-gray-700 text-white/80 hover:bg-gray-600'}`}
              onClick={() => setActiveTab('drivers')}
            >
              Drivers Championship
            </button>
            <button
              className={`px-6 py-2 rounded-lg font-bold text-lg transition-all duration-200 border-2 ${activeTab === 'teams' ? 'bg-red-600 text-white border-white' : 'bg-gray-700 text-white/80 hover:bg-gray-600 border-transparent'}`}
              onClick={() => setActiveTab('teams')}
            >
              Teams Championship
            </button>
            {/* Info icon with tooltip */}
            <div className="relative group ml-2">
              <FaInfoCircleIcon className="text-yellow-300 text-xl cursor-pointer" />
              <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-72 bg-black/90 text-white text-sm rounded-lg shadow-lg px-4 py-2 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity duration-200 z-50"
                style={{ whiteSpace: 'normal' }}
              >
                The leaderboards are updated 20 minutes after the scheduled end of the race and 12hrs later to allow for late changes.
              </div>
            </div>
          </div>
        </div>
        <div className="backdrop-blur-sm bg-white/[0.02] rounded-xl border border-white/5 p-6">
          <div className="space-y-2">
            {activeTab === 'drivers'
              ? leaderboard.driverStandings.map((standing, index) => renderStandingRow(standing, index))
              : leaderboard.constructorStandings.map((standing, index) => renderStandingRow(standing, index))
            }
          </div>
        </div>
        <div className="mt-4 text-white/40 text-sm text-right">
          Last updated: {new Date(leaderboard.lastUpdated).toLocaleString()}
        </div>
      </div>
    </div>
  );
};

export default Standings; 