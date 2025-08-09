import React, { useState, memo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaEnvelope, FaLock, FaTrophy, FaChartLine, FaCar, FaInstagram } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import Footer from '../components/Footer';

const TypedEnvelopeIcon = FaEnvelope as unknown as React.FC<{ size?: number; className?: string }>;
const TypedLockIcon = FaLock as unknown as React.FC<{ size?: number; className?: string }>;
const TypedTrophyIcon = FaTrophy as unknown as React.FC<{ size?: number; className?: string }>;
const TypedChartIcon = FaChartLine as unknown as React.FC<{ size?: number; className?: string }>;
const TypedCarIcon = FaCar as unknown as React.FC<{ size?: number; className?: string }>;
const TypedInstagramIcon = FaInstagram as unknown as React.FC<{ size?: number; className?: string }>;

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
      <div className="relative min-h-screen flex flex-col md:flex-row">
        {/* Semi-transparent overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-30" />

        {/* Login container */}
        <div className="relative z-10 w-full md:w-[400px] p-4 md:p-8 flex items-center">
          <div className="w-full backdrop-blur-xl bg-white/20 rounded-xl p-8 border border-white/10">
            <div className="text-center mb-8">
              <h1 className="flex flex-col gap-2">
                <span className="text-xl font-medium text-white/80">Welcome to</span>
                <span className="text-3xl font-bold animate-pulse drop-shadow-[0_0_10px_rgba(239,68,68,0.7)] [text-shadow:_2px_2px_0_rgb(0_0_0),_-2px_-2px_0_rgb(0_0_0),_2px_-2px_0_rgb(0_0_0),_-2px_2px_0_rgb(0_0_0)]">
                  <span className="text-white">TheFantasy</span>
                  <span className="text-red-500">F1</span>
                  <span className="text-white">game</span>
                </span>
                <div className="flex justify-center mt-2">
                  <a
                    href="https://instagram.com/thefantasyf1game"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram @thefantasyf1game"
                    title="Follow us on Instagram"
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
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md text-sm font-semibold text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 transition-colors backdrop-blur-sm"
                >
                  {loading ? 'Signing in...' : 'Sign in'}
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

            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 text-white/60 bg-black/20 rounded-full backdrop-blur-sm">Or</span>
                </div>
              </div>

              <div className="mt-6 text-center">
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
      
      {/* Footer - positioned outside main flex container for proper mobile display */}
      <div className="relative z-10">
        <Footer />
      </div>
    </>
  );
};

export default Welcome; 