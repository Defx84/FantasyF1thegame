// Trigger redeploy test
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Player } from '../types/player';
import { getTimeUntilLock, formatTimeLeft } from '../utils/raceUtils';
import AvatarImage from '../components/Avatar/AvatarImage';
import { FaQuestionCircle } from 'react-icons/fa';
import { getCardImagePath } from '../utils/cardImageMapper';
import IconWrapper from '../utils/iconWrapper';
import { RaceTiming } from '../services/raceService';

interface GridPageProps {
  players: Player[];
  raceData: RaceTiming;
  leaderboard: { [key: string]: number };
  currentRace: number;
}

const GridPage: React.FC<GridPageProps> = ({ players, raceData, leaderboard, currentRace }) => {
  const [showSelections, setShowSelections] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(getTimeUntilLock(raceData));
  const [cardsRevealed, setCardsRevealed] = useState(false);
  const navigate = useNavigate();
  const { leagueId } = useParams<{ leagueId: string }>();

  // Scroll to top when grid content appears (fixes mobile opening halfway after async load)
  useEffect(() => {
    const scrollToTop = () => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      const root = document.getElementById('root');
      if (root) root.scrollTop = 0;
    };
    scrollToTop();
    const t = setTimeout(scrollToTop, 150);
    return () => clearTimeout(t);
  }, []);

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

  // Check if cards should be revealed (when selections lock)
  useEffect(() => {
    if (raceData) {
      const timeUntilLock = getTimeUntilLock(raceData);
      setCardsRevealed(timeUntilLock <= 0);
    }
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
              className={`backdrop-blur-sm bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 rounded-xl shadow-lg p-4 transition-all duration-300 ${
                index % 2 === 0 ? 'translate-y-8' : ''
                } ${isLastOdd ? 'col-start-2' : ''}`}
            >
              {/* Top section with status indicator and username */}
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-white truncate flex-1">{player.username}</h2>
                <div className="flex items-center gap-2">
                  {player.selectionMade && player.isAutoAssigned && (
                    <span className="text-xs text-white/70">Auto</span>
                  )}
                  <div
                    className={`w-4 h-4 rounded-full flex-shrink-0 ${
                      player.selectionMade ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  />
                </div>
              </div>

              {/* Avatar + Cards (side-by-side) — extra gap when cards hidden so they don’t overlap avatar */}
              <div className="flex justify-center mb-4">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8">
                  <AvatarImage 
                    userId={player.id} 
                    username={player.username} 
                    size={96} 
                    className="shadow-lg flex-shrink-0 sm:scale-[1.25] sm:origin-left" 
                  />
                  {player.cards && (
                    <div className="flex flex-row items-start justify-center gap-4 flex-shrink-0">
                      {/* Driver Card */}
                      {player.cards.driverCard ? (
                        cardsRevealed ? (
                          <div className="flex flex-col items-center min-h-[152px] sm:min-h-[144px]">
                            <div
                              className={`rounded shadow-lg border ${
                                player.cards.driverCard.tier === 'gold'
                                  ? 'border-yellow-500'
                                  : player.cards.driverCard.tier === 'silver'
                                    ? 'border-gray-300'
                                    : 'border-amber-600'
                              }`}
                              title={player.cards.driverCard.name}
                            >
                              <img
                                src={getCardImagePath(player.cards.driverCard.name, 'driver')}
                                alt={player.cards.driverCard.name}
                                className="w-[96px] h-[128px] sm:w-[90px] sm:h-[120px] object-cover object-center rounded"
                              />
                            </div>
                            <div className="min-h-[20px] mt-1 flex items-center justify-center w-full">
                              {player.cards.driverCard.name === 'Mystery Card' && (player.cards.mysteryTransformedCard?.name != null) && (
                                <span className="text-[10px] text-white/80 text-center max-w-[96px] truncate" title={player.cards.mysteryTransformedCard?.name ?? undefined}>
                                  → {player.cards.mysteryTransformedCard.name}
                                </span>
                              )}
                              {player.cards.driverCard.name === 'Switcheroo' && (player.cards.targetDriver != null && player.cards.targetDriver !== '') && (
                                <span className="text-[10px] text-white/80 text-center max-w-[96px] truncate" title={player.cards.targetDriver}>
                                  → {player.cards.targetDriver}
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div
                            className="w-[96px] h-[128px] sm:w-[90px] sm:h-[120px] rounded flex items-center justify-center bg-white/30 text-white/80 shadow-lg border border-white/40"
                            title="Driver card selected (hidden until selections lock)"
                          >
                            <IconWrapper icon={FaQuestionCircle} size={24} />
                          </div>
                        )
                      ) : null}
                      {/* Team Card */}
                      {player.cards.teamCard ? (
                        cardsRevealed ? (
                          <div className="flex flex-col items-center min-h-[152px] sm:min-h-[144px]">
                            <div
                              className={`rounded shadow-lg border ${
                                player.cards.teamCard.tier === 'gold'
                                  ? 'border-yellow-500'
                                  : player.cards.teamCard.tier === 'silver'
                                    ? 'border-gray-300'
                                    : 'border-amber-600'
                              }`}
                              title={player.cards.teamCard.name}
                            >
                              <img
                                src={getCardImagePath(player.cards.teamCard.name, 'team')}
                                alt={player.cards.teamCard.name}
                                className="w-[96px] h-[128px] sm:w-[90px] sm:h-[120px] object-cover object-center rounded"
                              />
                            </div>
                            <div className="min-h-[20px] mt-1 flex items-center justify-center w-full">
                              {player.cards.teamCard.name === 'Mystery Card' && (player.cards.randomTransformedCard?.name != null) && (
                                <span className="text-[10px] text-white/80 text-center max-w-[96px] truncate" title={player.cards.randomTransformedCard?.name ?? undefined}>
                                  → {player.cards.randomTransformedCard.name}
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div
                            className="w-[96px] h-[128px] sm:w-[90px] sm:h-[120px] rounded flex items-center justify-center bg-white/30 text-white/80 shadow-lg border border-white/40"
                            title="Team card selected (hidden until selections lock)"
                          >
                            <IconWrapper icon={FaQuestionCircle} size={24} />
                          </div>
                        )
                      ) : null}
                    </div>
                  )}
                </div>
              </div>

              {/* Selections section - compact */}
              {showSelections && player.selectionMade && (
                <div className="space-y-1 text-white text-sm">
                  <div className="truncate flex items-center gap-2">
                    <span className="font-medium text-white/80">Main:</span>
                    <span className="text-white flex-1">{player.selections?.mainDriver}</span>
                  </div>
                  <div className="truncate flex items-center gap-2">
                    <span className="font-medium text-white/80">Reserve:</span>
                    <span className="text-white flex-1">{player.selections?.reserveDriver}</span>
                  </div>
                  <div className="truncate flex items-center gap-2">
                    <span className="font-medium text-white/80">Team:</span>
                    <span className="text-white flex-1">{player.selections?.team}</span>
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