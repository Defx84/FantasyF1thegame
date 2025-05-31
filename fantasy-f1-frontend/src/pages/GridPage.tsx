// Trigger redeploy test
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Player } from '../types/player';
import { getTimeUntilLock, formatTimeLeft } from '../utils/raceUtils';

interface GridPageProps {
  players: Player[];
  raceData: any;
  leaderboard: { [key: string]: number };
  currentRace: number;
}

const GridPage: React.FC<GridPageProps> = ({ players, raceData, leaderboard, currentRace }) => {
  const [showSelections, setShowSelections] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(getTimeUntilLock(raceData));
  const navigate = useNavigate();
  const { leagueId } = useParams<{ leagueId: string }>();

  useEffect(() => {
    const updateCountdown = () => {
      const timeUntilLock = getTimeUntilLock(raceData);
      if (timeUntilLock <= 0) {
        setShowSelections(true);
        setTimeLeft(0);
      } else {
        setTimeLeft(timeUntilLock);
      }
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [raceData]);

  const sortedPlayers = [...players].sort((a, b) => {
    if (currentRace === 1) {
      return a.username.localeCompare(b.username);
    }
    return (leaderboard[a.username] || 0) - (leaderboard[b.username] || 0);
  });

  return (
    <div className="relative min-h-screen w-full">
      {/* Fixed background image */}
      <div
        className="fixed inset-0 w-screen h-screen z-0"
        style={{
          backgroundImage: 'url("/GridPage.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed',
        }}
        aria-hidden="true"
      />
      {/* Main content above background */}
      <div className="relative z-10 max-w-7xl mx-auto pt-16">
        <div className="flex justify-between items-center mb-8 backdrop-blur-md bg-black/5 border border-white/10 rounded-xl shadow-lg px-8 py-4">
          <h1 className="text-3xl font-bold text-white">Starting Grid</h1>
            <div className="text-xl font-semibold text-red-500">
              Lock in: {formatTimeLeft(timeLeft)}
            </div>
        </div>

        <div className="grid grid-cols-2 gap-4 md:gap-8">
          {sortedPlayers.map((player, index) => {
            const isLastOdd =
              sortedPlayers.length % 2 === 1 && index === sortedPlayers.length - 1;
            return (
            <div
              key={player.username}
              className={`bg-white/80 border border-white/10 rounded-xl shadow-lg p-4 transform transition-all duration-300 ${
                index % 2 === 0 ? 'translate-y-8' : ''
                } ${isLastOdd ? 'col-start-2' : ''}`}
            >
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-semibold text-white truncate">{player.username}</h2>
                <div
                  className={`w-4 h-4 rounded-full flex-shrink-0 ${
                    player.selectionMade ? 'bg-green-500' : 'bg-red-500'
                  }`}
                />
              </div>

              {showSelections && player.selectionMade && (
                <div className="space-y-2 text-gray-300">
                  <div className="truncate">
                    <span className="font-medium">Main Driver:</span>{' '}
                    {player.selections?.mainDriver}
                  </div>
                  <div className="truncate">
                    <span className="font-medium">Reserve Driver:</span>{' '}
                    {player.selections?.reserveDriver}
                  </div>
                  <div className="truncate">
                    <span className="font-medium">Team:</span> {player.selections?.team}
                  </div>
                </div>
              )}
            </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default GridPage; 