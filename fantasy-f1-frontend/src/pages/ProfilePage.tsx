import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserLeagues, League, deleteLeague, abandonLeague } from '../services/leagueService';
import { FaUser, FaEnvelope, FaTrophy, FaKey, FaArrowLeft, FaTrash, FaSignOutAlt, FaEye } from 'react-icons/fa';
import IconWrapper from '../utils/iconWrapper';
import axios from 'axios';

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

    fetchLeagues();
  }, []);

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
      await axios.delete('/api/auth/delete', {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
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

      {/* Content wrapper */}
      <div className="relative z-10 min-h-screen flex flex-col items-start justify-center p-4 md:p-8 ml-0 md:ml-16">
        <div className="w-full max-w-lg">
          {/* Profile Header */}
          <div className="backdrop-blur-lg bg-white/2 rounded-2xl p-8 mb-8 border border-white/10 shadow-xl">
            <h1 className="text-3xl font-bold mb-6 text-white/90">Profile</h1>
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
            {/* Reset Password Button */}
            <div className="mt-8 flex flex-col gap-4">
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
            {loading ? (
              <div className="text-white/70">Loading leagues...</div>
            ) : error ? (
              <div className="text-red-500">{error}</div>
            ) : leagues.length === 0 ? (
              <div className="text-white/70">You are not part of any leagues yet.</div>
            ) : (
              <div className="space-y-4">
                {leagues.map((league) => (
                  <div
                    key={league._id}
                    className="flex items-center justify-between bg-white/10 p-4 rounded-lg border border-white/10 cursor-pointer hover:bg-white/20 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <span className="font-semibold text-white/90">{league.name}</span>
                      <span className="text-sm text-white/70">Season {league.season}</span>
                      {league.owner === user.id && (
                        <span className="text-xs bg-emerald-400 text-white px-2 py-1 rounded">Owner</span>
                      )}
                    </div>
                    <div className="flex items-center space-x-4">
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
                    </div>
                  </div>
                ))}
              </div>
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
      </div>
    </div>
  );
};

export default ProfilePage; 