import React, { useState, memo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaEnvelope, FaLock, FaTrophy, FaChartLine, FaCar, FaInstagram, FaTimes, FaLayerGroup } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const TypedEnvelopeIcon = FaEnvelope as unknown as React.FC<{ size?: number; className?: string }>;
const TypedLockIcon = FaLock as unknown as React.FC<{ size?: number; className?: string }>;
const TypedTrophyIcon = FaTrophy as unknown as React.FC<{ size?: number; className?: string }>;
const TypedChartIcon = FaChartLine as unknown as React.FC<{ size?: number; className?: string }>;
const TypedCarIcon = FaCar as unknown as React.FC<{ size?: number; className?: string }>;
const TypedInstagramIcon = FaInstagram as unknown as React.FC<{ size?: number; className?: string }>;
const TypedTimesIcon = FaTimes as unknown as React.FC<{ size?: number; className?: string }>;
const TypedLayerGroupIcon = FaLayerGroup as unknown as React.FC<{ size?: number; className?: string }>;

const FeatureBox = memo(({ icon: Icon, title, description }: { 
  icon: React.FC<{ size?: number; className?: string }>; 
  title: string; 
  description: string;
}) => (
  <div className="backdrop-blur-xl bg-white/10 rounded-lg p-4 border border-white/10 w-[180px] h-[120px] flex flex-col justify-center">
    <div className="flex flex-col items-center text-center">
      <Icon size={24} className="text-red-500 mb-2" />
      <h3 className="text-white text-base font-semibold mb-1">{title}</h3>
      <p className="text-white/80 text-xs">{description}</p>
    </div>
  </div>
));

FeatureBox.displayName = 'FeatureBox';

const Welcome: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Background wrapper - desktop: center top so logo isn't cut; mobile: overridden in CSS */}
      <div 
        className="fixed inset-0 bg-black welcome-bg welcome-bg-desktop"
        style={{
          backgroundImage: 'url("/Background_Ultrawide2.0.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
          backgroundRepeat: 'no-repeat',
          width: '100vw',
          height: '100vh',
          minWidth: '100%',
          minHeight: '100%',
          left: 0,
          top: 0,
          right: 0,
          bottom: 0
        }}
      />

      {/* Content wrapper - desktop only: top padding so logo/title not cut */}
      <div className="relative min-h-screen h-full overflow-x-hidden flex flex-col md:flex-row md:pt-8">
        {/* Semi-transparent overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-30 pointer-events-none" />

        {/* Login container */}
        <div className="relative z-10 w-full md:w-[400px] p-4 md:p-8 flex items-center">
          <div className="w-full backdrop-blur-xl bg-white/20 rounded-xl p-8 border border-white/10">
            <div className="text-center mb-4">
              <h1 className="flex flex-col gap-2">
                <span className="text-xl font-medium text-white/80">Welcome to</span>
                <span className="text-3xl font-bold animate-pulse drop-shadow-[0_0_10px_rgba(239,68,68,0.7)] [text-shadow:_2px_2px_0_rgb(0_0_0),_-2px_-2px_0_rgb(0_0_0),_2px_-2px_0_rgb(0_0_0),_-2px_2px_0_rgb(0_0_0)]">
                  <span className="text-white">theFantasy</span>
                  <span className="text-red-500">F1</span>
                  <span className="text-white">game</span>
                </span>
                <button
                  onClick={() => setShowHowToPlay(true)}
                  className="button-shine mt-3 w-full flex justify-center py-3 px-4 border border-transparent rounded-md text-sm font-semibold text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors backdrop-blur-sm relative"
                >
                  <span className="relative z-10">How to play</span>
                </button>
                <div className="mt-4 text-center">
                  <p className="text-sm text-white/80 mb-2">Follow us on Instagram</p>
                  <a
                    href="https://instagram.com/thefantasyf1game"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram @thefantasyf1game"
                    title="Follow us on Instagram"
                    className="inline-block"
                  >
                    <TypedInstagramIcon
                      size={28}
                      className="text-pink-500 hover:scale-110 transition-transform duration-150"
                    />
                  </a>
                </div>
              </h1>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
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
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 bg-black/10 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent placeholder-white/40 text-white sm:text-sm backdrop-blur-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {error && (
                <div className="text-red-300 text-sm bg-red-900/20 rounded-md px-3 py-2 backdrop-blur-sm">
                  {error}
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="button-shine w-full flex justify-center py-3 px-4 border border-transparent rounded-md text-sm font-semibold text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 transition-colors backdrop-blur-sm relative"
                >
                  <span className="relative z-10">{loading ? 'Signing in...' : 'Sign in'}</span>
                </button>
              </div>

              <div className="text-center">
                <Link
                  to="/forgot-password"
                  className="text-sm text-white/80 hover:text-white transition-colors"
                >
                  Forgot your password?
                </Link>
              </div>
            </form>

            <div className="mt-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 text-white/60 bg-black/20 rounded-full backdrop-blur-sm">Or</span>
                </div>
              </div>

              <div className="mt-4 text-center">
                <p className="text-sm text-white/80">
                  Don't have an account?{' '}
                  <Link
                    to="/signup"
                    className="font-medium text-red-400 hover:text-red-300 transition-colors"
                  >
                    Sign up
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Feature boxes container - positioned at three locations with consistent spacing */}
        <div className="hidden md:block flex-grow relative z-10">
          {/* Top-right box - 25% from top */}
          <div className="absolute right-8" style={{ top: '25%', transform: 'translateY(-50%)' }}>
              <FeatureBox
                icon={TypedLayerGroupIcon}
                title="Power Cards"
                description="build your own deck and boost your performance"
              />
          </div>
          
          {/* Middle-right box - 50% from top (centered) */}
          <div className="absolute top-1/2 right-8 -translate-y-1/2">
              <FeatureBox
                icon={TypedTrophyIcon}
                title="Competition"
                description="Create or join a league with your friends."
              />
          </div>
          
          {/* Bottom-right box - 75% from top */}
          <div className="absolute right-8" style={{ top: '75%', transform: 'translateY(-50%)' }}>
              <FeatureBox
                icon={TypedCarIcon}
                title="Race Strategy"
                description="Plan your strategy. Use all the tools at your own advantage"
              />
            </div>
          </div>
        
      </div>

      {/* How to Play Overlay */}
      {showHowToPlay && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setShowHowToPlay(false)}
        >
          {/* Semi-transparent backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          
          {/* Content box */}
          <div 
            className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto backdrop-blur-xl bg-white/20 rounded-xl p-8 border border-white/20 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setShowHowToPlay(false)}
              className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
              aria-label="Close"
            >
              <TypedTimesIcon size={24} />
            </button>

            {/* Content */}
            <div className="text-white space-y-6">
              <h2 className="text-3xl font-bold text-center mb-2">
                TheFantasy<span className="text-red-500">F1</span>game — How to play
              </h2>
              
              <div className="space-y-4 text-base">
                <div className="space-y-3">
                  <div>
                    <h3 className="font-bold text-lg mb-2">🔹 Pick Smart</h3>
                    <ul className="list-disc list-outside space-y-1 text-white/90 pl-5">
                      <li>For every race, choose 1 Main Driver, 1 Reserve Driver, and 1 Team</li>
                      <li>Selections lock 5 minutes before qualifying.</li>
                      <li>You can't reuse drivers or teams until the full list is exhausted — long-term planning matters.</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-bold text-lg mb-2">🔹 Play Power Cards</h3>
                    <ul className="list-disc list-outside space-y-1 text-white/90 pl-5">
                      <li>Build your Power Card deck to gain strategic advantages</li>
                      <li>Use them wisely during race weekends to boost or alter your score</li>
                      <li>No Power Cards during sprint weekends — pure performance only</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-bold text-lg mb-2">🔹 Real F1 Points</h3>
                    <ul className="list-disc list-outside space-y-1 text-white/90 pl-5">
                      <li>Scores are based on real Formula 1 results</li>
                      <li>Main Driver scores race points</li>
                      <li>Reserve Driver steps in if your main driver doesn't start</li>
                      <li>Teams score independently from your driver choices</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-bold text-lg mb-2">🔹 Sprint Weekends Change Everything</h3>
                    <ul className="list-disc list-outside space-y-1 text-white/90 pl-5">
                      <li>Reserve Driver scores Sprint Race points</li>
                      <li>Main Driver scores Grand Prix points</li>
                      <li>Teams collect both Sprint + Race points</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-bold text-lg mb-2">🔹 Compete Across the Season</h3>
                    <ul className="list-disc list-outside space-y-1 text-white/90 pl-5">
                      <li>Every league has:</li>
                      <li className="ml-4">🏆 Driver Championship</li>
                      <li className="ml-4">🏆 Constructor Championship</li>
                      <li>Points update automatically after each race</li>
                      <li>Strategy across the season is just as important as race-day picks</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-bold text-lg mb-2">🔹 Play With Friends -</h3>
                    <ul className="list-disc list-outside space-y-1 text-white/90 pl-5">
                      <li>Sign up</li>
                      <li>Choose your avatar</li>
                      <li>Create or join a league</li>
                      <li>Share a league code and compete head-to-head</li>
                      <li>Explore all the features</li>
                    </ul>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/20 text-center">
                  <p className="text-white font-semibold">
                    For the full rules and to start playing, simply sign in, unlock the complete game mechanics and start playing.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Welcome; 