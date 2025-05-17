import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useParams } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
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
import Rules from './pages/Rules';
import Statistics from './pages/Statistics';
import Info from './pages/Info';
import { getNextRaceTiming } from './services/raceService';
import { getLeagueStandings } from './services/leagueService';
import { getRaceSelections } from './services/selectionService';
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

          // Get all league members from standings
          const members = leagueStandings.driverStandings.map(standing => standing.user.username);

          // Transform selections data into player format
          const players = members.map(username => {
            const userSelection = raceSelections.selections.find(s => s.username === username);
            
            return {
              username,
              selectionMade: !!(
                userSelection?.mainDriver &&
                userSelection?.reserveDriver &&
                userSelection?.team
              ),
              selections: {
                mainDriver: userSelection?.mainDriver || null,
                reserveDriver: userSelection?.reserveDriver || null,
                team: userSelection?.team || null
              }
            };
          });

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
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
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
            <Route path="/league/:leagueId/statistics" element={<PrivateRoute><Statistics /></PrivateRoute>} />
            <Route path="/info" element={<Info />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
