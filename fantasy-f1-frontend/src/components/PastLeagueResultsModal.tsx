import React, { useEffect, useState } from 'react';
import { FaTimes, FaTrophy } from 'react-icons/fa';
import { getLeagueFinalStandings, FinalStandings } from '../services/leagueService';
import { useAuth } from '../context/AuthContext';
import IconWrapper from '../utils/iconWrapper';

interface PastLeagueResultsModalProps {
  leagueId: string;
  leagueName: string;
  season: number;
  isOpen: boolean;
  onClose: () => void;
}

const PastLeagueResultsModal: React.FC<PastLeagueResultsModalProps> = ({
  leagueId,
  leagueName,
  season,
  isOpen,
  onClose
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [standings, setStandings] = useState<FinalStandings | null>(null);

  useEffect(() => {
    if (isOpen && leagueId) {
      fetchStandings();
    }
  }, [isOpen, leagueId]);

  const fetchStandings = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getLeagueFinalStandings(leagueId);
      setStandings(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load final standings');
      console.error('Error fetching final standings:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderStandingsTable = (
    title: string,
    standings: Array<{ position: number; user: string; username: string; totalPoints: number }>,
    topThree?: { champion?: any; second?: any; third?: any }
  ) => {
    const isCurrentUser = (userId: string) => user?.id === userId;

    return (
      <div className="mb-8">
        <h3 className="text-xl font-bold text-white mb-4">{title}</h3>
        
        {/* Top 3 Podium */}
        {topThree && (topThree.champion || topThree.second || topThree.third) && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            {topThree.second && (
              <div className={`text-center p-4 rounded-lg ${
                isCurrentUser(topThree.second.user) 
                  ? 'bg-yellow-500/30 border-2 border-yellow-400' 
                  : 'bg-white/10 border border-white/20'
              }`}>
                <div className="text-3xl mb-2">🥈</div>
                <div className="font-semibold text-white">{topThree.second.username}</div>
                <div className="text-sm text-white/70">{topThree.second.totalPoints} pts</div>
                {isCurrentUser(topThree.second.user) && (
                  <div className="text-xs text-yellow-400 mt-1">You</div>
                )}
              </div>
            )}
            {topThree.champion && (
              <div className={`text-center p-4 rounded-lg ${
                isCurrentUser(topThree.champion.user) 
                  ? 'bg-yellow-500/30 border-2 border-yellow-400' 
                  : 'bg-white/10 border border-white/20'
              }`}>
                <div className="text-3xl mb-2">🥇</div>
                <div className="font-semibold text-white">{topThree.champion.username}</div>
                <div className="text-sm text-white/70">{topThree.champion.totalPoints} pts</div>
                {isCurrentUser(topThree.champion.user) && (
                  <div className="text-xs text-yellow-400 mt-1">You</div>
                )}
              </div>
            )}
            {topThree.third && (
              <div className={`text-center p-4 rounded-lg ${
                isCurrentUser(topThree.third.user) 
                  ? 'bg-yellow-500/30 border-2 border-yellow-400' 
                  : 'bg-white/10 border border-white/20'
              }`}>
                <div className="text-3xl mb-2">🥉</div>
                <div className="font-semibold text-white">{topThree.third.username}</div>
                <div className="text-sm text-white/70">{topThree.third.totalPoints} pts</div>
                {isCurrentUser(topThree.third.user) && (
                  <div className="text-xs text-yellow-400 mt-1">You</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Full Standings Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-white/10 border-b border-white/20">
                <th className="text-left p-3 text-white/90 font-semibold">Position</th>
                <th className="text-left p-3 text-white/90 font-semibold">Username</th>
                <th className="text-right p-3 text-white/90 font-semibold">Points</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((standing) => {
                const isUser = isCurrentUser(standing.user);
                return (
                  <tr
                    key={standing.user}
                    className={`border-b border-white/10 ${
                      isUser
                        ? 'bg-yellow-500/20 hover:bg-yellow-500/30'
                        : 'hover:bg-white/5'
                    } transition-colors`}
                  >
                    <td className="p-3 text-white/90">
                      <div className="flex items-center gap-2">
                        {standing.position <= 3 && (
                          <IconWrapper 
                            icon={FaTrophy}
                            className={
                              standing.position === 1 ? 'text-yellow-400' :
                              standing.position === 2 ? 'text-gray-300' :
                              'text-orange-400'
                            } 
                            size={14} 
                          />
                        )}
                        <span className={isUser ? 'font-bold text-yellow-400' : ''}>
                          {standing.position}
                        </span>
                      </div>
                    </td>
                    <td className="p-3 text-white/90">
                      <span className={isUser ? 'font-bold text-yellow-400' : ''}>
                        {standing.username}
                      </span>
                      {isUser && (
                        <span className="ml-2 text-xs text-yellow-400">(You)</span>
                      )}
                    </td>
                    <td className="p-3 text-right text-white/90">
                      <span className={isUser ? 'font-bold text-yellow-400' : ''}>
                        {standing.totalPoints}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with blur */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Centered Semi-Transparent Modal Card */}
      <div
        className={`relative bg-gray-900/95 backdrop-blur-md rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] border border-white/10 transform transition-all duration-300 ${
          isOpen ? 'scale-100 translate-y-0 opacity-100' : 'scale-95 translate-y-4 opacity-0'
        }`}
        style={{ overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
          {/* Header */}
          <div className="sticky top-0 bg-gray-800/90 backdrop-blur-sm border-b border-white/10 p-6 flex items-center justify-between z-10 rounded-t-2xl">
            <div>
              <h2 className="text-2xl font-bold text-white">{leagueName}</h2>
              <p className="text-white/70 text-sm mt-1">Season {season} - Final Standings</p>
            </div>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white transition-colors p-2 hover:bg-white/10 rounded"
              aria-label="Close"
            >
              <IconWrapper icon={FaTimes} size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="text-white/70">Loading final standings...</div>
              </div>
            )}

            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6">
                <p className="text-red-400">{error}</p>
              </div>
            )}

            {standings && !loading && (
              <>
                {renderStandingsTable(
                  'Driver Championship',
                  standings.finalStandings.driverChampionship.standings,
                  {
                    champion: standings.finalStandings.driverChampionship.champion,
                    second: standings.finalStandings.driverChampionship.second,
                    third: standings.finalStandings.driverChampionship.third
                  }
                )}

                {renderStandingsTable(
                  'Constructor Championship',
                  standings.finalStandings.constructorChampionship.standings,
                  {
                    champion: standings.finalStandings.constructorChampionship.champion,
                    second: standings.finalStandings.constructorChampionship.second,
                    third: standings.finalStandings.constructorChampionship.third
                  }
                )}
              </>
            )}
          </div>
        </div>
    </div>
  );
};

export default PastLeagueResultsModal;

