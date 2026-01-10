import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useParams } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import ScrollToTop from './components/ScrollToTop';
import Dashboard from './pages/Dashboard';
import Signup from './pages/Signup';
import Welcome from './pages/Welcome';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import LeagueDetails from './pages/LeagueDetails';
import NextRaceSelections from './pages/NextRaceSelections';
import RaceHistory from './pages/RaceHistory';
import RaceDetails from './pages/RaceDetails';
import Standings from './pages/Standings';
import GridPage from './pages/GridPage';
import ProfilePage from './pages/ProfilePage';
import AvatarEditor from './pages/AvatarEditor';
import Rules from './pages/Rules';
import Statistics from './pages/Statistics';
import OpponentsBriefing from './pages/OpponentsBriefing';
import Info from './pages/Info';
import { getNextRaceTiming } from './services/raceService';
import { getLeagueStandings } from './services/leagueService';
import { getRaceSelections } from './services/selectionService';
import { getRaceCards } from './services/cardService';
import { Player } from './types/player';
import './App.css';
import AppLayout from './components/AppLayout';

interface GridData {
  players: Player[];
  raceData: any;
  leaderboard: Record<string, number>;
  currentRace: number;
}

const GridPageWrapper: React.FC = () => {
  const { leagueId } = useParams<{ leagueId: string }>();
  const [data, setData] = useState<GridData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (leagueId && user) {
      const fetchData = async () => {
        try {
          const raceData = await getNextRaceTiming();
          console.log('Race data:', raceData);

          // Get race selections for the current race
          const raceSelections = await getRaceSelections(leagueId, raceData.round);
          console.log('Race selections:', raceSelections);

          // Get league standings
          const leagueStandings = await getLeagueStandings(leagueId, new Date().getFullYear());
          console.log('League standings:', leagueStandings);

          // Check if this is a 2026+ league (cards only available for 2026+)
          const leagueSeason = leagueStandings.season || new Date().getFullYear();
          const isCardSeason = leagueSeason >= 2026;

          // Transform selections data into player format using league standings
          const playersWithSelections = await Promise.all(
            leagueStandings.driverStandings.map(async (standing) => {
              const userSelection = raceSelections.selections.find(s => s.username === standing.user.username);
              
              const basePlayer = {
                id: standing.user._id,
                username: standing.user.username,
                selectionMade: !!(
                  userSelection?.mainDriver &&
                  userSelection?.reserveDriver &&
                  userSelection?.team
                ),
                selections: {
                  mainDriver: userSelection?.mainDriver || null,
                  reserveDriver: userSelection?.reserveDriver || null,
                  team: userSelection?.team || null
                },
                selectionId: userSelection?._id || undefined
              };

              // Fetch card selections if we have a selection ID (for 2026+ seasons only)
              let cards = undefined;
              if (isCardSeason && userSelection?._id) {
                try {
                  const raceCards = await getRaceCards(userSelection._id);
                  console.log(`[GridPage] Cards for ${standing.user.username}:`, raceCards);
                  if (raceCards.raceCardSelection) {
                    // Use transformed cards if available (for Mystery/Random), otherwise use original
                    const driverCard = raceCards.raceCardSelection.mysteryTransformedCard || 
                                     raceCards.raceCardSelection.driverCard;
                    const teamCard = raceCards.raceCardSelection.randomTransformedCard || 
                                   raceCards.raceCardSelection.teamCard;
                    
                    cards = {
                      driverCard: driverCard,
                      teamCard: teamCard,
                      mysteryTransformedCard: raceCards.raceCardSelection.mysteryTransformedCard,
                      randomTransformedCard: raceCards.raceCardSelection.randomTransformedCard
                    };
                    console.log(`[GridPage] Processed cards for ${standing.user.username}:`, cards);
                  } else {
                    console.log(`[GridPage] No raceCardSelection found for ${standing.user.username}`);
                  }
                } catch (error) {
                  // No cards selected yet, that's okay
                  console.log(`[GridPage] No cards found for ${standing.user.username}:`, error);
                }
              } else {
                console.log(`[GridPage] Skipping cards for ${standing.user.username} - isCardSeason: ${isCardSeason}, hasSelectionId: ${!!userSelection?._id}`);
              }

              return {
                ...basePlayer,
                cards
              };
            })
          );

          const players = playersWithSelections;

          console.log('Final players data:', players);

          const leaderboard = leagueStandings.driverStandings.reduce((acc, standing) => {
            acc[standing.user.username] = standing.totalPoints;
            return acc;
          }, {} as Record<string, number>);

          setData({
            players,
            raceData,
            leaderboard,
            currentRace: raceData.round
          });
        } catch (error) {
          console.error('Error fetching grid data:', error);
          setError('Failed to load grid data. Please try again later.');
        }
      };

      fetchData();
    }
  }, [leagueId, user]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-red-500 text-xl">{error}</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading grid...</div>
      </div>
    );
  }

  return <GridPage {...data} />;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/avatar-editor" element={<PrivateRoute><AvatarEditor /></PrivateRoute>} />
          <Route element={<AppLayout><></></AppLayout>}>
          <Route path="/rules" element={<Rules />} />
          <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
            <Route path="/statistics" element={<PrivateRoute><Statistics /></PrivateRoute>} />
          <Route path="/league/:id" element={<PrivateRoute><LeagueDetails /></PrivateRoute>} />
          <Route path="/league/:leagueId/race/next/selections" element={<PrivateRoute><NextRaceSelections /></PrivateRoute>} />
          <Route path="/league/:leagueId/race/history" element={<PrivateRoute><RaceHistory /></PrivateRoute>} />
          <Route path="/league/:leagueId/race/:round" element={<PrivateRoute><RaceDetails /></PrivateRoute>} />
          <Route path="/league/:leagueId/standings" element={<PrivateRoute><Standings /></PrivateRoute>} />
            <Route path="/league/:leagueId/grid" element={<PrivateRoute><GridPageWrapper /></PrivateRoute>} />
            <Route path="/league/:leagueId/briefing" element={<PrivateRoute><OpponentsBriefing /></PrivateRoute>} />
            <Route path="/league/:leagueId/statistics" element={<PrivateRoute><Statistics /></PrivateRoute>} />
            <Route path="/info" element={<Info />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
