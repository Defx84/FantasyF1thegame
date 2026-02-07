import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { FaBars, FaArrowLeft, FaUser, FaHome, FaUsers, FaSignOutAlt, FaTimes } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { getUserLeagues, League } from '../services/leagueService';
import OverlayLoader from './OverlayLoader';
import Footer from './Footer';

const EXCLUDED_PATHS = ['/', '/dashboard', '/welcome'];

const AppLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, loading } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [leaguesOpen, setLeaguesOpen] = useState(false);

  // Hide nav on excluded pages
  const hideNav = EXCLUDED_PATHS.includes(location.pathname);

  // Back button: go back or to dashboard
  // Ensures coherent navigation behavior throughout the app
  const handleBack = () => {
    const pathname = location.pathname;
    const searchParams = new URLSearchParams(location.search);
    
    // Case 1: League detail page with deck tab active (state-based navigation)
    // This is a special case because deck view is shown via URL param, not a separate route
    const leagueDetailMatch = pathname.match(/^\/league\/([^/]+)$/);
    const isDeckTab = searchParams.get('tab') === 'deck';
    
    if (leagueDetailMatch && isDeckTab) {
      // Navigate back to league overview (remove tab param)
      navigate(`/league/${leagueDetailMatch[1]}`, { replace: true });
      return;
    }
    
    // Case 2: Race detail (inside a specific race) → back to Race History
    const raceDetailMatch = pathname.match(/^\/league\/([^/]+)\/race\/(\d+)$/);
    if (raceDetailMatch) {
      const leagueId = raceDetailMatch[1];
      navigate(`/league/${leagueId}/race/history`, { replace: false });
      return;
    }

    // Case 3: Other league sub-pages (race/history, standings, grid, briefing, statistics)
    // Navigate back to parent league overview
    const leagueSubPageMatch = pathname.match(/^\/league\/([^/]+)\/(.+)$/);
    if (leagueSubPageMatch) {
      const leagueId = leagueSubPageMatch[1];
      navigate(`/league/${leagueId}`, { replace: false });
      return;
    }
    
    // Case 4: For other pages (profile, rules, info, etc.), use normal back navigation
    // Check if we have sufficient history to go back
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      // No history or minimal history, go to dashboard as safe fallback
      navigate('/dashboard');
    }
  };

  // Menu actions
  const handleMenuClick = (path: string) => {
    setMenuOpen(false);
    navigate(path);
  };

  // Handle menu open/close with animation
  const openMenu = () => {
    setIsClosing(false);
    setMenuOpen(true);
  };
  const closeMenu = () => {
    setIsClosing(true);
    setTimeout(() => {
      setMenuOpen(false);
      setIsClosing(false);
    }, 300); // match animation duration
  };

  // Fetch user leagues when menu opens
  React.useEffect(() => {
    if (menuOpen && leagues.length === 0) {
      getUserLeagues().then(setLeagues).catch(() => setLeagues([]));
    }
  }, [menuOpen, leagues.length]);

  return (
    <div className="relative min-h-screen w-full">
      {loading && <OverlayLoader />}
      {/* Top bar */}
      {!hideNav && (
        <div className="fixed top-0 left-0 w-full flex justify-between items-center z-50 px-4 py-3 pointer-events-none">
          {/* Back button */}
          <button
            className="pointer-events-auto text-white text-2xl p-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-lg hover:bg-white/20 transition"
            style={{ boxShadow: '0 4px 24px 0 rgba(0,0,0,0.15)' }}
            onClick={handleBack}
          >
            {FaArrowLeft({ className: "" })}
          </button>
          {/* Hamburger */}
          <button
            className="pointer-events-auto text-white text-2xl p-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-lg hover:bg-white/20 transition"
            style={{ boxShadow: '0 4px 24px 0 rgba(0,0,0,0.15)' }}
            onClick={openMenu}
          >
            {FaBars({ className: "" })}
          </button>
        </div>
      )}

      {/* Drawer menu */}
      {(menuOpen || isClosing) && (
        <div className="fixed inset-0 z-50 flex items-center justify-end">
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/40"
            onClick={closeMenu}
          />
          {/* Drawer */}
          <div className={`w-72 h-auto py-8 mx-4 bg-white/20 backdrop-blur-lg rounded-2xl border border-white/20 shadow-xl flex flex-col p-6 relative ${isClosing ? 'animate-slide-out-right' : 'animate-slide-in-right'}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold tracking-wide text-white select-none">
                <span className="text-white">thefantasy</span><span className="text-red-500">F1</span><span className="text-white">game</span>
              </h2>
              <button
                className="text-white text-xl ml-2"
                onClick={closeMenu}
              >
                {FaTimes({ className: "" })}
              </button>
            </div>
            <nav className="flex flex-col gap-6 mt-2">
              <button
                className="flex items-center gap-3 text-white text-lg hover:text-red-400 transition px-2 py-2 rounded-lg hover:bg-white/10"
                onClick={() => handleMenuClick('/profile')}
              >
                {FaUser({ className: "text-red-500" })} Profile
              </button>
              <button
                className="flex items-center gap-3 text-white text-lg hover:text-red-400 transition px-2 py-2 rounded-lg hover:bg-white/10"
                onClick={() => handleMenuClick('/dashboard')}
              >
                {FaHome({ className: "text-red-500" })} Home
              </button>
              <button
                className="flex items-center gap-3 text-white text-lg hover:text-red-400 transition px-2 py-2 rounded-lg hover:bg-white/10 relative"
                onClick={() => setLeaguesOpen((open) => !open)}
                type="button"
              >
                {FaUsers({ className: "text-red-500" })} My League
              </button>
              {leaguesOpen && (
                <div className="ml-8 mt-2 flex flex-col gap-2 bg-white/10 rounded-lg p-2 shadow-lg animate-slide-in-right">
                  {(() => {
                    const currentYear = new Date().getFullYear();
                    // Filter to show only active leagues (current season or future)
                    const activeLeagues = leagues.filter(league => league.season >= currentYear);
                    
                    if (activeLeagues.length === 0) {
                      return (
                        <span className="text-white/60 text-sm">No active leagues found</span>
                      );
                    }
                    
                    return activeLeagues.map((league) => (
                      <button
                        key={league._id}
                        className="text-white text-left px-2 py-1 rounded transition hover:bg-blue-700/60"
                        onClick={() => {
                          setMenuOpen(false);
                          setLeaguesOpen(false);
                          navigate(`/league/${league._id}`);
                        }}
                      >
                        {league.name}
                      </button>
                    ));
                  })()}
                </div>
              )}
              <button
                className="flex items-center gap-3 text-white text-lg hover:text-red-400 transition px-2 py-2 rounded-lg hover:bg-white/10"
                onClick={logout}
              >
                {FaSignOutAlt({ className: "text-red-500" })} Logout
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="pt-16 min-h-screen flex flex-col">
        <div className="flex-1">
          {children}
          <Outlet />
        </div>
        <Footer />
      </div>
    </div>
  );
};

export default AppLayout; 