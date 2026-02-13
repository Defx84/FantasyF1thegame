import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getNextRaceTiming, RaceTiming } from '../services/raceService';
import { getUsedSelections, saveSelections, getCurrentSelections, Selection, UsedSelections } from '../services/selectionService';
import { getLeague, getLeagueOpponents, Opponent } from '../services/leagueService';
import { getPlayerDeck, activateCards, getRaceCards, getUsedCards, Card, RaceCardSelection } from '../services/cardService';
import IconWrapper from '../utils/iconWrapper';
import { FaLock, FaEdit, FaCheck, FaTimes, FaArrowLeft, FaPlus } from 'react-icons/fa';
import { teamColors, getTeamColor } from '../constants/teamColors';
import { getDrivers, getTeams, getDriverTeams } from '../utils/validation';
import { getTimeUntilLock, isSelectionsLocked, formatTimeLeft } from '../utils/raceUtils';
import { normalizeDriver, normalizeTeam } from '../utils/normalization';
import { normalizeDriverForSeason } from '../constants/f1DataLoader';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getCardImagePath } from '../utils/cardImageMapper';
import AppLogoSpinner from '../components/AppLogoSpinner';

interface Driver {
  id: string;
  name: string;
  team: string;
  teamColor: string;
}

interface Team {
  id: string;
  name: string;
  color: string;
}

/** Returns true if the hex color is light (use black text for contrast when selected). */
function isLightColor(hex: string): boolean {
  const h = (hex || '').replace('#', '');
  if (h.length !== 6) return false;
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  return luminance > 0.7;
}

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const NextRaceSelections: React.FC = () => {
  const navigate = useNavigate();
  const { leagueId } = useParams<{ leagueId: string }>();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [raceData, setRaceData] = useState<RaceTiming | null>(null);
  const [timeUntilDeadline, setTimeUntilDeadline] = useState<number>(0);
  const [isLocked, setIsLocked] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentSelections, setCurrentSelections] = useState<Selection | null>(null);
  const [editingSelections, setEditingSelections] = useState<Selection>({
    mainDriver: null,
    reserveDriver: null,
    team: null
  });
  const [usedSelections, setUsedSelections] = useState<UsedSelections>({
    usedDrivers: [],
    usedTeams: []
  });
  const [raceStatus, setRaceStatus] = useState<string | null>(null);
  const [leagueSeason, setLeagueSeason] = useState<number>(2026); // Default to 2026
  
  // Card state
  const [playerDeck, setPlayerDeck] = useState<{ driverCards: Card[]; teamCards: Card[] } | null>(null);
  const [raceCardSelection, setRaceCardSelection] = useState<RaceCardSelection | null>(null);
  const [selectedDriverCard, setSelectedDriverCard] = useState<Card | null>(null);
  const [selectedTeamCard, setSelectedTeamCard] = useState<Card | null>(null);
  const [isCardModalOpen, setIsCardModalOpen] = useState<{ driver: boolean; team: boolean }>({ driver: false, team: false });
  const [cardModalType, setCardModalType] = useState<'driver' | 'team'>('driver');
  const [isCardEditing, setIsCardEditing] = useState(false);
  const [currentSelectionId, setCurrentSelectionId] = useState<string | null>(null);
  const [cardSuccessMessage, setCardSuccessMessage] = useState<string | null>(null);
  const [usedCardIds, setUsedCardIds] = useState<string[]>([]);
  
  // Target selection state (for Mirror, Espionage, and Switcheroo cards)
  const [cardModalStep, setCardModalStep] = useState<'selectCard' | 'selectTarget'>('selectCard');
  const [pendingCard, setPendingCard] = useState<Card | null>(null);
  const [selectedTargetPlayer, setSelectedTargetPlayer] = useState<string | null>(null);
  const [selectedTargetTeam, setSelectedTargetTeam] = useState<string | null>(null);
  const [selectedTargetDriver, setSelectedTargetDriver] = useState<string | null>(null);
  const [leagueOpponents, setLeagueOpponents] = useState<Opponent[]>([]);
  const [loadingOpponents, setLoadingOpponents] = useState(false);
  const deadlineTriggeredRef = useRef(false);

  // Get season-aware driver and team data
  const allDrivers = getDrivers(leagueSeason);
  const allTeams = getTeams(leagueSeason);
  const driverTeamsMap = getDriverTeams(leagueSeason);

  // Map drivers to our interface
  const drivers: Driver[] = allDrivers.map(name => ({
    id: name.toLowerCase(),
    name,
    team: driverTeamsMap[name],
    teamColor: teamColors[driverTeamsMap[name]] || '#FFFFFF'
  }));

  // Map teams to our interface (use getTeamColor so fallback is consistent)
  const teams: Team[] = allTeams.map(name => ({
    id: name.toLowerCase(),
    name,
    color: getTeamColor(name)
  }));

  const fetchData = async () => {
    try {
      if (!leagueId) {
        setError('League ID is required');
        return;
      }

      setLoading(true);
      
      // Fetch league data to get the season
      const leagueData = await getLeague(leagueId);
      const season = leagueData.season || 2026;
      setLeagueSeason(season);
      
      // Fetch the next race timing
      const raceTiming = await getNextRaceTiming({ leagueId });
      // Use the round from raceTiming
      const round = raceTiming?.round;
      // Only fetch used selections if round is available
      let usedSelectionsData: UsedSelections = { usedDrivers: [], usedTeams: [] };
      if (round) {
        const rawData = await getUsedSelections(leagueId, round);
        // Handle both new format (usedDrivers) and legacy format (usedMainDrivers/usedReserveDrivers)
        const legacyMain = rawData.usedMainDrivers || [];
        const legacyReserve = rawData.usedReserveDrivers || [];
        const mergedLegacy = Array.from(new Set([...legacyMain, ...legacyReserve]));
        usedSelectionsData = {
          usedDrivers: rawData.usedDrivers || mergedLegacy,
          usedTeams: rawData.usedTeams || [],
          // Keep legacy fields for compatibility
          usedMainDrivers: rawData.usedMainDrivers,
          usedReserveDrivers: rawData.usedReserveDrivers
        };
      }
      // Fetch current selections
      const currentSelectionsData = round ? await getCurrentSelections(leagueId, round) : null;
      

      setRaceData(raceTiming);
      setRaceStatus(raceTiming.status || null);
      setUsedSelections(usedSelectionsData);
      setCurrentSelections(currentSelectionsData);
      setEditingSelections(currentSelectionsData || {
        mainDriver: null,
        reserveDriver: null,
        team: null
      });
      setIsEditing(!currentSelectionsData || 
        (!currentSelectionsData.mainDriver && 
         !currentSelectionsData.reserveDriver && 
         !currentSelectionsData.team));
      if (raceTiming) {
        const timeLeft = getTimeUntilLock(raceTiming);
        setTimeUntilDeadline(timeLeft);
        setIsLocked(isSelectionsLocked(raceTiming));
      }

      // Fetch player deck and race cards (only for 2026+ seasons)
      if (season >= 2026) {
        try {
          // Fetch player deck
          const deck = await getPlayerDeck(leagueId);
          setPlayerDeck({
            driverCards: deck.driverCards || [],
            teamCards: deck.teamCards || []
          });

          // Fetch used cards for the season
          try {
            const usedCardsData = await getUsedCards(leagueId);
            setUsedCardIds(usedCardsData.usedCardIds || []);
          } catch (err) {
            console.error('Error fetching used cards:', err);
            // If it fails, just use empty array
            setUsedCardIds([]);
          }

          // If we have a selection, fetch existing race card selection
          if (currentSelectionsData?._id) {
            setCurrentSelectionId(currentSelectionsData._id);
            try {
              console.log('[fetchData] Fetching race cards for selection:', currentSelectionsData._id);
              const raceCards = await getRaceCards(currentSelectionsData._id);
              console.log('[fetchData] Race cards response:', raceCards);
              
              if (raceCards.raceCardSelection) {
                console.log('[fetchData] Setting race card selection:', raceCards.raceCardSelection);
                setRaceCardSelection(raceCards.raceCardSelection);
                // Make sure driverCard and teamCard are populated Card objects, not just IDs
                const driverCard = raceCards.raceCardSelection.driverCard;
                const teamCard = raceCards.raceCardSelection.teamCard;
                console.log('[fetchData] Driver card:', driverCard, 'Team card:', teamCard);
                setSelectedDriverCard(driverCard || null);
                setSelectedTeamCard(teamCard || null);
                // Load target selections if they exist
                if (raceCards.raceCardSelection.targetPlayer) {
                  setSelectedTargetPlayer(
                    typeof raceCards.raceCardSelection.targetPlayer === 'string'
                      ? raceCards.raceCardSelection.targetPlayer
                      : raceCards.raceCardSelection.targetPlayer._id
                  );
                }
                if (raceCards.raceCardSelection.targetTeam) {
                  setSelectedTargetTeam(raceCards.raceCardSelection.targetTeam);
                }
                if (raceCards.raceCardSelection.targetDriver) {
                  setSelectedTargetDriver(raceCards.raceCardSelection.targetDriver);
                }
                setIsCardEditing(false);
              } else {
                console.log('[fetchData] No race card selection found');
                setRaceCardSelection(null);
                setSelectedDriverCard(null);
                setSelectedTeamCard(null);
                setSelectedTargetPlayer(null);
                setSelectedTargetTeam(null);
                setSelectedTargetDriver(null);
              }
            } catch (err) {
              console.error('[fetchData] Error fetching race cards:', err);
              // No race cards yet, that's okay
              setRaceCardSelection(null);
              setSelectedDriverCard(null);
              setSelectedTeamCard(null);
              setSelectedTargetPlayer(null);
              setSelectedTargetTeam(null);
              setSelectedTargetDriver(null);
            }
          } else {
            console.log('[fetchData] No selection ID, clearing card state');
            setCurrentSelectionId(null);
            setRaceCardSelection(null);
            setSelectedDriverCard(null);
            setSelectedTeamCard(null);
            setSelectedTargetPlayer(null);
            setSelectedTargetTeam(null);
            setSelectedTargetDriver(null);
          }
        } catch (err) {
          console.error('Error fetching deck:', err);
          // Deck might not be built yet, that's okay
        }
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!raceData) return;

    const updateLockStatus = () => {
      try {
        const nowMs = Date.now();
        console.log('[NextRaceSelections] Checking lock status:', {
          raceName: raceData.raceName,
          status: raceStatus,
          timeUntilDeadline,
          endOfWeekend: raceData.endOfWeekend
        });

        // Only advance to next race after endOfWeekend
        const endOfWeekendMs = raceData.endOfWeekend ? new Date(raceData.endOfWeekend).getTime() : null;
        if (endOfWeekendMs && nowMs > endOfWeekendMs) {
          console.log('[NextRaceSelections] Locking due to end of weekend');
          setIsLocked(true);
          return;
        }

        // Only lock if race is explicitly completed
        if (raceStatus === 'completed') {
          console.log('[NextRaceSelections] Locking due to completed status');
          setIsLocked(true);
          return;
        }

        // Check time until deadline with a small buffer
        const BUFFER_MS = 1000; // 1 second buffer
        const newTimeLeft = getTimeUntilLock(raceData);
        const lockReached = timeUntilDeadline <= BUFFER_MS || newTimeLeft <= BUFFER_MS;
        if (lockReached && leagueId && !deadlineTriggeredRef.current) {
          deadlineTriggeredRef.current = true;
          getNextRaceTiming({ leagueId })
            .then(() => fetchData())
            .catch(() => {});
        }
        if (timeUntilDeadline <= BUFFER_MS) {
          console.log('[NextRaceSelections] Locking due to deadline');
          setIsLocked(true);
          return;
        }

        // Update time and lock status
        setTimeUntilDeadline(newTimeLeft);
        const newLockStatus = isSelectionsLocked(raceData);
        if (newLockStatus !== isLocked) {
          console.log('[NextRaceSelections] Lock status changed:', {
            from: isLocked,
            to: newLockStatus,
            timeLeft: newTimeLeft
          });
        }
        setIsLocked(newLockStatus);
      } catch (error) {
        console.error('[NextRaceSelections] Error updating lock status:', error);
        // Don't lock on error, but log it
      }
    };

    // Initial update
    updateLockStatus();

    // Set up interval for updates
    const timer = setInterval(updateLockStatus, 1000);
    return () => clearInterval(timer);
  }, [raceData, timeUntilDeadline, raceStatus]);

  const handleDriverClick = (driverId: string) => {
    if (isLocked) return;
    // Require editing mode only if selections already exist
    if (currentSelections && (currentSelections.mainDriver || currentSelections.reserveDriver || currentSelections.team)) {
      if (!isEditing) return;
    } else {
      // No selections yet - auto-enable editing mode for initial selection
      if (!isEditing) {
        setIsEditing(true);
        if (currentSelections) {
          setEditingSelections(currentSelections);
        }
      }
    }
    
    const currentMain = editingSelections.mainDriver;
    const currentReserve = editingSelections.reserveDriver;
    const season = leagueSeason || 2026;
    const normalizedDriverId = normalizeDriverForSeason(driverId, season);
    const normalizedMain = currentMain ? normalizeDriverForSeason(currentMain, season) : null;
    const normalizedReserve = currentReserve ? normalizeDriverForSeason(currentReserve, season) : null;

    // If clicking a selected driver, deselect it
    if (normalizedDriverId === normalizedMain) {
      setEditingSelections(prev => ({ ...prev, mainDriver: null }));
      return;
    }
    if (normalizedDriverId === normalizedReserve) {
      setEditingSelections(prev => ({ ...prev, reserveDriver: null }));
      return;
    }

    // Prevent selecting same driver in both slots
    if (normalizedDriverId === normalizedMain || normalizedDriverId === normalizedReserve) {
      return;
    }

    // Fill slots: first click = main, second click = reserve
    if (!currentMain) {
      // First slot empty - fill main
      setEditingSelections(prev => ({ ...prev, mainDriver: driverId }));
    } else if (!currentReserve) {
      // Second slot empty - fill reserve
      setEditingSelections(prev => ({ ...prev, reserveDriver: driverId }));
    } else {
      // Both filled - this shouldn't happen since clicking selected deselects, but handle it
      // Replace main slot
      setEditingSelections(prev => ({ ...prev, mainDriver: driverId }));
    }
  };

  const handleSelection = (type: keyof Selection, id: string) => {
    if (isLocked || !isEditing) return;
    
    // For drivers, use the new handler
    if (type === 'mainDriver' || type === 'reserveDriver') {
      handleDriverClick(id);
      return;
    }

    setEditingSelections(prev => ({
      ...prev,
      [type]: id
    }));
  };

  const handleConfirm = async () => {
    try {
      if (!leagueId) {
        setError('League ID is required');
        return;
      }
      console.log('Saving selections:', editingSelections);
      await saveSelections(editingSelections, leagueId);
      console.log('Saved successfully, fetching updated data...');
      setIsEditing(false);
      await fetchData(); // Refresh data after saving (this will also fetch cards if selection exists)
    } catch (err: any) {
      console.error('Error in handleConfirm:', err);
      setError(err.message || 'Failed to save selections');
    }
  };

  const handleEdit = () => {
    if (isLocked) return;
    setIsEditing(true);
    if (currentSelections) {
      setEditingSelections(currentSelections);
    }
  };

  const handleCancel = () => {
    if (currentSelections) {
      setEditingSelections(currentSelections);
    }
    setIsEditing(false);
  };

  const seasonForNormalize = leagueSeason || 2026;

  const isDriverUsed = (driverId: string): boolean => {
    const usedList = usedSelections.usedDrivers || [];
    const normalizedDriverId = normalizeDriverForSeason(driverId, seasonForNormalize);
    const result = usedList.some(usedDriver => normalizeDriverForSeason(usedDriver, seasonForNormalize) === normalizedDriverId);
    return result;
  };

  const isTeamUsed = (teamId: string): boolean => {
    const normalizedTeamId = normalizeTeam(teamId);
    const result = usedSelections.usedTeams.some(usedTeam => normalizeTeam(usedTeam) === normalizedTeamId);
    console.log(`Checking if team used: ${teamId} => ${normalizedTeamId} | result: ${result}`);
    return result;
  };

  // Helper function to get current selection value
  const getCurrentSelection = (type: keyof Selection) => {
    if (isEditing) {
      return editingSelections[type];
    }
    return currentSelections?.[type] || null;
  };

  // Helper function to determine if an item is selected
  const isItemSelected = (type: keyof Selection, id: string) => {
    const currentValue = isEditing ? editingSelections[type] : currentSelections?.[type];
    const norm = type === 'team' ? (x: string | null | undefined) => (x ? normalizeTeam(x) : '') : (x: string | null | undefined) => (x ? normalizeDriverForSeason(x, seasonForNormalize) : '');
    const normalizedCurrent = norm(currentValue);
    const normalizedId = type === 'team' ? normalizeTeam(id) : normalizeDriverForSeason(id, seasonForNormalize);
    const isSelected = normalizedCurrent === normalizedId;
    
    console.log(`Selection check for ${type}:`, { 
      id, 
      currentValue, 
      normalizedId,
      normalizedCurrent,
      isSelected 
    });
    
    return isSelected;
  };

  // Helper function to get item style (unselected = lighter tint of same color so it's visible on display)
  const getItemStyle = (type: keyof Selection, id: string, color: string) => {
    const selected = isItemSelected(type, id);
    const c = color || '#FFFFFF';
    return {
      backgroundColor: selected ? c : `${c}40`,
      minHeight: '1.8rem', // Reduced from 2.5rem to 1.8rem
    };
  };

  // Helper function to get item class names (for teams)
  const getItemClassNames = (type: keyof Selection, id: string) => {
    const selected = isItemSelected(type, id);
    const isUsed = type === 'team' ? isTeamUsed(id) : false;

    return `w-full px-2 py-1 rounded-lg border transition-all duration-200 relative ${
      selected ? 'border-2 border-white bg-opacity-100' : 'border border-white/20 hover:border-white/60'
    } ${isUsed ? 'opacity-40 cursor-not-allowed filter grayscale' : 'hover:bg-opacity-100'}`;
  };

  // Helper to check if driver is selected in main or reserve slot
  const getDriverSlot = (driverId: string): 'main' | 'reserve' | null => {
    const currentMain = isEditing ? editingSelections.mainDriver : (currentSelections?.mainDriver || null);
    const currentReserve = isEditing ? editingSelections.reserveDriver : (currentSelections?.reserveDriver || null);
    const normalizedDriverId = normalizeDriverForSeason(driverId, seasonForNormalize);
    
    if (currentMain && normalizeDriverForSeason(currentMain, seasonForNormalize) === normalizedDriverId) return 'main';
    if (currentReserve && normalizeDriverForSeason(currentReserve, seasonForNormalize) === normalizedDriverId) return 'reserve';
    return null;
  };

  // Helper function to get driver button class names
  const getDriverButtonClassNames = (driverId: string) => {
    const slot = getDriverSlot(driverId);
    const isUsed = isDriverUsed(driverId);
    const isSelected = slot !== null;

    return `w-full px-3 py-2 rounded-lg border transition-all duration-200 relative ${
      isSelected 
        ? 'border-2 border-white bg-opacity-100' 
        : 'border border-white/20 hover:border-white/60'
    } ${
      isUsed 
        ? 'opacity-40 cursor-not-allowed filter grayscale' 
        : isLocked 
          ? 'cursor-not-allowed opacity-50' 
          : 'hover:bg-opacity-100 cursor-pointer'
    }`;
  };

  // Render driver button for the unified list
  const renderDriverButton = (driver: Driver) => {
    const slot = getDriverSlot(driver.id);
    const isUsed = isDriverUsed(driver.id);
    const isSelected = slot !== null;
    const useDarkText = isSelected && isLightColor(driver.teamColor);
    const textClass = useDarkText ? 'text-black' : (isSelected ? 'text-white' : 'text-white/90');
    
    return (
      <button
        key={driver.id}
        onClick={() => handleDriverClick(driver.id)}
        className={getDriverButtonClassNames(driver.id)}
        style={{
          backgroundColor: isSelected ? driver.teamColor : `${driver.teamColor}50`,
          minHeight: '1.5rem',
          padding: '0.2rem 0.4rem',
        }}
        disabled={isUsed || isLocked || !!(currentSelections && (currentSelections.mainDriver || currentSelections.reserveDriver || currentSelections.team) && !isEditing)}
      >
        <div className="flex items-center justify-between w-full">
          <span className={`text-xs font-medium ${textClass}`}>
            {driver.name}
          </span>
          {isSelected && (
            <IconWrapper icon={FaCheck} className={`${useDarkText ? 'text-black' : 'text-white'} text-sm z-10 ml-2`} />
          )}
          {slot && (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${useDarkText ? 'bg-black/20 text-black' : 'bg-white/20 text-white'}`}>
              {slot === 'main' ? 'M' : 'R'}
            </span>
          )}
          {isUsed && !isSelected && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-600/50 text-red-200">
              USED
            </span>
          )}
        </div>
      </button>
    );
  };

  // Update the renderTeamButton function
  const renderTeamButton = (team: Team) => {
    const isUsed = isTeamUsed(team.id);
    const teamSelected = isItemSelected('team', team.id);
    const useDarkText = teamSelected && isLightColor(team.color);
    const textClass = teamSelected ? (useDarkText ? 'text-black font-medium' : 'text-white font-medium') : '';
    // Debug log
    console.log(`[team] Button:`, {
      teamId: team.id,
      normalizedId: normalizeTeam(team.id),
      usedList: usedSelections.usedTeams.map(normalizeTeam)
    });
    return (
      <button
        key={team.id}
        onClick={() => handleSelection('team', team.id)}
        className={getItemClassNames('team', team.id)}
        style={{
          ...getItemStyle('team', team.id, team.color),
          minHeight: '3rem',
          padding: '0.75rem 1rem',
        }}
        disabled={isUsed || isLocked || !!(currentSelections && (currentSelections.mainDriver || currentSelections.reserveDriver || currentSelections.team) && !isEditing)}
      >
        <div className="w-full flex items-center justify-between relative">
          <span className={`text-xs ${textClass}`}>
            {team.name}
          </span>
          {teamSelected && (
            <IconWrapper icon={FaCheck} className={`${useDarkText ? 'text-black' : 'text-white'} text-xs z-10 ml-2`} />
          )}
          {isUsed && !isItemSelected('team', team.id) && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-600/50 text-red-200">
              USED
            </span>
          )}
        </div>
      </button>
    );
  };

  // Add this near the top of your component
  const getSelectionStats = () => {
    return {
      driversUsed: usedSelections.usedDrivers?.length || 0,
      teamsUsed: usedSelections.usedTeams.length,
      driversRemaining: 20 - (usedSelections.usedDrivers?.length || 0),
      teamsRemaining: 10 - usedSelections.usedTeams.length
    };
  };

  // Debug logging
  useEffect(() => {
    const season = leagueSeason || 2026;
    console.log('Used Selections:', {
      drivers: (usedSelections.usedDrivers || []).map(d => ({ original: d, normalized: normalizeDriverForSeason(d, season) })),
      teams: usedSelections.usedTeams.map(t => ({ original: t, normalized: normalizeTeam(t) }))
    });
  }, [usedSelections, leagueSeason]);

  // Helper to chunk drivers into pairs
  function chunkArray<T>(arr: T[], size: number): T[][] {
    const result: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      result.push(arr.slice(i, i + size));
    }
    return result;
  }

  // Card handlers
  const handleCardSlotClick = (type: 'driver' | 'team') => {
    if (raceData?.isSprintWeekend) return;
    if (isLocked && !isCardEditing) return;
    setCardModalType(type);
    setIsCardModalOpen({ driver: type === 'driver', team: type === 'team' });
  };

  const handleCardSelect = async (card: Card) => {
    // Check if card requires a target
    if (card.requiresTarget === 'player') {
      // Mirror card - need to select target player
      setPendingCard(card);
      setCardModalStep('selectTarget');
      
      // Fetch league opponents if not already loaded
      if (leagueOpponents.length === 0 && leagueId) {
        setLoadingOpponents(true);
        try {
          const opponents = await getLeagueOpponents(leagueId);
          setLeagueOpponents(opponents);
        } catch (err) {
          console.error('Failed to fetch opponents:', err);
          setError('Failed to load league opponents');
        } finally {
          setLoadingOpponents(false);
        }
      }
    } else if (card.requiresTarget === 'team') {
      // Espionage card - need to select target team
      setPendingCard(card);
      setCardModalStep('selectTarget');
    } else if (card.requiresTarget === 'driver') {
      // Switcheroo card - need to select target driver
      setPendingCard(card);
      setCardModalStep('selectTarget');
    } else {
      // No target required - select card directly
      if (cardModalType === 'driver') {
        setSelectedDriverCard(card);
      } else {
        setSelectedTeamCard(card);
      }
      setIsCardModalOpen({ driver: false, team: false });
      setCardModalStep('selectCard');
      setIsCardEditing(true);
    }
  };
  
  const handleTargetSelect = (targetId: string) => {
    if (pendingCard?.requiresTarget === 'player') {
      setSelectedTargetPlayer(targetId);
    } else if (pendingCard?.requiresTarget === 'team') {
      setSelectedTargetTeam(targetId);
    } else if (pendingCard?.requiresTarget === 'driver') {
      setSelectedTargetDriver(targetId);
    }
    
    // Card and target selected - close modal and set card
    if (cardModalType === 'driver') {
      setSelectedDriverCard(pendingCard);
    } else {
      setSelectedTeamCard(pendingCard);
    }
    
    setIsCardModalOpen({ driver: false, team: false });
    setCardModalStep('selectCard');
    setPendingCard(null);
    setIsCardEditing(true);
  };
  
  const handleCardModalBack = () => {
    if (cardModalStep === 'selectTarget') {
      setCardModalStep('selectCard');
      setPendingCard(null);
      setSelectedTargetPlayer(null);
      setSelectedTargetTeam(null);
      setSelectedTargetDriver(null);
    } else {
      setIsCardModalOpen({ driver: false, team: false });
    }
  };

  const handleCardConfirm = async () => {
    // If no selection ID yet, we need to wait for driver/team selections to be saved first
    if (!currentSelectionId) {
      const errorMsg = 'Please save your driver and team selections first before activating cards.';
      setError(errorMsg);
      console.error('Cannot activate cards: no selection ID');
      return;
    }
    
    try {
      setError(null);
      console.log('Activating cards:', {
        selectionId: currentSelectionId,
        driverCard: selectedDriverCard?._id,
        teamCard: selectedTeamCard?._id
      });
      
      const result = await activateCards(currentSelectionId, {
        driverCardId: selectedDriverCard?._id || null,
        teamCardId: selectedTeamCard?._id || null,
        targetPlayer: selectedTargetPlayer || null,
        targetDriver: selectedTargetDriver || null,
        targetTeam: selectedTargetTeam || null
      });
      
      console.log('Cards activated, result:', result);
      
      // Use the response directly - it contains the raceCardSelection
      if (result.raceCardSelection) {
        console.log('Setting race card selection from response:', result.raceCardSelection);
        setRaceCardSelection(result.raceCardSelection);
        // The driverCard and teamCard should be populated Card objects
        setSelectedDriverCard(result.raceCardSelection.driverCard || null);
        setSelectedTeamCard(result.raceCardSelection.teamCard || null);
        console.log('Cards set:', {
          driverCard: result.raceCardSelection.driverCard,
          teamCard: result.raceCardSelection.teamCard
        });
      } else {
        // Fallback: fetch again if response doesn't have it
        console.log('Response missing raceCardSelection, fetching again...');
        const raceCards = await getRaceCards(currentSelectionId);
        console.log('Fetched race cards:', raceCards);
        
        if (raceCards.raceCardSelection) {
          setRaceCardSelection(raceCards.raceCardSelection);
          setSelectedDriverCard(raceCards.raceCardSelection.driverCard || null);
          setSelectedTeamCard(raceCards.raceCardSelection.teamCard || null);
        }
      }
      
      setIsCardEditing(false);
      setError(null);
      setCardSuccessMessage('Cards activated successfully!');
      
      // Clear target selections
      setSelectedTargetPlayer(null);
      setSelectedTargetTeam(null);
      setSelectedTargetDriver(null);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setCardSuccessMessage(null);
      }, 3000);
      
      // Show success message
      console.log('Cards activated successfully');
    } catch (err: any) {
      console.error('Error activating cards:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to activate cards';
      setError(errorMessage);
      console.error('Full error:', err);
    }
  };

  const handleCardEdit = () => {
    setIsCardEditing(true);
  };

  const handleCardClear = () => {
    setSelectedDriverCard(null);
    setSelectedTeamCard(null);
    setSelectedTargetPlayer(null);
    setSelectedTargetTeam(null);
    setSelectedTargetDriver(null);
  };

  const handleCardCancel = () => {
    // Reset to saved state
    if (raceCardSelection) {
      setSelectedDriverCard(raceCardSelection.driverCard || null);
      setSelectedTeamCard(raceCardSelection.teamCard || null);
      setSelectedTargetPlayer(raceCardSelection.targetPlayer?._id || null);
      setSelectedTargetTeam(raceCardSelection.targetTeam || null);
      setSelectedTargetDriver(raceCardSelection.targetDriver || null);
    } else {
      setSelectedDriverCard(null);
      setSelectedTeamCard(null);
      setSelectedTargetPlayer(null);
      setSelectedTargetTeam(null);
      setSelectedTargetDriver(null);
    }
    setIsCardEditing(false);
  };

  // Used card IDs are now fetched from the API and stored in state


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <>
      {/* Background wrapper */}
      <div
        className="fixed inset-0 w-full h-full z-0"
        style={{
          backgroundImage: 'url("/Selection_page.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed',
        }}
      />
      {/* Main content wrapper */}
      <div className="relative w-full flex flex-col bg-transparent text-white z-10">
        <div className="flex-1 container mx-auto px-4 py-8 pt-16">
          {/* Error and Success Messages */}
          {error && (
            <div className="w-full max-w-5xl mx-auto mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300">
              {error}
            </div>
          )}
          {cardSuccessMessage && (
            <div className="w-full max-w-5xl mx-auto mb-4 p-4 bg-green-500/20 border border-green-500/50 rounded-lg text-green-300">
              {cardSuccessMessage}
            </div>
          )}

          {/* Deadline countdown */}
          <div className="w-full max-w-5xl mx-auto mb-4">
            <div className="backdrop-blur-sm bg-black/20 rounded-lg p-2">
              {raceData && (
                <div className="mb-2 text-center">
                  <div className="text-xl font-bold text-white">{raceData.raceName}</div>
                </div>
              )}
              <h2 className="text-lg font-bold">Selection Deadline</h2>
              <p className="text-sm text-white/90">
                {isLocked ? 'Selections locked' : `Time remaining: ${formatTimeLeft(timeUntilDeadline)}`}
              </p>
            </div>
          </div>

          {/* Main content area with three equal columns */}
          <div className="flex flex-col max-w-7xl mx-auto gap-3">
            {/* Two slots at top - spans full width */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Main Driver Slot */}
                <div className="backdrop-blur-sm bg-black/20 rounded-lg p-4 border-2 border-white/10">
                  <h3 className="text-lg font-bold mb-3 text-center text-white">Main Driver</h3>
                  <div className="min-h-[60px] flex items-center justify-center">
                    {getCurrentSelection('mainDriver') ? (() => {
                      const driverName = getCurrentSelection('mainDriver')!;
                      const season = seasonForNormalize;
                      const driver = drivers.find(d => {
                        const normalizedStored = normalizeDriverForSeason(driverName, season);
                        const normalizedDriver = normalizeDriverForSeason(d.name, season);
                        return normalizedStored === normalizedDriver;
                      });
                      return driver ? (
                        <div className="flex items-center justify-between w-full px-4 py-3 rounded-lg" style={{ backgroundColor: `${driver.teamColor}20`, border: `2px solid ${driver.teamColor}` }}>
                          <span className="text-white font-semibold">{driver.name}</span>
                          {!isLocked && (
                            <button
                              onClick={() => {
                                setIsEditing(true);
                                setEditingSelections(prev => ({ ...prev, mainDriver: null }));
                              }}
                              className="text-white/70 hover:text-white transition-colors"
                            >
                              <IconWrapper icon={FaTimes} />
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="text-white/50 text-sm text-center py-4">
                          {driverName}
                        </div>
                      );
                    })() : (
                      <div className="text-white/50 text-sm text-center py-4">
                        Click a driver below →
                      </div>
                    )}
                </div>
              </div>

                {/* Reserve Driver Slot */}
                <div className="backdrop-blur-sm bg-black/20 rounded-lg p-4 border-2 border-white/10">
                  <h3 className="text-lg font-bold mb-3 text-center text-white">Reserve Driver</h3>
                  <div className="min-h-[60px] flex items-center justify-center">
                    {getCurrentSelection('reserveDriver') ? (() => {
                      const driverName = getCurrentSelection('reserveDriver')!;
                      const season = seasonForNormalize;
                      const driver = drivers.find(d => {
                        const normalizedStored = normalizeDriverForSeason(driverName, season);
                        const normalizedDriver = normalizeDriverForSeason(d.name, season);
                        return normalizedStored === normalizedDriver;
                      });
                      return driver ? (
                        <div className="flex items-center justify-between w-full px-4 py-3 rounded-lg" style={{ backgroundColor: `${driver.teamColor}20`, border: `2px solid ${driver.teamColor}` }}>
                          <span className="text-white font-semibold">{driver.name}</span>
                          {!isLocked && (
                            <button
                              onClick={() => {
                                setIsEditing(true);
                                setEditingSelections(prev => ({ ...prev, reserveDriver: null }));
                              }}
                              className="text-white/70 hover:text-white transition-colors"
                            >
                              <IconWrapper icon={FaTimes} />
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="text-white/50 text-sm text-center py-4">
                          {driverName}
                        </div>
                      );
                    })() : (
                      <div className="text-white/50 text-sm text-center py-4">
                        Click a driver below →
                      </div>
                    )}
                  </div>
                </div>
            </div>

            {/* Layout: Drivers + Teams (equal) | Cards (fixed width) */}
            <div className="flex flex-col lg:flex-row gap-3 flex-1 min-h-0">
              {/* Left side: Drivers and Teams (equal width) */}
              <div className="flex-1 flex flex-col lg:flex-row gap-3 min-h-0">
                {/* Drivers Column - More compact to reduce height */}
                <div className="flex-1 backdrop-blur-sm bg-black/20 rounded-lg p-2 flex flex-col min-h-0">
                  <h3 className="text-base font-bold mb-2 text-center text-white">
                    Available Drivers
                    <span className="text-xs font-normal text-white/70 ml-2">
                      ({drivers.length - (usedSelections.usedDrivers?.length || 0)} remaining)
                    </span>
                  </h3>
                  <div className="flex-1 grid grid-cols-2 gap-0.5 overflow-y-auto scrollbar-thin scrollbar-thumb-red-500/50 scrollbar-track-transparent pr-1">
                    {drivers.map(driver => renderDriverButton(driver))}
                  </div>
                </div>

                {/* Teams Column - More spacing to increase height */}
                <div className="flex-1 backdrop-blur-sm bg-black/20 rounded-lg p-4 flex flex-col min-h-0">
                  <h3 className="text-base font-bold mb-2 text-center text-white">Team</h3>
                  <div className="flex-1 space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-red-500/50 scrollbar-track-transparent pr-1">
                    {teams.map(team => renderTeamButton(team))}
                  </div>
                </div>
              </div>

              {/* Cards Column - Fixed width on the right */}
              <div className="w-full lg:w-64 flex flex-col justify-center min-h-0 flex-shrink-0">
                  <div
                    className={`backdrop-blur-sm bg-black/20 rounded-lg p-4 text-center space-y-3 flex flex-col h-full ${raceData?.isSprintWeekend ? 'opacity-80' : ''}`}
                    title={raceData?.isSprintWeekend ? 'Power Cards not available during sprint weekends' : undefined}
                  >
                {/* Card slots (only for 2026+ seasons) */}
                {leagueSeason >= 2026 && playerDeck && (
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-white mb-3">Power Cards</h3>
                    
                    {/* Cards container - side by side on mobile, stacked on larger screens */}
                    <div className="flex flex-row gap-3 lg:flex-col lg:gap-4 lg:space-y-0">
                      {/* Driver Card Slot */}
                      <div
                        onClick={() => !raceData?.isSprintWeekend && (!isLocked || isCardEditing) ? handleCardSlotClick('driver') : undefined}
                        className={`relative transition-all flex-1 lg:flex-none ${
                          raceData?.isSprintWeekend
                            ? 'opacity-60 cursor-not-allowed'
                            : !isLocked || isCardEditing
                              ? 'cursor-pointer hover:scale-105'
                              : 'opacity-50 cursor-not-allowed'
                        }`}
                      >
                        <div className={`aspect-[3/4] rounded-lg border-2 overflow-hidden max-w-[140px] lg:max-w-none ${
                          selectedDriverCard
                            ? 'border-yellow-500'
                            : 'bg-white/5 border-white/20'
                        }`}>
                        {selectedDriverCard ? (
                          <div className="w-full h-full relative">
                            <img
                              src={getCardImagePath(selectedDriverCard.name, 'driver')}
                              alt={selectedDriverCard.name}
                              className="w-full h-full object-cover object-center"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2RkZCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';
                                target.onerror = null;
                              }}
                            />
                            {/* Tier badge overlay */}
                            <div className="absolute top-2 left-2">
                              <div className={`px-2 py-1 rounded text-xs font-bold ${
                                selectedDriverCard.tier === 'gold' ? 'bg-yellow-500 text-yellow-900' :
                                selectedDriverCard.tier === 'silver' ? 'bg-gray-400 text-gray-900' : 'bg-amber-600 text-amber-900'
                              }`}>
                                {selectedDriverCard.tier.toUpperCase()}
                              </div>
                            </div>
                          </div>
                    ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-white/50 bg-white/5">
                            <IconWrapper icon={FaPlus} className="mb-2 text-2xl" />
                            <span className="text-xs">Driver Card</span>
                          </div>
                    )}
                  </div>
                </div>

                      {/* Team Card Slot */}
                      <div
                        onClick={() => !raceData?.isSprintWeekend && (!isLocked || isCardEditing) ? handleCardSlotClick('team') : undefined}
                        className={`relative transition-all flex-1 lg:flex-none ${
                          raceData?.isSprintWeekend
                            ? 'opacity-60 cursor-not-allowed'
                            : !isLocked || isCardEditing
                              ? 'cursor-pointer hover:scale-105'
                              : 'opacity-50 cursor-not-allowed'
                        }`}
                      >
                        <div className={`aspect-[3/4] rounded-lg border-2 overflow-hidden max-w-[140px] lg:max-w-none ${
                          selectedTeamCard
                            ? 'border-yellow-500'
                            : 'bg-white/5 border-white/20'
                        }`}>
                        {selectedTeamCard ? (
                          <div className="w-full h-full relative">
                            <img
                              src={getCardImagePath(selectedTeamCard.name, 'team')}
                              alt={selectedTeamCard.name}
                              className="w-full h-full object-cover object-center"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2RkZCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';
                                target.onerror = null;
                              }}
                            />
                            {/* Tier badge overlay */}
                            <div className="absolute top-2 left-2">
                              <div className={`px-2 py-1 rounded text-xs font-bold ${
                                selectedTeamCard.tier === 'gold' ? 'bg-yellow-500 text-yellow-900' :
                                selectedTeamCard.tier === 'silver' ? 'bg-gray-400 text-gray-900' : 'bg-amber-600 text-amber-900'
                              }`}>
                                {selectedTeamCard.tier.toUpperCase()}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-white/50 bg-white/5">
                            <IconWrapper icon={FaPlus} className="mb-2 text-2xl" />
                            <span className="text-xs">Team Card</span>
                          </div>
                        )}
                        </div>
                      </div>
                    </div>

                    {/* Card action buttons */}
                    {leagueSeason >= 2026 && (
                      <div className="flex flex-col gap-2 mt-4">
                        {/* Show confirm button if cards are selected but not saved, or if in edit mode */}
                        {(isCardEditing || ((selectedDriverCard || selectedTeamCard) && !raceCardSelection)) ? (
                          <>
                            <button
                              onClick={handleCardConfirm}
                              disabled={!currentSelectionId}
                              className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-bold ${
                                !currentSelectionId
                                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                  : 'bg-green-600 text-white hover:bg-green-700'
                              }`}
                              title={!currentSelectionId ? 'Please save your driver and team selections first' : 'Confirm card selection'}
                            >
                              <IconWrapper icon={FaCheck} />
                              Confirm
                            </button>
                            <button
                              onClick={handleCardCancel}
                              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm font-bold"
                            >
                              <IconWrapper icon={FaTimes} />
                              Cancel
                            </button>
                            <button
                              onClick={handleCardClear}
                              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-bold"
                            >
                              Clear
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={handleCardEdit}
                            disabled={isLocked || !!raceData?.isSprintWeekend}
                            title={raceData?.isSprintWeekend ? 'Power Cards not available during sprint weekends' : undefined}
                            className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-bold ${
                              isLocked || raceData?.isSprintWeekend
                                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                : 'bg-red-600 text-white hover:bg-red-700'
                            }`}
                          >
                            <IconWrapper icon={FaEdit} />
                            Edit Cards
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
                </div>
              </div>
            </div>
          </div>

          {/* Main action buttons - full width below columns */}
          <div className="flex flex-col gap-3 max-w-7xl mx-auto">
                  {!isLocked && (
                    <>
                      {isEditing ? (
                        <>
                          <button
                            onClick={handleCancel}
                            className="w-full min-w-[160px] flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-bold"
                          >
                            <IconWrapper icon={FaTimes} className="mr-2" />
                            Cancel
                          </button>
                          <button
                            onClick={handleConfirm}
                            className="w-full min-w-[160px] flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold"
                          >
                            <IconWrapper icon={FaCheck} className="mr-2" />
                            Confirm
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={handleEdit}
                            className="w-full min-w-[160px] flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold"
                          >
                            <IconWrapper icon={FaEdit} className="mr-2" />
                            Edit
                          </button>
                          <button
                            onClick={handleConfirm}
                            className="w-full min-w-[160px] flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold"
                          >
                            <IconWrapper icon={FaLock} className="mr-2" />
                            Confirm
                          </button>
                        </>
                      )}
                    </>
                  )}
                  <button
                    onClick={() => navigate(`/league/${leagueId}/grid`)}
                    className="w-full min-w-[160px] flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold transition-colors duration-200"
                  >
                    Go to Grid
                  </button>
                  <button
                    onClick={() => navigate(`/league/${leagueId}/briefing`)}
                    className="w-full min-w-[160px] flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold transition-colors duration-200"
                  >
                    🎯 Opponents Briefing
                  </button>
                </div>
          </div>
        </div>

      {/* Card Selection Modal */}
      {(isCardModalOpen.driver || isCardModalOpen.team) && playerDeck && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-lg border-2 border-white/20 p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-4">
                {cardModalStep === 'selectTarget' && (
                  <button
                    onClick={handleCardModalBack}
                    className="text-white/70 hover:text-white transition-colors"
                  >
                    <IconWrapper icon={FaArrowLeft} className="text-xl" />
                  </button>
                )}
                <h2 className="text-2xl font-bold text-white">
                  {cardModalStep === 'selectTarget' 
                    ? pendingCard?.requiresTarget === 'player'
                      ? 'Select Target Player'
                      : pendingCard?.requiresTarget === 'driver'
                      ? 'Select Target Driver'
                      : 'Select Target Team'
                    : `Select ${cardModalType === 'driver' ? 'Driver' : 'Team'} Card`}
                </h2>
              </div>
              <button
                onClick={handleCardModalBack}
                className="text-white/70 hover:text-white transition-colors"
              >
                <IconWrapper icon={FaTimes} className="text-2xl" />
              </button>
            </div>

            {cardModalStep === 'selectCard' ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {(cardModalType === 'driver' ? playerDeck.driverCards : playerDeck.teamCards).map((card) => {
                    const isUsed = usedCardIds.includes(card._id);
                    const isSelected = (cardModalType === 'driver' && selectedDriverCard?._id === card._id) ||
                                      (cardModalType === 'team' && selectedTeamCard?._id === card._id);
                    
                    return (
                      <button
                        key={card._id}
                        onClick={() => !isUsed && handleCardSelect(card)}
                        disabled={isUsed}
                        className={`aspect-[2/3] rounded-lg border-2 p-2 flex flex-col items-center justify-center transition-all ${
                          isUsed
                            ? 'bg-gray-800/50 border-gray-600 opacity-50 cursor-not-allowed'
                            : isSelected
                            ? 'bg-gradient-to-br from-yellow-500/30 to-yellow-600/30 border-yellow-500 scale-105'
                            : 'bg-white/5 border-white/20 hover:border-white/40 hover:scale-105 cursor-pointer'
                        }`}
                      >
                        {/* Card Image - Uniform sizing */}
                        <div className="w-full flex-1 mb-2 rounded overflow-hidden bg-black/20">
                          <img
                            src={getCardImagePath(card.name, cardModalType)}
                            alt={card.name}
                            className="w-full h-full object-cover object-center"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = '/images/placeholder.png';
                              target.onerror = null;
                            }}
                          />
                        </div>
                        <div className={`text-xs font-bold mb-1 ${
                          card.tier === 'gold' ? 'text-yellow-400' :
                          card.tier === 'silver' ? 'text-gray-300' : 'text-amber-600'
                        }`}>
                          {card.tier.toUpperCase()}
                        </div>
                        <div className="text-white text-sm font-semibold text-center mb-2">
                          {card.name}
                        </div>
                        <div className="text-white/70 text-xs text-center line-clamp-3 mb-2">
                          {card.description}
                        </div>
                        {isUsed && (
                          <div className="text-red-400 text-xs font-bold mt-auto">
                            USED
                          </div>
                        )}
                        {isSelected && !isUsed && (
                          <div className="text-green-400 text-xs font-bold mt-auto">
                            SELECTED
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {playerDeck && (cardModalType === 'driver' ? playerDeck.driverCards : playerDeck.teamCards).length === 0 && (
                  <div className="text-center text-white/70 py-8">
                    <p>No {cardModalType} cards available in your deck.</p>
                    <p className="text-sm mt-2">Build your deck first in the League page.</p>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Target Selection Step */}
                {pendingCard?.requiresTarget === 'player' ? (
                  // Player selection for Mirror card
                  <div>
                    {loadingOpponents ? (
                      <div className="flex items-center justify-center py-12">
                        <AppLogoSpinner size="lg" />
                      </div>
                    ) : leagueOpponents.length === 0 ? (
                      <div className="text-center text-white/70 py-8">
                        <p>No opponents found in this league.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {leagueOpponents.map((opponent) => {
                          const isSelected = selectedTargetPlayer === opponent.id;
                          return (
                            <button
                              key={opponent.id}
                              onClick={() => handleTargetSelect(opponent.id)}
                              className={`p-4 rounded-lg border-2 transition-all ${
                                isSelected
                                  ? 'bg-gradient-to-br from-blue-500/30 to-blue-600/30 border-blue-500 scale-105'
                                  : 'bg-white/5 border-white/20 hover:border-white/40 hover:scale-105 cursor-pointer'
                              }`}
                            >
                              <div className="text-white font-semibold text-center">
                                {opponent.username}
                              </div>
                              {isSelected && (
                                <div className="text-green-400 text-xs font-bold mt-2 text-center">
                                  SELECTED
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : pendingCard?.requiresTarget === 'team' ? (
                  // Team selection for Espionage card
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {allTeams.map((teamName) => {
                      const team = teams.find(t => normalizeTeam(t.name) === normalizeTeam(teamName));
                      if (!team) return null;
                      
                      const isSelected = selectedTargetTeam && normalizeTeam(selectedTargetTeam) === normalizeTeam(teamName);
                      return (
                        <button
                          key={team.id}
                          onClick={() => handleTargetSelect(teamName)}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            isSelected
                              ? 'bg-gradient-to-br from-blue-500/30 to-blue-600/30 border-blue-500 scale-105'
                              : 'bg-white/5 border-white/20 hover:border-white/40 hover:scale-105 cursor-pointer'
                          }`}
                          style={{
                            backgroundColor: isSelected ? `${team.color}30` : undefined,
                            borderColor: isSelected ? team.color : undefined
                          }}
                        >
                          <div className="text-white font-semibold text-center">
                            {team.name}
                          </div>
                          {isSelected && (
                            <div className="text-green-400 text-xs font-bold mt-2 text-center">
                              SELECTED
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : pendingCard?.requiresTarget === 'driver' ? (
                  // Driver selection for Switcheroo card
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {allDrivers.map((driverName) => {
                      const driver = drivers.find(d => normalizeDriverForSeason(d.name, seasonForNormalize) === normalizeDriverForSeason(driverName, seasonForNormalize));
                      if (!driver) return null;
                      
                      const isSelected = selectedTargetDriver && normalizeDriverForSeason(selectedTargetDriver, seasonForNormalize) === normalizeDriverForSeason(driverName, seasonForNormalize);
                      return (
                        <button
                          key={driver.id}
                          onClick={() => handleTargetSelect(driverName)}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            isSelected
                              ? 'bg-gradient-to-br from-blue-500/30 to-blue-600/30 border-blue-500 scale-105'
                              : 'bg-white/5 border-white/20 hover:border-white/40 hover:scale-105 cursor-pointer'
                          }`}
                          style={{
                            backgroundColor: isSelected ? `${driver.teamColor}30` : undefined,
                            borderColor: isSelected ? driver.teamColor : undefined
                          }}
                        >
                          <div className="text-white font-semibold text-center">
                            {driver.name}
                          </div>
                          {isSelected && (
                            <div className="text-green-400 text-xs font-bold mt-2 text-center">
                              SELECTED
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default NextRaceSelections; 