import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaChevronDown, FaChevronUp, FaUser, FaCar, FaUsers } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import IconWrapper from '../utils/iconWrapper';
import AvatarImage from '../components/Avatar/AvatarImage';
import briefingBackground from '../assets/briefing-background.png';

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
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAdminAndFetchData = async () => {
      try {
        setLoading(true);
        
        // First check if user is admin
        const leagueResponse = await api.get(`/api/league/${leagueId}`);
        const league = leagueResponse.data;
        const userIsAdmin = league.owner?.id === user?.id;
        setIsAdmin(userIsAdmin);
        
        if (!userIsAdmin) {
          setError('Access denied. This feature is only available to league administrators.');
          return;
        }
        
        // If admin, fetch opponents data
        const response = await api.get(`/api/league/${leagueId}/opponents`);
        setOpponents(response.data);
      } catch (err) {
        setError('Failed to load data');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (leagueId && user) {
      checkAdminAndFetchData();
    }
  }, [leagueId, user]);

  // Debug: Log the imported image path and opponents data
  useEffect(() => {
    console.log('Briefing background image path:', briefingBackground);
    console.log('Opponents data:', opponents);
  }, [opponents]);

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
      <div 
        className="min-h-screen w-full flex items-center justify-center"
        style={{
          backgroundImage: `url("${briefingBackground}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed',
          backgroundColor: '#1e3a8a',
        }}
      >
        <div className="text-center max-w-md mx-auto px-6">
          <div className="bg-black/40 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            <h2 className="text-3xl font-bold text-white mb-4">🔒 Access Restricted</h2>
            <p className="text-white text-lg mb-6">{error}</p>
            <button
              onClick={() => navigate(`/league/${leagueId}`)}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold transition-colors duration-200"
            >
              Back to League
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen w-full overflow-y-auto relative"
      style={{
        backgroundImage: `url("${briefingBackground}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
        backgroundColor: '#1e3a8a',
        minHeight: '100vh',
      }}
    >
      {/* Glassmorphic Header */}
      <div className="flex flex-col items-center pt-8">
        <div className="w-full max-w-3xl px-8 py-6 rounded-2xl shadow-xl bg-black/20 backdrop-blur-lg border border-white/10 mb-10">
          <h1 className="text-4xl font-bold text-white drop-shadow-lg mb-1">🎯 Opponents Briefing</h1>
          <p className="text-lg text-white font-medium drop-shadow-lg">Strategic intelligence on your league rivals</p>
        </div>
      </div>

      {/* Opponents Grid */}
      <div className="max-w-4xl mx-auto px-4 py-10 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {opponents.map((opponent) => (
            <div
              key={opponent.id}
              className="rounded-2xl shadow-xl bg-black/40 backdrop-blur-lg border border-white/30 overflow-hidden transition-all duration-300 hover:bg-black/50"
            >
              {/* Opponent Header */}
              <div
                className="p-6 cursor-pointer"
                onClick={() => toggleOpponent(opponent.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <AvatarImage 
                      userId={opponent.id} 
                      username={opponent.username} 
                      size={48} 
                      className="mr-3" 
                    />
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
                <div className="px-6 pb-6 border-t border-white/30">
                  <div className="space-y-6">
                    {/* Main Drivers */}
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-3 flex items-center drop-shadow-lg">
                        <IconWrapper icon={FaCar} className="mr-2 text-red-400" />
                        Main Drivers Available
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {opponent.remainingSelections.mainDrivers.map((driver, index) => (
                          <div
                            key={index}
                            className="px-3 py-2 bg-white/20 rounded-lg text-white text-sm font-medium text-center drop-shadow-lg"
                          >
                            {driver}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Reserve Drivers */}
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-3 flex items-center drop-shadow-lg">
                        <IconWrapper icon={FaCar} className="mr-2 text-blue-400" />
                        Reserve Drivers Available
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {opponent.remainingSelections.reserveDrivers.map((driver, index) => (
                          <div
                            key={index}
                            className="px-3 py-2 bg-white/20 rounded-lg text-white text-sm font-medium text-center drop-shadow-lg"
                          >
                            {driver}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Teams */}
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-3 flex items-center drop-shadow-lg">
                        <IconWrapper icon={FaUsers} className="mr-2 text-green-400" />
                        Teams Available
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {opponent.remainingSelections.teams.map((team, index) => (
                          <div
                            key={index}
                            className="px-3 py-2 rounded-lg text-white text-sm font-medium text-center drop-shadow-lg"
                            style={{ backgroundColor: getTeamColor(team) + '60' }}
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
