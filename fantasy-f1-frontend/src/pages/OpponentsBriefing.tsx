import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaChevronDown, FaChevronUp, FaUser, FaCar, FaUsers } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import IconWrapper from '../utils/iconWrapper';

interface Opponent {
  id: string;
  username: string;
  avatar?: string;
  remainingDrivers: number;
  remainingTeams: number;
  remainingSelections: {
    mainDrivers: string[];
    reserveDrivers: string[];
    teams: string[];
  };
}

interface Driver {
  name: string;
  team: string;
  teamColor: string;
}

interface Team {
  name: string;
  color: string;
}

const OpponentsBriefing: React.FC = () => {
  const { leagueId } = useParams<{ leagueId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [opponents, setOpponents] = useState<Opponent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedOpponent, setExpandedOpponent] = useState<string | null>(null);

  useEffect(() => {
    const fetchOpponents = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/api/league/${leagueId}/opponents`);
        setOpponents(response.data);
      } catch (err) {
        setError('Failed to load opponents data');
        console.error('Error fetching opponents:', err);
      } finally {
        setLoading(false);
      }
    };

    if (leagueId) {
      fetchOpponents();
    }
  }, [leagueId]);

  const toggleOpponent = (opponentId: string) => {
    setExpandedOpponent(expandedOpponent === opponentId ? null : opponentId);
  };

  const getTeamColor = (teamName: string): string => {
    const teamColors: { [key: string]: string } = {
      'Red Bull Racing': '#1E40AF',
      'Ferrari': '#DC2626',
      'McLaren': '#F59E0B',
      'Mercedes': '#10B981',
      'Aston Martin': '#059669',
      'Alpine': '#3B82F6',
      'Williams': '#8B5CF6',
      'RB': '#1E40AF',
      'Haas F1 Team': '#6B7280',
      'Stake F1 Team Kick Sauber': '#EF4444'
    };
    return teamColors[teamName] || '#6B7280';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-2xl">{error}</div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen w-full fixed inset-0 overflow-y-auto"
      style={{
        backgroundImage: 'url(/Briefing page.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Glassmorphic Header */}
      <div className="flex flex-col items-center pt-16">
        <div className="w-full max-w-3xl px-8 py-6 rounded-2xl shadow-xl bg-transparent backdrop-blur-lg border border-white/5 mb-10">
          <h1 className="text-4xl font-bold text-red-600 drop-shadow mb-1">🎯 Opponents Briefing</h1>
          <p className="text-lg text-white font-medium drop-shadow">Strategic intelligence on your league rivals</p>
        </div>
      </div>

      {/* Opponents Grid */}
      <div className="max-w-4xl mx-auto px-4 py-10 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {opponents.map((opponent) => (
            <div
              key={opponent.id}
              className="rounded-2xl shadow-xl bg-white/20 backdrop-blur-lg border border-white/20 overflow-hidden transition-all duration-300 hover:bg-white/25"
            >
              {/* Opponent Header */}
              <div
                className="p-6 cursor-pointer"
                onClick={() => toggleOpponent(opponent.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white font-bold text-lg">
                      {opponent.avatar ? (
                        <img
                          src={opponent.avatar}
                          alt={opponent.username}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <IconWrapper icon={FaUser} className="text-white text-xl" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">{opponent.username}</h3>
                      <p className="text-sm text-white/80">
                        {opponent.remainingDrivers} drivers, {opponent.remainingTeams} teams
                      </p>
                    </div>
                  </div>
                  <div className="text-white">
                    {expandedOpponent === opponent.id ? (
                      <IconWrapper icon={FaChevronUp} className="text-white text-xl" />
                    ) : (
                      <IconWrapper icon={FaChevronDown} className="text-white text-xl" />
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {expandedOpponent === opponent.id && (
                <div className="px-6 pb-6 border-t border-white/20">
                  <div className="space-y-6">
                    {/* Main Drivers */}
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-3 flex items-center">
                        <IconWrapper icon={FaCar} className="mr-2 text-red-400" />
                        Main Drivers Available
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {opponent.remainingSelections.mainDrivers.map((driver, index) => (
                          <div
                            key={index}
                            className="px-3 py-2 bg-white/10 rounded-lg text-white text-sm font-medium text-center"
                          >
                            {driver}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Reserve Drivers */}
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-3 flex items-center">
                        <IconWrapper icon={FaCar} className="mr-2 text-blue-400" />
                        Reserve Drivers Available
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {opponent.remainingSelections.reserveDrivers.map((driver, index) => (
                          <div
                            key={index}
                            className="px-3 py-2 bg-white/10 rounded-lg text-white text-sm font-medium text-center"
                          >
                            {driver}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Teams */}
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-3 flex items-center">
                        <IconWrapper icon={FaUsers} className="mr-2 text-green-400" />
                        Teams Available
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {opponent.remainingSelections.teams.map((team, index) => (
                          <div
                            key={index}
                            className="px-3 py-2 rounded-lg text-white text-sm font-medium text-center"
                            style={{ backgroundColor: getTeamColor(team) + '40' }}
                          >
                            {team}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OpponentsBriefing;
