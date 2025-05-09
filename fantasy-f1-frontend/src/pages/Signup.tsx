import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaUser, FaEnvelope, FaLock, FaTrophy, FaChartLine, FaCar } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

// Move FeatureBox outside Signup
const FeatureBox: React.FC<{ icon: React.FC<{ size?: number; className?: string }>; title: string; description: string }> = ({ icon: Icon, title, description }) => (
  <div className="backdrop-blur-xl bg-white/10 rounded-lg p-4 border border-white/10 w-[180px] h-[120px] flex flex-col justify-center">
    <div className="flex flex-col items-center text-center">
      <Icon size={24} className="text-red-500 mb-2" />
      <h3 className="text-white text-base font-semibold mb-1">{title}</h3>
      <p className="text-white/80 text-xs">{description}</p>
    </div>
  </div>
);

const Signup: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setError('');
    setSuccess('');

    try {
      const result = await signup(username, email, password);
      setSuccess(result.message);
      // Redirect to Welcome page after 2 seconds
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during signup');
    }
  };

  const TypedUserIcon = FaUser as unknown as React.FC<{ size?: number; className?: string }>;
  const TypedEnvelopeIcon = FaEnvelope as unknown as React.FC<{ size?: number; className?: string }>;
  const TypedLockIcon = FaLock as unknown as React.FC<{ size?: number; className?: string }>;
  const TypedTrophyIcon = FaTrophy as unknown as React.FC<{ size?: number; className?: string }>;
  const TypedChartIcon = FaChartLine as unknown as React.FC<{ size?: number; className?: string }>;
  const TypedCarIcon = FaCar as unknown as React.FC<{ size?: number; className?: string }>;

  return (
    <>
      {/* Background wrapper */}
      <div 
        className="fixed inset-0 w-full h-full"
        style={{
          backgroundImage: 'url("/background1.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center bottom',
          backgroundRepeat: 'no-repeat'
        }}
      />

      {/* Content wrapper */}
      <div className="relative min-h-screen flex">
        {/* Semi-transparent overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-30" />

        {/* Signup container */}
        <div className="relative z-10 w-full md:w-[400px] p-4 md:p-8 flex items-center">
          <div className="w-full backdrop-blur-xl bg-white/20 rounded-xl p-8 border border-white/10">
            <div className="text-center mb-8">
              <h1 className="flex flex-col gap-2">
                <span className="text-xl font-medium text-white/80">Join</span>
                <span className="text-3xl font-bold text-red-500 animate-pulse drop-shadow-[0_0_10px_rgba(239,68,68,0.7)] [text-shadow:_2px_2px_0_rgb(0_0_0),_-2px_-2px_0_rgb(0_0_0),_2px_-2px_0_rgb(0_0_0),_-2px_2px_0_rgb(0_0_0)]">
                  FantasyF1thegame
                </span>
              </h1>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}
            {success && (
              <div className="rounded-md bg-green-50 p-4">
                <div className="text-sm text-green-700">{success}</div>
              </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-white/90">
                  Username
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <TypedUserIcon size={20} className="text-white/60" />
                  </div>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 bg-black/10 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent placeholder-white/40 text-white sm:text-sm backdrop-blur-sm"
                    placeholder="Choose a username"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-white/90">
                  Email address
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <TypedEnvelopeIcon size={20} className="text-white/60" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 bg-black/10 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent placeholder-white/40 text-white sm:text-sm backdrop-blur-sm"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-white/90">
                  Password
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <TypedLockIcon size={20} className="text-white/60" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 bg-black/10 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent placeholder-white/40 text-white sm:text-sm backdrop-blur-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-white/90">
                  Confirm Password
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <TypedLockIcon size={20} className="text-white/60" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 bg-black/10 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent placeholder-white/40 text-white sm:text-sm backdrop-blur-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md text-sm font-semibold text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 transition-colors backdrop-blur-sm"
                >
                  Sign up
                </button>
              </div>

              <div className="text-center">
                <Link
                  to="/"
                  className="text-sm text-white/80 hover:text-white transition-colors"
                >
                  Already have an account? Sign in
                </Link>
              </div>
            </form>
          </div>
        </div>

        {/* Feature boxes container */}
        <div className="hidden md:block flex-grow relative z-10">
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
            <div className="flex gap-12">
              <FeatureBox
                icon={TypedChartIcon}
                title="Track Performance"
                description="Get detailed stats and insights"
              />
              <FeatureBox
                icon={TypedTrophyIcon}
                title="Compete & Win"
                description="Join leagues and climb the leaderboard"
              />
              <FeatureBox
                icon={TypedCarIcon}
                title="Race Strategy"
                description="Make decisions based on live data"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Signup; 