// Trigger redeploy test
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Player } from '../types/player';
import { getTimeUntilLock, formatTimeLeft } from '../utils/raceUtils';
import AvatarImage from '../components/Avatar/AvatarImage';
import { FaQuestionCircle, FaIdCard } from 'react-icons/fa';
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

  // Check if cards should be revealed (when race has started)
  useEffect(() => {
    if (raceData?.race?.startTime) {
      const raceStartTime = new Date(raceData.race.startTime);
      const now = new Date();
      setCardsRevealed(now >= raceStartTime);
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
                <div
                  className={`w-4 h-4 rounded-full flex-shrink-0 ${
                    player.selectionMade ? 'bg-green-500' : 'bg-red-500'
                  }`}
                />
              </div>

              {/* Large Avatar Section */}
              <div className="flex justify-center mb-4 relative">
                <AvatarImage 
                  userId={player.id} 
                  username={player.username} 
                  size={120} 
                  className="shadow-lg" 
                />
                {/* Card Icons next to Avatar */}
                {player.cards && (
                  <div className="absolute -right-2 top-1/2 -translate-y-1/2 flex flex-col gap-2">
                    {/* Driver Card Icon */}
                    {player.cards.driverCard ? (
                      cardsRevealed ? (
                        <div 
                          className={`w-8 h-8 rounded flex items-center justify-center text-xs font-bold shadow-lg ${
                            player.cards.driverCard.tier === 'gold' ? 'bg-yellow-500/90 text-yellow-900' :
                            player.cards.driverCard.tier === 'silver' ? 'bg-gray-400/90 text-gray-900' :
                            'bg-amber-600/90 text-amber-900'
                          }`}
                          title={player.cards.driverCard.name}
                        >
                          <IconWrapper icon={FaIdCard} size={14} />
                        </div>
                      ) : (
                        <div 
                          className="w-8 h-8 rounded flex items-center justify-center bg-white/30 text-white/80 shadow-lg border border-white/40"
                          title="Driver card selected (hidden until race starts)"
                        >
                          <IconWrapper icon={FaQuestionCircle} size={16} />
                        </div>
                      )
                    ) : null}
                    {/* Team Card Icon */}
                    {player.cards.teamCard ? (
                      cardsRevealed ? (
                        <div 
                          className={`w-8 h-8 rounded flex items-center justify-center text-xs font-bold shadow-lg ${
                            player.cards.teamCard.tier === 'gold' ? 'bg-yellow-500/90 text-yellow-900' :
                            player.cards.teamCard.tier === 'silver' ? 'bg-gray-400/90 text-gray-900' :
                            'bg-amber-600/90 text-amber-900'
                          }`}
                          title={player.cards.teamCard.name}
                        >
                          <IconWrapper icon={FaIdCard} size={14} />
                        </div>
                      ) : (
                        <div 
                          className="w-8 h-8 rounded flex items-center justify-center bg-white/30 text-white/80 shadow-lg border border-white/40"
                          title="Team card selected (hidden until race starts)"
                        >
                          <IconWrapper icon={FaQuestionCircle} size={16} />
                        </div>
                      )
                    ) : null}
                  </div>
                )}
              </div>

              {/* Selections section - compact */}
              {showSelections && player.selectionMade && (
                <div className="space-y-1 text-white text-sm">
                  <div className="truncate flex items-center gap-2">
                    <span className="font-medium text-white/80">Main:</span>
                    <span className="text-white flex-1">{player.selections?.mainDriver}</span>
                    {/* Driver Card Icon */}
                    {player.cards && (
                      <div className="flex-shrink-0">
                        {cardsRevealed && player.cards.driverCard ? (
                          <div 
                            className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${
                              player.cards.driverCard.tier === 'gold' ? 'bg-yellow-500/80 text-yellow-900' :
                              player.cards.driverCard.tier === 'silver' ? 'bg-gray-400/80 text-gray-900' :
                              'bg-amber-600/80 text-amber-900'
                            }`}
                            title={player.cards.driverCard.name}
                          >
                            <IconWrapper icon={FaIdCard} size={12} />
                          </div>
                        ) : player.cards.driverCard ? (
                          <div 
                            className="w-6 h-6 rounded flex items-center justify-center bg-white/20 text-white/60"
                            title="Card selected (hidden until race starts)"
                          >
                            <IconWrapper icon={FaQuestionCircle} size={12} />
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                  <div className="truncate flex items-center gap-2">
                    <span className="font-medium text-white/80">Reserve:</span>
                    <span className="text-white flex-1">{player.selections?.reserveDriver}</span>
                  </div>
                  <div className="truncate flex items-center gap-2">
                    <span className="font-medium text-white/80">Team:</span>
                    <span className="text-white flex-1">{player.selections?.team}</span>
                    {/* Team Card Icon */}
                    {player.cards && (
                      <div className="flex-shrink-0">
                        {cardsRevealed && player.cards.teamCard ? (
                          <div 
                            className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${
                              player.cards.teamCard.tier === 'gold' ? 'bg-yellow-500/80 text-yellow-900' :
                              player.cards.teamCard.tier === 'silver' ? 'bg-gray-400/80 text-gray-900' :
                              'bg-amber-600/80 text-amber-900'
                            }`}
                            title={player.cards.teamCard.name}
                          >
                            <IconWrapper icon={FaIdCard} size={12} />
                          </div>
                        ) : player.cards.teamCard ? (
                          <div 
                            className="w-6 h-6 rounded flex items-center justify-center bg-white/20 text-white/60"
                            title="Card selected (hidden until race starts)"
                          >
                            <IconWrapper icon={FaQuestionCircle} size={12} />
                          </div>
                        ) : null}
                      </div>
                    )}
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