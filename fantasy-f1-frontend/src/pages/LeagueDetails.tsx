import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { getLeague } from '../services/leagueService';
import { useAuth } from '../context/AuthContext';
import { FaTrophy, FaHistory, FaFlagCheckered, FaChartLine, FaArrowLeft, FaIdCard } from 'react-icons/fa';
import IconWrapper from '../utils/iconWrapper';
import DeckBuilder from './DeckBuilder';

const LeagueDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const [league, setLeague] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Get activeTab from URL search params, default to 'overview'
  const activeTab = (searchParams.get('tab') === 'deck' ? 'deck' : 'overview') as 'overview' | 'deck';

  useEffect(() => {
    const fetchLeagueData = async () => {
      try {
        const leagueData = await getLeague(id!);
        console.log('Fetched league data:', leagueData);
        console.log('League season value:', leagueData.season, 'Type:', typeof leagueData.season);
        setLeague(leagueData);
        setLoading(false);
      } catch (err) {
        setError('Failed to load league data');
        setLoading(false);
      }
    };

    fetchLeagueData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
      </div>
    );
  }

  if (error || !league) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-2xl">{error || 'League not found'}</div>
      </div>
    );
  }

  const currentYear = new Date().getFullYear();
  const isSeasonEnded = league.season < currentYear;
  
  // Ensure season is a number for comparison
  // Default to current year if season is missing (new leagues should be 2026)
  const leagueSeason = typeof league.season === 'number' 
    ? league.season 
    : (league.season ? parseInt(String(league.season), 10) : new Date().getFullYear());
  const showDeckTab = !isNaN(leagueSeason) && leagueSeason >= 2026;

  // If "My Deck" tab is active, show DeckBuilder component
  if (activeTab === 'deck') {
    return <DeckBuilder leagueId={id!} />;
  }
  
  // Handler to switch to deck tab
  const handleDeckTab = () => {
    setSearchParams({ tab: 'deck' });
  };

  return (
    <>
      {/* Background wrapper */}
      <div 
        className="fixed inset-0 w-full h-full"
        style={{
          backgroundImage: 'url("/My_league_background.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundColor: '#111827',
          filter: 'brightness(0.8)'
        }}
      />

      {/* Content wrapper */}
      <div className="relative w-full h-full flex flex-col">
        {/* Main content */}
        <div className="relative z-10 w-full p-4 md:p-8 flex-1">
          <div className="max-w-6xl mx-auto">
            {/* League Header */}
            <div className="backdrop-blur-sm bg-white/[0.02] rounded-xl p-6 border border-white/5 mb-6">
              <h1 className="text-4xl font-bold text-white text-center mb-2">{league.name}</h1>
              <p className="text-lg text-center text-white/70">Season {league.season}</p>
              {isSeasonEnded && (
                <div className="mt-4 px-4 py-3 bg-yellow-500/20 border-2 border-yellow-500/50 rounded-lg text-center">
                  <p className="text-yellow-300 font-semibold text-lg mb-1">
                    ⚠️ This season has now ended
                  </p>
                  <p className="text-yellow-200 text-sm">
                    This league was for the {league.season} season. To continue playing, create a new league for the {currentYear} season.
                  </p>
                </div>
              )}
              <p className="text-md text-center text-white/80 mt-2">Code: <span className="font-mono tracking-widest text-red-400">{league.code}</span></p>
              {/* Members at the bottom */}
              <div className="flex flex-wrap justify-center items-center gap-2 mt-6">
                {league.members && league.members.length > 0 && league.members.map((member: any) => (
                  <span
                    key={member._id || member.id || member.username}
                    className="px-3 py-1 rounded-full border-2 border-red-600 text-white bg-red-600/20 font-semibold text-sm shadow-sm"
                  >
                    {member.username}
                  </span>
                ))}
              </div>
            </div>

            {/* Center cards section */}
            <div className="flex items-center justify-center flex-1">
              {/* Main Action Buttons */}
              <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 px-4">
                {/* My Deck Button - Only for 2026+ seasons - Moved to beginning */}
                {showDeckTab && (
                  <div className="card-container h-48 relative">
                    <button
                      onClick={handleDeckTab}
                      className="card-flip-full backdrop-blur-sm bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 absolute inset-0 text-white rounded-xl"
                    >
                      <div className="card-front-full absolute inset-0 flex flex-col items-center justify-center p-6 space-y-3">
                        <IconWrapper icon={FaIdCard} size={48} className="text-orange-400 group-hover:text-orange-300 transition-colors" />
                        <span className="text-xl font-bold group-hover:text-orange-300 transition-colors">My Deck</span>
                        <span className="text-sm opacity-70">Build your power cards</span>
                      </div>
                    </button>
                  </div>
                )}

                {/* Next Race Button */}
                <div className="card-container h-48 relative">
                  <button
                    onClick={() => {
                      if (!isSeasonEnded) {
                        navigate(`/league/${id}/race/next/selections`);
                      }
                    }}
                    disabled={isSeasonEnded}
                    className={`card-flip-full backdrop-blur-sm border absolute inset-0 text-white rounded-xl ${
                      isSeasonEnded
                        ? 'bg-white/[0.01] border-white/5 opacity-50 cursor-not-allowed'
                        : 'bg-white/[0.02] hover:bg-white/[0.05] border-white/5'
                    }`}
                  >
                    <div className="card-front-full absolute inset-0 flex flex-col items-center justify-center p-6 space-y-3">
                      <IconWrapper icon={FaFlagCheckered} size={48} className={`${isSeasonEnded ? 'text-gray-500' : 'text-blue-400 group-hover:text-blue-300'} transition-colors`} />
                      <span className={`text-xl font-bold ${isSeasonEnded ? 'text-gray-500' : 'group-hover:text-blue-300'} transition-colors`}>Next Race</span>
                      <span className="text-sm opacity-70">{isSeasonEnded ? 'Season ended' : 'Make your selections'}</span>
                    </div>
                  </button>
                </div>

                {/* Standings Button */}
                <div className="card-container h-48 relative">
                  <button
                    onClick={() => navigate(`/league/${id}/standings`)}
                    className="card-flip-full backdrop-blur-sm bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 absolute inset-0 text-white rounded-xl"
                  >
                    <div className="card-front-full absolute inset-0 flex flex-col items-center justify-center p-6 space-y-3">
                      <IconWrapper icon={FaTrophy} size={48} className="text-green-400 group-hover:text-green-300 transition-colors" />
                      <span className="text-xl font-bold group-hover:text-green-300 transition-colors">Standings</span>
                      <span className="text-sm opacity-70">View league rankings</span>
                    </div>
                  </button>
                </div>

                {/* Race History Button */}
                <div className="card-container h-48 relative">
                  <button
                    onClick={() => navigate(`/league/${id}/race/history`)}
                    className="card-flip-full backdrop-blur-sm bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 absolute inset-0 text-white rounded-xl"
                  >
                    <div className="card-front-full absolute inset-0 flex flex-col items-center justify-center p-6 space-y-3">
                      <IconWrapper icon={FaHistory} size={48} className="text-purple-400 group-hover:text-purple-300 transition-colors" />
                      <span className="text-xl font-bold group-hover:text-purple-300 transition-colors">Race History</span>
                      <span className="text-sm opacity-70">Past race results</span>
                    </div>
                  </button>
                </div>

                {/* Statistics Button */}
                <div className="card-container h-48 relative">
                  <button
                    onClick={() => navigate(`/league/${id}/statistics`)}
                    className="card-flip-full backdrop-blur-sm bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 absolute inset-0 text-white rounded-xl"
                  >
                    <div className="card-front-full absolute inset-0 flex flex-col items-center justify-center p-6 space-y-3">
                      <IconWrapper icon={FaChartLine} size={48} className="text-yellow-400 group-hover:text-yellow-300 transition-colors" />
                      <span className="text-xl font-bold group-hover:text-yellow-300 transition-colors">Statistics</span>
                      <span className="text-sm opacity-70">View performance data</span>
                    </div>
                  </button>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LeagueDetails; 