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
  const [currentOpponent, setCurrentOpponent] = useState<string | null>(null);
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
    
    // Auto-select first opponent when data loads
    if (opponents.length > 0 && !currentOpponent) {
      setCurrentOpponent(opponents[0].id);
    }
  }, [opponents, currentOpponent]);

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
    <div className="min-h-screen w-full overflow-y-auto relative">
      {/* Fixed background */}
      <div 
        className="fixed inset-0 w-full h-full"
        style={{
          backgroundImage: `url("${briefingBackground}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          filter: 'brightness(0.8)',
          zIndex: 0
        }}
      />
      {/* Glassmorphic Header */}
      <div className="flex flex-col items-center pt-8 relative z-10">
        <div className="w-full max-w-3xl px-8 py-6 rounded-2xl shadow-xl bg-black/20 backdrop-blur-lg border border-white/10 mb-10">
          <h1 className="text-4xl font-bold text-white drop-shadow-lg mb-1">🎯 Opponents Briefing</h1>
          <p className="text-lg text-white font-medium drop-shadow-lg">Strategic intelligence on your league rivals</p>
        </div>
      </div>

      {/* Opponents Carousel */}
      <div className="max-w-4xl mx-auto px-4 py-10 pt-4 relative z-10">
        <div className="relative">
          {/* Navigation Arrows */}
          <button
            onClick={() => {
              const currentIndex = opponents.findIndex(opp => opp.id === currentOpponent);
              const prevIndex = currentIndex > 0 ? currentIndex - 1 : opponents.length - 1;
              setCurrentOpponent(opponents[prevIndex].id);
              setExpandedOpponent(null); // Close any expanded content
            }}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-colors"
          >
            <IconWrapper icon={FaChevronDown} className="rotate-90 text-xl" />
          </button>
          
          <button
            onClick={() => {
              const currentIndex = opponents.findIndex(opp => opp.id === currentOpponent);
              const nextIndex = currentIndex < opponents.length - 1 ? currentIndex + 1 : 0;
              setCurrentOpponent(opponents[nextIndex].id);
              setExpandedOpponent(null); // Close any expanded content
            }}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-colors"
          >
            <IconWrapper icon={FaChevronDown} className="-rotate-90 text-xl" />
          </button>

          {/* Single Card Display */}
          <div className="flex justify-center">
            {opponents.map((opponent) => (
            <div
              key={opponent.id}
              className={`w-80 bg-white/10 backdrop-blur-sm border-2 border-white/20 overflow-hidden transition-all duration-500 ${
                currentOpponent === opponent.id ? 'block' : 'hidden'
              }`}
            >
              {/* Opponent Card */}
              <div
                className="cursor-pointer flex flex-col items-center text-center p-6"
                onClick={() => toggleOpponent(opponent.id)}
              >
                {/* Large Avatar - no extra container */}
                <div className="mb-4">
                  <AvatarImage 
                    userId={opponent.id} 
                    username={opponent.username} 
                    size={192} 
                    className="w-48 h-48" 
                  />
                </div>
                
                {/* Username */}
                <h3 className="text-xl font-bold text-white mb-4">{opponent.username}</h3>
                
                {/* Expand/Collapse Arrow */}
                <div className="text-white">
                  {expandedOpponent === opponent.id ? (
                    <IconWrapper icon={FaChevronUp} className="text-white text-xl" />
                  ) : (
                    <IconWrapper icon={FaChevronDown} className="text-white text-xl" />
                  )}
                </div>
              </div>

              {/* Expanded Content */}
              {expandedOpponent === opponent.id && (
                <div className="px-4 pb-4 border-t border-white/20">
                  <div className="space-y-4">
                    {/* Main Drivers */}
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-2 flex items-center">
                        <IconWrapper icon={FaCar} className="mr-2 text-red-400" />
                        Main Drivers
                      </h4>
                      <div className="grid grid-cols-2 gap-1">
                        {opponent.remainingSelections.mainDrivers.map((driver, index) => (
                          <div
                            key={index}
                            className="px-2 py-1 bg-white/10 border border-white/20 text-white text-xs text-center"
                          >
                            {driver}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Reserve Drivers */}
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-2 flex items-center">
                        <IconWrapper icon={FaCar} className="mr-2 text-blue-400" />
                        Reserve Drivers
                      </h4>
                      <div className="grid grid-cols-2 gap-1">
                        {opponent.remainingSelections.reserveDrivers.map((driver, index) => (
                          <div
                            key={index}
                            className="px-2 py-1 bg-white/10 border border-white/20 text-white text-xs text-center"
                          >
                            {driver}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Teams */}
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-2 flex items-center">
                        <IconWrapper icon={FaUsers} className="mr-2 text-green-400" />
                        Teams
                      </h4>
                      <div className="grid grid-cols-2 gap-1">
                        {opponent.remainingSelections.teams.map((team, index) => (
                          <div
                            key={index}
                            className="px-2 py-1 border border-white/20 text-white text-xs text-center"
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
          
          {/* Navigation Indicators */}
          <div className="flex justify-center mt-6 space-x-2">
            {opponents.map((opponent, index) => (
              <button
                key={opponent.id}
                onClick={() => {
                  setCurrentOpponent(opponent.id);
                  setExpandedOpponent(null); // Close any expanded content
                }}
                className={`w-3 h-3 rounded-full transition-colors ${
                  currentOpponent === opponent.id 
                    ? 'bg-white' 
                    : 'bg-white/30 hover:bg-white/50'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OpponentsBriefing;
