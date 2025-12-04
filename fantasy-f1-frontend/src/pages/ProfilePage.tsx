import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserLeagues, League, deleteLeague, abandonLeague } from '../services/leagueService';
import { FaUser, FaEnvelope, FaTrophy, FaKey, FaArrowLeft, FaTrash, FaSignOutAlt, FaEye, FaSyncAlt, FaPalette, FaBell, FaBellSlash } from 'react-icons/fa';
import IconWrapper from '../utils/iconWrapper';
import { api } from '../services/api';
import AvatarTestingPanel from '../components/Avatar/AvatarTestingPanel';
import AvatarImage from '../components/Avatar/AvatarImage';
import PastLeagueResultsModal from '../components/PastLeagueResultsModal';

const ProfilePage: React.FC = () => {
  const { user, logout, getToken } = useAuth();
  const navigate = useNavigate();
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [abandoningLeagueId, setAbandoningLeagueId] = useState<string | null>(null);
  const [abandonLoading, setAbandonLoading] = useState(false);
  const [abandonError, setAbandonError] = useState<string | null>(null);
  const [abandonSuccess, setAbandonSuccess] = useState<string | null>(null);
  const [allLeagues, setAllLeagues] = useState<any[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [scrapeStatus, setScrapeStatus] = useState<string | null>(null);
  const [assignPointsStatus, setAssignPointsStatus] = useState<string | null>(null);
  const [selectedRound, setSelectedRound] = useState<string>('');
  const [emailRemindersEnabled, setEmailRemindersEnabled] = useState<boolean>(true);
  const [reminderLoading, setReminderLoading] = useState<boolean>(false);
  const [reminderError, setReminderError] = useState<string | null>(null);
  const [reminderSuccess, setReminderSuccess] = useState<string | null>(null);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [selectedTestUser, setSelectedTestUser] = useState<string>('');
  const [testReminderLoading, setTestReminderLoading] = useState<boolean>(false);
  const [testConnectionLoading, setTestConnectionLoading] = useState<boolean>(false);
  const [selectedPastLeague, setSelectedPastLeague] = useState<{ id: string; name: string; season: number } | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'past'>('active');

  useEffect(() => {
    const fetchLeagues = async () => {
      try {
        const userLeagues = await getUserLeagues();
        setLeagues(userLeagues);
      } catch (error) {
        console.error('Error fetching leagues:', error);
        setError('Failed to load leagues. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    const fetchUserPreferences = async () => {
      try {
        const response = await api.get('/api/users/preferences');
        setEmailRemindersEnabled(response.data.emailRemindersEnabled);
      } catch (err) {
        console.error('Error fetching user preferences:', err);
      }
    };

    const fetchAllUsers = async () => {
      if (user?.isAppAdmin) {
        try {
          const response = await api.get('/api/users/all');
          setAllUsers(response.data.users);
        } catch (err) {
          console.error('Error fetching all users:', err);
        }
      }
    };

    fetchLeagues();
    fetchUserPreferences();
    fetchAllUsers();
  }, []);

  // Fetch all leagues for app admin when user changes
  useEffect(() => {
    if (user?.isAppAdmin) {
      setAdminLoading(true);
      api.get('/api/admin/all-leagues')
        .then(res => setAllLeagues(res.data))
        .catch(() => setAdminError('Failed to load all leagues.'))
        .finally(() => setAdminLoading(false));
    }
  }, [user]);

  const handleDeleteLeague = async (leagueId: string) => {
    if (!window.confirm('Are you sure you want to delete this league? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteLeague(leagueId);
      // Remove the deleted league from the state
      setLeagues(leagues.filter(league => league._id !== leagueId));
    } catch (err: any) {
      setDeleteError('Failed to delete league. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await api.delete('/api/auth/delete');
      await logout();
      navigate('/');
    } catch (err: any) {
      setDeleteError('Failed to delete account. Please try again.');
      setDeleting(false);
    }
  };

  const handleAbandonLeague = async (leagueId: string) => {
    setAbandonLoading(true);
    setAbandonError(null);
    setAbandonSuccess(null);
    try {
      await abandonLeague(leagueId);
      setLeagues(leagues.filter(league => league._id !== leagueId));
      setAbandonSuccess('You have left the league.');
      setAbandoningLeagueId(null);
    } catch (err: any) {
      setAbandonError('Failed to abandon league. Please try again.');
    } finally {
      setAbandonLoading(false);
    }
  };

  const handleUpdateLeaderboard = async (leagueId: string, season: number) => {
    try {
      await api.post(`/api/admin/initialize-leaderboard/${leagueId}/${season}`);
    } catch (err) {
      console.error('Failed to update leaderboard:', err);
    }
  };

  const handleScrapeAllRaces = async () => {
    setAdminLoading(true);
    setAdminError(null);
    setScrapeStatus(null);
    try {
      const response = await api.post('/api/admin/scrape-missing-races');
      if (response.data.message) {
        setScrapeStatus('Scraping triggered for all missing or incomplete race results.');
      }
    } catch (error: any) {
      setAdminError(error.response?.data?.message || 'Failed to trigger race results scraping');
    } finally {
      setAdminLoading(false);
    }
  };

  const handleAssignRealPoints = async (leagueId: string) => {
    if (!selectedRound) {
      setAdminError('Please select a round first');
      return;
    }

    setAdminLoading(true);
    setAdminError(null);
    setAssignPointsStatus(null);
    try {
      const response = await api.post('/api/admin/assign-real-points-league', {
        leagueId,
        round: parseInt(selectedRound)
      });
      setAssignPointsStatus(response.data.message);
    } catch (error: any) {
      setAdminError(error.response?.data?.message || 'Failed to assign real points');
    } finally {
      setAdminLoading(false);
    }
  };

  const handleToggleReminders = async () => {
    setReminderLoading(true);
    setReminderError(null);
    setReminderSuccess(null);
    
    try {
      const newValue = !emailRemindersEnabled;
      await api.put('/api/users/preferences/reminders', {
        emailRemindersEnabled: newValue
      });
      
      setEmailRemindersEnabled(newValue);
      setReminderSuccess(
        newValue 
          ? 'Email reminders enabled! You will receive race reminders.' 
          : 'Email reminders disabled. You will not receive race reminders.'
      );
    } catch (error: any) {
      setReminderError(error.response?.data?.error || 'Failed to update reminder preferences');
    } finally {
      setReminderLoading(false);
    }
  };

  const handleTestReminder = async () => {
    if (!selectedTestUser) {
      setReminderError('Please select a user to send the test reminder to');
      return;
    }

    setTestReminderLoading(true);
    setReminderError(null);
    setReminderSuccess(null);
    
    try {
      const response = await api.post('/api/users/test-reminder', {
        userId: selectedTestUser
      });
      const selectedUser = allUsers.find(u => u._id === selectedTestUser);
      setReminderSuccess(`Test reminder email sent to ${selectedUser?.username}! Check their inbox.`);
    } catch (error: any) {
      setReminderError(error.response?.data?.error || 'Failed to send test reminder');
    } finally {
      setTestReminderLoading(false);
    }
  };

  const handleTestEmailConnection = async () => {
    setTestConnectionLoading(true);
    setReminderError(null);
    setReminderSuccess(null);
    
    try {
      const response = await api.get('/api/users/test-email-connection');
      setReminderSuccess('Email connection test completed! Check the server logs for details.');
    } catch (error: any) {
      setReminderError(error.response?.data?.error || 'Failed to test email connection');
    } finally {
      setTestConnectionLoading(false);
    }
  };

  if (!user) {
    return null; // This shouldn't happen due to PrivateRoute, but just in case
  }

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden">
      {/* Background image */}
      <div
        className="fixed inset-0 w-full h-full z-0"
        style={{
          backgroundImage: 'url("/profile.webp")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />
      {/* Dark overlay for readability */}
      <div className="fixed inset-0 bg-black bg-opacity-30 z-0" />

      {/* Responsive Flex Layout for Profile + Admin */}
      <div className={`relative z-10 min-h-screen flex flex-col ${user.isAppAdmin ? 'md:flex-row md:items-start md:justify-center' : 'items-start justify-center'} p-4 md:p-8 ml-0 md:ml-16 w-full`}>
        {/* Profile Container */}
        <div className={`w-full ${user.isAppAdmin ? 'md:max-w-lg md:mr-8' : 'max-w-lg'}`}>
          {/* Profile Header */}
          <div className="backdrop-blur-lg bg-white/2 rounded-2xl p-8 mb-8 border border-white/10 shadow-xl">
            <h1 className="text-3xl font-bold mb-6 text-white/90">Profile</h1>
            
            {/* Avatar Display */}
            <div className="flex justify-center mb-6">
              <AvatarImage 
                userId={user.id} 
                username={user.username} 
                size={120} 
              />
            </div>
            
            {/* User Details */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {FaUser({ className: "text-white/80", size: 22 })}
                <div>
                  <div className="text-sm text-white/70">Username</div>
                  <div className="text-lg text-white/90">{user.username}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {FaEnvelope({ className: "text-white/80", size: 22 })}
                <div>
                  <div className="text-sm text-white/70">Email</div>
                  <div className="text-lg text-white/90">{user.email}</div>
                </div>
              </div>
            </div>

            {/* Email Reminders Section */}
            <div className="mt-6 p-4 bg-white/5 rounded-lg border border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {emailRemindersEnabled ? 
                    FaBell({ className: "text-green-400", size: 20 }) : 
                    FaBellSlash({ className: "text-gray-400", size: 20 })
                  }
                  <div>
                    <div className="text-sm text-white/70">Email Reminders</div>
                    <div className="text-sm text-white/90">
                      {emailRemindersEnabled ? 'Enabled' : 'Disabled'}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleToggleReminders}
                    disabled={reminderLoading}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                      emailRemindersEnabled
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    } disabled:opacity-60`}
                  >
                    {reminderLoading ? 'Updating...' : emailRemindersEnabled ? 'Disable' : 'Enable'}
                  </button>
                </div>
              </div>
              {reminderError && (
                <div className="text-red-400 text-sm mt-2">{reminderError}</div>
              )}
              {reminderSuccess && (
                <div className="text-green-400 text-sm mt-2">{reminderSuccess}</div>
              )}
              <div className="text-xs text-white/60 mt-2">
                Get reminded about upcoming races and qualifying sessions
              </div>
            </div>

            {/* Admin Test Reminder Section */}
            {user.isAppAdmin && (
              <div className="mt-4 p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-blue-400 text-sm font-medium">🔧 Admin Test Tools</span>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-white/70 mb-1">Select User to Test:</label>
                    <select
                      value={selectedTestUser}
                      onChange={(e) => setSelectedTestUser(e.target.value)}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white text-sm focus:outline-none focus:border-blue-400"
                    >
                      <option value="">Choose a user...</option>
                      {allUsers.map((user) => (
                        <option key={user._id} value={user._id} className="bg-gray-800 text-white">
                          {user.username} ({user.email}) - {user.emailRemindersEnabled ? 'Reminders ON' : 'Reminders OFF'}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={handleTestReminder}
                    disabled={testReminderLoading || !selectedTestUser}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {testReminderLoading ? 'Sending...' : 'Send Test Reminder'}
                  </button>
                </div>
                
                {/* Test Email Connection Button */}
                <div className="mt-4">
                  <button
                    onClick={handleTestEmailConnection}
                    disabled={testConnectionLoading}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {testConnectionLoading ? 'Testing...' : 'Test Email Connection'}
                  </button>
                  <p className="text-xs text-gray-300 mt-1">Check SMTP configuration and connection</p>
                </div>
              </div>
            )}

            {/* Profile Actions */}
            <div className="mt-8 flex flex-col gap-4">
              <button
                onClick={() => navigate('/avatar-editor')}
                className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow text-white font-semibold"
              >
                <IconWrapper icon={FaPalette} size={18} className="mr-2" />
                Choose Your Avatar
              </button>
              <button
                onClick={() => navigate('/reset-password')}
                className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow text-white font-semibold"
              >
                {FaKey({ className: "mr-2", size: 18 })}
                Reset Password
              </button>
              <button
                onClick={handleDeleteAccount}
                className="flex items-center px-4 py-2 bg-gray-800 hover:bg-red-700 rounded-lg transition-colors shadow text-white font-semibold disabled:opacity-60"
                disabled={deleting}
              >
                <span className="mr-2">🗑️</span>
                {deleting ? 'Deleting...' : 'Delete Account'}
              </button>
              {deleteError && <div className="text-red-400 text-sm mt-2">{deleteError}</div>}
            </div>
              <p className="text-sm text-white/70 mt-2">
                You will need to re-authenticate to change your password.
              </p>
          </div>

          {/* Leagues Section */}
          <div className="backdrop-blur-lg bg-white/2 rounded-2xl p-8 border border-white/10 shadow-xl">
            <h2 className="text-2xl font-bold mb-6 flex items-center text-white/90">
              {FaTrophy({ className: "mr-2", size: 22 })}
              Your Leagues
            </h2>
            
            {/* Active/Past Tabs */}
            {!loading && leagues.length > 0 && (
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setActiveTab('active')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                    activeTab === 'active'
                      ? 'bg-red-600 text-white'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  Active
                </button>
                <button
                  onClick={() => setActiveTab('past')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                    activeTab === 'past'
                      ? 'bg-red-600 text-white'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  Past
                </button>
              </div>
            )}

            {loading ? (
              <div className="text-white/70">Loading leagues...</div>
            ) : error ? (
              <div className="text-red-500">{error}</div>
            ) : leagues.length === 0 ? (
              <div className="text-white/70">You are not part of any leagues yet.</div>
            ) : (
              <div className="space-y-4">
                {leagues
                  .filter(league => 
                    activeTab === 'active' 
                      ? league.seasonStatus === 'active' 
                      : league.seasonStatus === 'completed'
                  )
                  .map((league) => {
                    const isPastLeague = league.seasonStatus === 'completed';
                    return (
                      <div
                        key={league._id}
                        className={`flex items-center justify-between bg-white/10 p-4 rounded-lg border border-white/10 transition-colors ${
                          isPastLeague 
                            ? 'cursor-pointer hover:bg-white/20' 
                            : 'cursor-pointer hover:bg-white/20'
                        }`}
                        onClick={() => {
                          if (isPastLeague) {
                            setSelectedPastLeague({
                              id: league._id,
                              name: league.name,
                              season: league.season
                            });
                          } else {
                            navigate(`/league/${league._id}`);
                          }
                        }}
                      >
                        <div className="flex items-center space-x-4">
                          <span className="font-semibold text-white/90">{league.name}</span>
                          <span className="text-sm text-white/70">Season {league.season}</span>
                          {league.owner === user.id && (
                            <span className="text-xs bg-emerald-400 text-white px-2 py-1 rounded">Owner</span>
                          )}
                          {isPastLeague && (
                            <span className="text-xs bg-gray-500 text-white px-2 py-1 rounded">Completed</span>
                          )}
                        </div>
                        <div className="flex items-center space-x-4">
                          {isPastLeague ? (
                            <span className="text-sm text-white/70">View Results →</span>
                          ) : (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/league/${league._id}`);
                                }}
                                className="text-blue-400 hover:text-blue-300 transition-colors"
                                title="View League"
                              >
                                <IconWrapper icon={FaEye} size={16} />
                              </button>
                              {league.owner !== user.id && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setAbandoningLeagueId(league._id);
                                  }}
                                  className="text-yellow-400 hover:text-yellow-300 transition-colors"
                                  title="Abandon League"
                                >
                                  <IconWrapper icon={FaSignOutAlt} size={16} />
                                </button>
                              )}
                              {league.owner === user.id && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteLeague(league._id);
                                  }}
                                  disabled={deleting}
                                  className="text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                                  title="Delete League"
                                >
                                  <IconWrapper icon={FaTrash} size={16} />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                
                {/* Show message if no leagues in selected tab */}
                {leagues.filter(league => 
                  activeTab === 'active' 
                    ? league.seasonStatus === 'active' 
                    : league.seasonStatus === 'completed'
                ).length === 0 && (
                  <div className="text-white/70 text-center py-8">
                    {activeTab === 'active' 
                      ? 'No active leagues' 
                      : 'No past leagues'}
                  </div>
                )}
              </div>
            )}

            {/* Past League Results Modal */}
            {selectedPastLeague && (
              <PastLeagueResultsModal
                leagueId={selectedPastLeague.id}
                leagueName={selectedPastLeague.name}
                season={selectedPastLeague.season}
                isOpen={!!selectedPastLeague}
                onClose={() => setSelectedPastLeague(null)}
              />
            )}
            {/* Abandon League Modal */}
            {abandoningLeagueId && (
              <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-60">
                <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
                  <h3 className="text-xl font-bold mb-4 text-gray-900">Abandon League</h3>
                  <p className="mb-6 text-gray-800">Are you sure you want to abandon this league? This will erase all your entries for this league. This action cannot be undone.</p>
                  {abandonError && <div className="text-red-500 mb-2">{abandonError}</div>}
                  {abandonSuccess && <div className="text-green-600 mb-2">{abandonSuccess}</div>}
                  <div className="flex justify-end gap-4">
                    <button
                      onClick={() => setAbandoningLeagueId(null)}
                      className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded text-gray-800"
                      disabled={abandonLoading}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleAbandonLeague(abandoningLeagueId)}
                      className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 rounded text-white font-semibold disabled:opacity-60"
                      disabled={abandonLoading}
                    >
                      {abandonLoading ? 'Leaving...' : 'Abandon League'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          </div>

          {/* App Admin: All Leagues Section */}
          {user.isAppAdmin && (
          <div className="w-full md:max-w-2xl mt-8 md:mt-0">
            <div className="backdrop-blur-lg bg-white/2 rounded-2xl p-6 border border-white/10 shadow-xl mx-auto" style={{ maxWidth: 600 }}>
              <h2 className="text-2xl font-bold mb-6 flex items-center text-white/90 border-b border-white/10 pb-3">
                <IconWrapper icon={FaSyncAlt} size={22} className="mr-2" />
                Admin Dashboard
              </h2>
              {adminLoading ? (
                <div className="text-white/70 flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white/70"></div>
                  <span className="ml-3">Loading leagues...</span>
                </div>
              ) : adminError ? (
                <div className="text-red-500 bg-red-500/10 p-4 rounded-lg border border-red-500/20">{adminError}</div>
              ) : allLeagues.length === 0 ? (
                <div className="text-white/70 text-center py-8">No leagues found.</div>
              ) : (
                <div className="space-y-4">
                  {allLeagues.map((league) => (
                    <div
                      key={league._id}
                      className="flex flex-col md:flex-row md:flex-wrap items-center justify-between bg-white/10 p-3 rounded-lg border border-white/10 shadow-md md:space-x-2 space-y-2 md:space-y-0 transition-all duration-200 hover:bg-white/15 min-h-[70px]"
                    >
                      {/* League Info */}
                      <div className="flex flex-col justify-center min-w-[120px]">
                        <span className="font-semibold text-white/90 text-base leading-tight">{league.name}</span>
                        <span className="text-xs text-white/70 leading-tight">Season {league.season}</span>
                        <span className="text-xs text-white/50 leading-tight">Code: {league.code}</span>
                      </div>
                      {/* Center: Round input + Assign Real Points and Update Board */}
                      <div className="flex flex-row items-center flex-1 justify-center gap-1">
                        <input
                          type="number"
                          value={selectedRound}
                          onChange={(e) => setSelectedRound(e.target.value)}
                          placeholder="#"
                          className="px-2 py-1 rounded bg-white/20 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:border-red-500 w-14 text-center text-sm"
                          min="1"
                          max="24"
                        />
                        <button
                          onClick={() => handleAssignRealPoints(league._id)}
                          disabled={adminLoading || !selectedRound}
                          className="flex items-center justify-center min-w-[120px] h-10 bg-green-600 hover:bg-green-700 rounded-lg transition-all shadow text-white font-semibold disabled:opacity-60 text-sm"
                        >
                          <IconWrapper icon={FaSyncAlt} size={14} className="mr-2" />
                          Assign Points
                        </button>
                        <button
                          onClick={() => handleUpdateLeaderboard(league._id, league.season)}
                          className="flex items-center justify-center min-w-[120px] h-10 bg-red-600 hover:bg-red-700 rounded-lg transition-all shadow text-white font-semibold disabled:opacity-60 text-sm"
                        >
                          <IconWrapper icon={FaSyncAlt} size={14} className="mr-2" />
                          Update Board
                        </button>
                      </div>
                    </div>
                  ))}
                  {/* Update All Races Button Section */}
                  <div className="mt-6 bg-white/5 rounded-xl p-4 border border-white/10">
                    <h3 className="text-lg font-bold mb-2 text-white/90 flex items-center">
                      <IconWrapper icon={FaSyncAlt} size={16} className="mr-2" />
                      Race Results
                    </h3>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={handleScrapeAllRaces}
                        disabled={adminLoading}
                        className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-lg hover:scale-[1.02] flex items-center justify-center w-44 h-10"
                      >
                        {adminLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                            Updating...
                          </>
                        ) : (
                          <>
                          <IconWrapper icon={FaSyncAlt} size={16} className="mr-2" />
                            Update All Races
                          </>
                        )}
                      </button>
                      {scrapeStatus && (
                        <div className="text-green-400 text-sm bg-green-500/10 p-2 rounded-lg border border-green-500/20">
                          {scrapeStatus}
                        </div>
                      )}
                      {adminError && (
                        <div className="text-red-500 text-sm bg-red-500/10 p-2 rounded-lg border border-red-500/20">
                          {adminError}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Avatar Testing Section */}
              <div className="mt-6 bg-white/5 rounded-xl p-4 border border-white/10">
                <h3 className="text-lg font-bold mb-4 text-white/90 flex items-center">
                  <IconWrapper icon={FaPalette} size={16} className="mr-2" />
                  Avatar Testing (Admin Only)
                </h3>
                <div className="text-sm text-white/70 mb-4">
                  Test the helmet customization feature. This section is only visible to admins.
                </div>
                <AvatarTestingPanel />
              </div>
            </div>
            </div>
          )}
      </div>
    </div>
  );
};

export default ProfilePage; 