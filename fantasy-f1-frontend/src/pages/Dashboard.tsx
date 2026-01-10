import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { FaSignOutAlt, FaUser, FaPlus, FaUsers, FaCalendarAlt, FaBook, FaSearch, FaTimes, FaTrophy, FaInfoCircle, FaInstagram } from 'react-icons/fa';
import IconWrapper from '../utils/iconWrapper';
import { useNavigate } from 'react-router-dom';
import { createLeague, joinLeague, getUserLeagues, League } from '../services/leagueService';
import DashboardRaceCountdown from '../components/DashboardRaceCountdown';
import BulletinBoard from '../components/BulletinBoard';
import AvatarImage from '../components/Avatar/AvatarImage';
import Footer from '../components/Footer';

const TypedInstagramIcon = FaInstagram as unknown as React.FC<{ size?: number; className?: string }>;

const Dashboard: React.FC = () => {
  const { user, logout, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('create-league');
  const [showCreateLeagueForm, setShowCreateLeagueForm] = useState(false);
  const [showJoinLeagueForm, setShowJoinLeagueForm] = useState(false);
  const [leagueName, setLeagueName] = useState('');
  const [leagueCode, setLeagueCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userLeagues, setUserLeagues] = useState<League[]>([]);
  const [isLoadingLeagues, setIsLoadingLeagues] = useState(false);
  const navigate = useNavigate();
  const carouselSectionRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const fetchUserLeagues = async () => {
      if (activeTab === 'my-league') {
        setIsLoadingLeagues(true);
        try {
          const leagues = await getUserLeagues();
          setUserLeagues(leagues);
        } catch (err) {
          console.error('Failed to fetch leagues:', err);
        } finally {
          setIsLoadingLeagues(false);
        }
      }
    };

    fetchUserLeagues();
  }, [activeTab]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    // Check on mount in case window size changed
    handleResize();
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleProfileClick = () => {
    navigate('/profile');
  };

  const handleTabAndScroll = (tab: string, showFormSetter?: (v: boolean) => void) => {
    setActiveTab(tab);
    if (showFormSetter) showFormSetter(true);
    // Only scroll on mobile
    if (window.innerWidth < 768 && carouselSectionRef.current) {
      carouselSectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleCreateLeague = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      console.log('[Dashboard] Creating league:', leagueName);
      let newLeague;
      
      try {
        newLeague = await createLeague({
          name: leagueName
        });
      } catch (timeoutErr: any) {
        // If we get a timeout, the league might still have been created
        // Try to find it by fetching user's leagues
        if (timeoutErr.code === 'ECONNABORTED' || timeoutErr.message?.includes('timeout')) {
          console.log('[Dashboard] Request timed out, checking if league was created...');
          try {
            const userLeagues = await getUserLeagues();
            const createdLeague = userLeagues.find((l: League) => l.name === leagueName);
            if (createdLeague) {
              console.log('[Dashboard] League found after timeout:', createdLeague._id);
              newLeague = createdLeague;
            } else {
              throw timeoutErr; // Re-throw if league not found
            }
          } catch (fetchErr) {
            throw timeoutErr; // Re-throw original timeout error
          }
        } else {
          throw timeoutErr; // Re-throw if not a timeout error
        }
      }
      
      console.log('[Dashboard] League created, response:', newLeague);
      
      // Validate that we got a league with an ID
      const leagueId = newLeague?._id || newLeague?.league?._id;
      if (!leagueId) {
        console.error('[Dashboard] Invalid league response:', newLeague);
        throw new Error('Invalid league response: missing league ID');
      }
      
      console.log('[Dashboard] Navigating to league:', leagueId);
      
      // Reset form state immediately
      setLeagueName('');
      setShowCreateLeagueForm(false);
      
      // Use setTimeout to ensure state updates and navigation happen in next tick
      // This prevents UI freeze
      setTimeout(() => {
        setIsSubmitting(false);
        navigate(`/league/${leagueId}`);
      }, 0);
    } catch (err: any) {
      console.error('[Dashboard] League creation error:', err);
      setIsSubmitting(false);
      setError(err?.response?.data?.error || err?.response?.data?.message || err?.message || 'Failed to create league. Please try again.');
    }
  };

  const handleJoinLeague = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      console.log('[Dashboard] Joining league with code:', leagueCode);
      const joinedLeague = await joinLeague(leagueCode);
      
      console.log('[Dashboard] League joined, response:', joinedLeague);
      
      // Validate that we got a league with an ID
      const leagueId = joinedLeague?._id || joinedLeague?.league?._id;
      if (!leagueId) {
        console.error('[Dashboard] Invalid league response:', joinedLeague);
        throw new Error('Invalid league response: missing league ID');
      }
      
      console.log('[Dashboard] Navigating to league:', leagueId);
      
      // Reset form state immediately
      setLeagueCode('');
      setShowJoinLeagueForm(false);
      
      // Use setTimeout to ensure state updates and navigation happen in next tick
      // This prevents UI freeze
      setTimeout(() => {
        setIsSubmitting(false);
        navigate(`/league/${leagueId}`);
      }, 0);
    } catch (err: any) {
      console.error('[Dashboard] League join error:', err);
      setIsSubmitting(false);
      setError(err?.response?.data?.error || err?.response?.data?.message || err?.message || 'Failed to join league. Please check the code and try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <>
      {/* Background wrapper */}
      <div
        className="fixed inset-0 w-full h-full dashboard-bg dashboard-bg-mobile"
        style={{
          backgroundImage: isMobile ? 'url("/Dashboard_mobile.png")' : 'url("/Background_dashboard.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
          backgroundRepeat: 'no-repeat',
          backgroundColor: '#000000'
        }}
      />

      {/* Content wrapper */}
      <div className="relative min-h-screen">
        {/* Semi-transparent overlay - reduced opacity for better logo visibility */}
        <div className="absolute inset-0 bg-black bg-opacity-20 dashboard-overlay-mobile" />

        {/* Main content */}
        <div className="relative z-10 min-h-screen p-4 md:p-8">
          {/* Top bar with username and logout */}
          <div className="flex justify-between items-center mb-8">
            {/* Profile button on the left */}
            <button
              onClick={handleProfileClick}
              className="flex items-center px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-white font-semibold shadow text-sm"
            >
              {user?.id && (
                <AvatarImage 
                  userId={user.id} 
                  username={user.username} 
                  size={24} 
                  className="mr-1.5" 
                />
              )}
              <span className="ml-0.5">
                {user?.username || 'User'}
              </span>
            </button>
            {/* Logout button on the right */}
            <button
              onClick={logout}
              className="flex items-center px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-white font-semibold shadow text-sm"
            >
              <IconWrapper icon={FaSignOutAlt} size={14} className="text-white" />
              <span className="ml-1.5">Logout</span>
            </button>
          </div>

          {/* Main content area */}
          <div className="max-w-6xl mx-auto pt-8 md:pt-16">
            {/* Menu block */}
            <div className="backdrop-blur-sm bg-white/[0.02] rounded-xl p-8 border border-white/10 mb-12">
              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row justify-center gap-4 w-full">
                {/* Instagram icon button */}
                <div className="card-container w-full sm:w-40 h-16 mb-2 sm:mb-0">
                  <a
                    href="https://instagram.com/thefantasyf1game"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram @thefantasyf1game"
                    title="Follow us on Instagram"
                    className="card-flip-half bg-red-500 text-white rounded-xl w-full h-full block"
                  >
                    <div className="card-front-half absolute inset-0 flex flex-row items-center justify-center p-6">
                      <TypedInstagramIcon
                        size={24}
                        className="text-white"
                      />
                    </div>
                    <div className="card-back-half absolute inset-0 flex flex-row items-center justify-center p-6">
                      <TypedInstagramIcon
                        size={20}
                        className="text-white"
                      />
                    </div>
                  </a>
                </div>
                <div className="card-container w-full sm:w-40 h-16 mb-2 sm:mb-0">
                <button
                  onClick={() => handleTabAndScroll('create-league', setShowCreateLeagueForm)}
                    className="card-flip-half bg-red-500 text-white rounded-xl w-full h-full"
                >
                    <div className="card-front-half absolute inset-0 flex flex-row items-center justify-center p-6">
                      <IconWrapper icon={FaPlus} size={24} className="text-white mr-2" />
                      <span className="text-white text-base font-semibold">Create League</span>
                  </div>
                    <div className="card-back-half absolute inset-0 flex flex-row items-center justify-center p-6">
                      <IconWrapper icon={FaPlus} size={20} className="text-white mr-2" />
                      <span className="text-white text-base font-semibold">start your own</span>
                  </div>
                </button>
                </div>
                <div className="card-container w-full sm:w-40 h-16 mb-2 sm:mb-0">
                <button
                  onClick={() => handleTabAndScroll('join-league', setShowJoinLeagueForm)}
                    className="card-flip-half bg-red-500 text-white rounded-xl w-full h-full"
                >
                    <div className="card-front-half absolute inset-0 flex flex-row items-center justify-center p-6">
                      <IconWrapper icon={FaSearch} size={24} className="text-white mr-2" />
                      <span className="text-white text-base font-semibold">Join League</span>
                  </div>
                    <div className="card-back-half absolute inset-0 flex flex-row items-center justify-center p-6">
                      <IconWrapper icon={FaSearch} size={20} className="text-white mr-2" />
                      <span className="text-white text-base font-semibold">join your friends</span>
                  </div>
                </button>
                </div>
                <div className="card-container w-full sm:w-40 h-16 mb-2 sm:mb-0">
                <button
                  onClick={() => handleTabAndScroll('my-league')}
                    className="card-flip-half bg-red-500 text-white rounded-xl w-full h-full"
                >
                    <div className="card-front-half absolute inset-0 flex flex-row items-center justify-center p-6">
                      <IconWrapper icon={FaUsers} size={24} className="text-white mr-2" />
                      <span className="text-white text-base font-semibold">My Leagues</span>
                  </div>
                    <div className="card-back-half absolute inset-0 flex flex-row items-center justify-center p-6">
                      <IconWrapper icon={FaUsers} size={20} className="text-white mr-2" />
                      <span className="text-white text-base font-semibold">explore</span>
                  </div>
                </button>
                </div>
                <div className="card-container w-full sm:w-40 h-16 mb-2 sm:mb-0">
                <button
                  onClick={() => navigate('/rules')}
                    className="card-flip-half bg-red-500 text-white rounded-xl w-full h-full"
                >
                    <div className="card-front-half absolute inset-0 flex flex-row items-center justify-center p-6">
                      <IconWrapper icon={FaBook} size={24} className="text-white mr-2" />
                      <span className="text-white text-base font-semibold">Rules</span>
                  </div>
                    <div className="card-back-half absolute inset-0 flex flex-row items-center justify-center p-6">
                      <IconWrapper icon={FaBook} size={20} className="text-white mr-2" />
                      <span className="text-white text-base font-semibold">how to play</span>
                  </div>
                </button>
                </div>
                <div className="card-container w-full sm:w-40 h-16">
                <button
                  onClick={() => navigate('/info')}
                    className="card-flip-half bg-red-500 text-white rounded-xl w-full h-full"
                >
                    <div className="card-front-half absolute inset-0 flex flex-row items-center justify-center p-6">
                      <IconWrapper icon={FaInfoCircle} size={24} className="text-white mr-2" />
                      <span className="text-white text-base font-semibold">Info</span>
                  </div>
                    <div className="card-back-half absolute inset-0 flex flex-row items-center justify-center p-6">
                      <IconWrapper icon={FaInfoCircle} size={20} className="text-white mr-2" />
                      <span className="text-white text-base font-semibold">learn more</span>
                  </div>
                </button>
                </div>
              </div>
            </div>

            {/* Split layout for countdown, carousel, and bulletin board */}
            <div ref={carouselSectionRef} className="flex flex-col md:flex-row gap-4 relative md:h-64 justify-center items-center mt-4">
              {/* Next Race Countdown */}
              <div className="w-full md:w-1/3 h-auto md:h-64 flex flex-col justify-center mb-4 md:mb-0">
                <div className="backdrop-blur-sm bg-white/[0.02] rounded-xl p-2 border border-white/10 w-full h-full flex flex-col justify-center overflow-hidden">
                  <DashboardRaceCountdown />
                </div>
              </div>

              {/* Carousel for create/join/my leagues */}
              <div className="w-full md:w-1/3 h-auto md:h-64 flex flex-col justify-center">
                <div className="relative w-full h-full max-w-full overflow-hidden">
                  <div
                    className="flex w-full h-full transition-transform duration-500"
                    style={{ transform: `translateX(-${['create-league', 'join-league', 'my-league'].indexOf(activeTab) * 100}%)` }}
                  >
                    {/* Create League */}
                    <div className="min-w-full h-64 flex flex-col justify-center p-2 bg-white/[0.02] rounded-xl border border-white/10">
                      <h2 className="text-sm font-bold text-white mb-1 break-words">Create New League</h2>
                      <form onSubmit={handleCreateLeague} className="flex flex-col gap-1 w-full">
                        <div className="w-full">
                          <label htmlFor="leagueName" className="block text-white mb-1 text-xs truncate">
                            League Name
                          </label>
                          <input
                            type="text"
                            id="leagueName"
                            value={leagueName}
                            onChange={(e) => setLeagueName(e.target.value)}
                            className="w-full px-2 py-1 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:border-red-500 text-xs"
                            placeholder="Enter league name"
                            required
                          />
                        </div>
                        {error && (
                          <div className="text-red-500 text-xs break-words">
                            {error}
                          </div>
                        )}
                        {success && (
                          <div className="text-green-500 text-xs break-words">
                            {success}
                          </div>
                        )}
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-2 rounded-lg transition-colors disabled:opacity-50 text-xs"
                        >
                          {isSubmitting ? 'Creating...' : 'Create League'}
                        </button>
                      </form>
                    </div>
                    {/* Join League */}
                    <div className="min-w-full h-64 flex flex-col justify-center p-2 bg-white/[0.02] rounded-xl border border-white/10">
                      <h2 className="text-sm font-bold text-white mb-1 break-words">Join a League</h2>
                      <form onSubmit={handleJoinLeague} className="flex flex-col gap-1 w-full">
                        <div className="w-full">
                          <label htmlFor="leagueCode" className="block text-white mb-1 text-xs truncate">
                            League Code
                          </label>
                          <input
                            type="text"
                            id="leagueCode"
                            value={leagueCode}
                            onChange={(e) => setLeagueCode(e.target.value.toUpperCase())}
                            className="w-full px-2 py-1 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:border-red-500 text-xs"
                            placeholder="Enter league code"
                            required
                            maxLength={6}
                          />
                        </div>
                        {error && (
                          <div className="text-red-500 text-xs break-words">
                            {error}
                          </div>
                        )}
                        {success && (
                          <div className="text-green-500 text-xs break-words">
                            {success}
                          </div>
                        )}
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-2 rounded-lg transition-colors disabled:opacity-50 text-xs"
                        >
                          {isSubmitting ? 'Joining...' : 'Join League'}
                        </button>
                      </form>
                    </div>
                    {/* My Leagues */}
                    <div className="min-w-full h-64 flex flex-col justify-center p-2 bg-white/[0.02] rounded-xl border border-white/10 overflow-y-auto">
                      {isLoadingLeagues ? (
                        <div className="flex justify-center">
                          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
                        </div>
                      ) : userLeagues.length === 0 ? (
                        <div className="text-center text-white">
                          <p className="text-xs">You haven't joined any leagues yet.</p>
                          <p className="text-xs opacity-75">Create a new league or join an existing one to get started!</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-1 overflow-y-auto">
                          {(() => {
                            const currentYear = new Date().getFullYear();
                            // Filter to show only active leagues (current season or future)
                            const activeLeagues = userLeagues.filter(league => league.season >= currentYear);
                            
                            if (activeLeagues.length === 0) {
                              return (
                                <div className="text-center text-white">
                                  <p className="text-xs">No active leagues found.</p>
                                  <p className="text-xs opacity-75">Create a new league or join an existing one to get started!</p>
                                </div>
                              );
                            }
                            
                            return activeLeagues.map((league) => (
                              <div
                                key={league._id}
                                onClick={() => navigate(`/league/${league._id}`)}
                                className="backdrop-blur-sm bg-white/[0.02] rounded-xl p-2 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors"
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <h3 className="text-xs font-bold text-white truncate">{league.name}</h3>
                                  {league.owner === user?.id && (
                                    <span className="text-xs bg-red-500 text-white px-2 py-1 rounded">Admin</span>
                                  )}
                                </div>
                                <div className="flex items-center text-white/75 mb-1 text-xs">
                                  <IconWrapper icon={FaUsers} className="mr-2" />
                                  <span>{league.members.length} members</span>
                                </div>
                                <div className="flex items-center text-white/75 text-xs">
                                  <IconWrapper icon={FaTrophy} className="mr-2" />
                                  <span>Season {league.season}</span>
                                </div>
                                <div className="mt-1 text-xs text-white/50">
                                  <p className="truncate">Code: {league.code}</p>
                                </div>
                              </div>
                            ));
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bulletin Board */}
              <div className="w-full md:w-1/3 h-auto md:h-64 flex flex-col justify-center">
                <BulletinBoard />
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
};

export default Dashboard; 