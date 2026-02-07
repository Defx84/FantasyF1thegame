import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPlayerCards, getPlayerDeck, selectDeck, Card } from '../services/cardService';
import { getLeague } from '../services/leagueService';
import { FaLock, FaCheck, FaTimes, FaRedo, FaChevronLeft, FaChevronRight, FaEdit } from 'react-icons/fa';
import IconWrapper from '../utils/iconWrapper';
import { api } from '../services/api';
import AppLogoSpinner from '../components/AppLogoSpinner';
import { getCardImagePath } from '../utils/cardImageMapper';

interface DeckBuilderProps {
  leagueId?: string;
}

const DeckBuilder: React.FC<DeckBuilderProps> = ({ leagueId: propLeagueId }) => {
  const params = useParams<{ leagueId?: string; id?: string }>();
  const routeLeagueId = params.leagueId || params.id;
  const leagueId = propLeagueId || routeLeagueId;
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Card data
  const [driverCards, setDriverCards] = useState<Card[]>([]);
  const [teamCards, setTeamCards] = useState<Card[]>([]);
  
  // Selected cards
  const [selectedDriverCards, setSelectedDriverCards] = useState<string[]>([]);
  const [selectedTeamCards, setSelectedTeamCards] = useState<string[]>([]);
  
  // Carousel ref
  const carouselRef = useRef<HTMLDivElement>(null);
  
  // Carousel drag state
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [hasDragged, setHasDragged] = useState(false);
  const [centerCardIndex, setCenterCardIndex] = useState<number | null>(null);
  
  // Deck state
  const [existingDeck, setExistingDeck] = useState<{ driverCards: Card[]; teamCards: Card[] } | null>(null);
  const [isDeckLocked, setIsDeckLocked] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [leagueSeason, setLeagueSeason] = useState<number>(2026);
  
  // Active tab
  const [activeTab, setActiveTab] = useState<'driver' | 'team'>('driver');

  // Tier colors
  const tierColors = {
    gold: '#FFD700',
    silver: '#C0C0C0',
    bronze: '#CD7F32'
  };

  const tierTextColors = {
    gold: '#000000',
    silver: '#000000',
    bronze: '#FFFFFF'
  };

  useEffect(() => {
    if (leagueId) {
      console.log('DeckBuilder: Fetching data for leagueId:', leagueId);
      fetchData();
    } else {
      console.error('DeckBuilder: No leagueId provided');
      setError('League ID is missing');
      setLoading(false);
    }
  }, [leagueId]);

  // Track center card for highlighting
  // Sort cards by tier: gold > silver > bronze
  const tierOrder = { gold: 0, silver: 1, bronze: 2 };
  const sortedDriverCards = [...driverCards].sort((a, b) => tierOrder[a.tier] - tierOrder[b.tier]);
  const sortedTeamCards = [...teamCards].sort((a, b) => tierOrder[a.tier] - tierOrder[b.tier]);
  const currentCards = activeTab === 'driver' ? sortedDriverCards : sortedTeamCards;

  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel || currentCards.length === 0) return;

    const updateCenterCard = () => {
      const containerRect = carousel.getBoundingClientRect();
      const containerCenter = containerRect.left + containerRect.width / 2;

      let closestCardIndex = 0;
      let closestDistance = Infinity;

      const cards = carousel.children;
      for (let i = 0; i < cards.length; i++) {
        const cardRect = cards[i].getBoundingClientRect();
        const cardCenter = cardRect.left + cardRect.width / 2;
        const distance = Math.abs(containerCenter - cardCenter);

        if (distance < closestDistance) {
          closestDistance = distance;
          closestCardIndex = i;
        }
      }

      setCenterCardIndex(closestCardIndex);
    };

    // Initial update
    updateCenterCard();

    // Update on scroll
    carousel.addEventListener('scroll', updateCenterCard);
    
    // Update when cards change
    const observer = new MutationObserver(updateCenterCard);
    observer.observe(carousel, { childList: true, subtree: true });

    return () => {
      carousel.removeEventListener('scroll', updateCenterCard);
      observer.disconnect();
    };
  }, [currentCards, activeTab]);

  const fetchData = async () => {
    try {
      if (!leagueId) {
        setError('League ID is required');
        return;
      }

      setLoading(true);
      setError(null);

      // Fetch league to get season
      const leagueData = await getLeague(leagueId);
      const season = leagueData.season || 2026;
      setLeagueSeason(season);

      // Only show deck builder for 2026+ seasons
      if (season < 2026) {
        setError('Power Cards are only available for 2026+ seasons');
        setLoading(false);
        return;
      }

      // Check if deck is locked (before first race deadline - 5 minutes before first race qualifying)
      // Get the first race of the season to check the deadline
      try {
        const racesResponse = await api.get(`/api/race/league/${leagueId}`);
        const races = racesResponse.data;
        if (Array.isArray(races) && races.length > 0) {
          // Find the first race (lowest round number)
          const firstRace = races.sort((a: any, b: any) => a.round - b.round)[0];
          if (firstRace) {
            // Use sprint qualifying if sprint weekend, otherwise regular qualifying
            const qualifyingTime = firstRace.isSprintWeekend && firstRace.sprintQualifyingStart
              ? new Date(firstRace.sprintQualifyingStart)
              : new Date(firstRace.qualifyingStart);
            
            const deadline = new Date(qualifyingTime.getTime() - 5 * 60 * 1000); // 5 minutes before
            const now = new Date();
            setIsDeckLocked(now >= deadline);
          }
        }
      } catch (error) {
        console.error('Error checking deck lock status:', error);
        // If we can't check, assume unlocked (safer default)
        setIsDeckLocked(false);
      }

      // Fetch all cards
      console.log('DeckBuilder: Fetching player cards...');
      const cardsData = await getPlayerCards(leagueId);
      console.log('DeckBuilder: Received cards data:', cardsData);
      
      // Ensure we have arrays even if API returns undefined
      if (cardsData && cardsData.driverCards && cardsData.teamCards) {
        setDriverCards(cardsData.driverCards);
        setTeamCards(cardsData.teamCards);
      } else {
        console.error('DeckBuilder: Invalid cards data structure:', cardsData);
        setError('Failed to load cards data. Please try refreshing the page.');
        setLoading(false);
        return;
      }

      // Try to fetch existing deck
      try {
        const deckData = await getPlayerDeck(leagueId);
        if (deckData.driverCards.length > 0 || deckData.teamCards.length > 0) {
          setExistingDeck({
            driverCards: deckData.driverCards,
            teamCards: deckData.teamCards
          });
          setSelectedDriverCards(deckData.driverCards.map(c => c._id));
          setSelectedTeamCards(deckData.teamCards.map(c => c._id));
        }
      } catch (err) {
        // No deck exists yet, that's fine
        console.log('No existing deck found');
      }
    } catch (err: any) {
      console.error('Error fetching data:', err);
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.message || 
                          err.message || 
                          'Failed to load deck data';
      setError(errorMessage);
      console.error('Full error details:', {
        message: errorMessage,
        status: err.response?.status,
        data: err.response?.data
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (cardId: string, cardType: 'driver' | 'team') => {
    // Prevent card selection if user was dragging
    if (hasDragged) return;
    
    // If deck exists, only allow editing when isEditing is true
    if (existingDeck && !isEditing) return;
    // If deck is locked and not editing, don't allow changes
    if (isDeckLocked && !isEditing) return;

    if (cardType === 'driver') {
      // Check gold driver card limit (max 2)
      const clickedCard = driverCards.find(c => c._id === cardId);
      if (clickedCard && clickedCard.tier === 'gold') {
        const selectedDriverCardsData = driverCards.filter(c => selectedDriverCards.includes(c._id));
        const goldDriverCardsCount = selectedDriverCardsData.filter(c => c.tier === 'gold').length;
        
        // If clicking a gold card and we already have 2 selected (and this one isn't selected), prevent it
        if (goldDriverCardsCount >= 2 && !selectedDriverCards.includes(cardId)) {
          setError('Maximum 2 Gold Driver cards allowed. Please deselect a Gold Driver card first.');
          return;
        }
      }
      
      setSelectedDriverCards(prev => {
        if (prev.includes(cardId)) {
          return prev.filter(id => id !== cardId);
        } else {
          return [...prev, cardId];
        }
      });
      setError(null); // Clear error when successfully selecting/deselecting
    } else {
      // For team cards, check gold card limit (max 1)
      const clickedCard = teamCards.find(c => c._id === cardId);
      if (clickedCard && clickedCard.tier === 'gold') {
        // Check if we already have a gold team card selected
        const selectedTeamCardsData = teamCards.filter(c => selectedTeamCards.includes(c._id));
        const goldTeamCardsCount = selectedTeamCardsData.filter(c => c.tier === 'gold').length;
        
        // If clicking a gold card and we already have one selected (and this one isn't selected), prevent it
        if (goldTeamCardsCount >= 1 && !selectedTeamCards.includes(cardId)) {
          setError('Maximum 1 Gold Team card allowed. Please deselect the current Gold Team card first.');
          return;
        }
      }
      
      setSelectedTeamCards(prev => {
        if (prev.includes(cardId)) {
          return prev.filter(id => id !== cardId);
        } else {
          return [...prev, cardId];
        }
      });
      setError(null); // Clear error when successfully selecting/deselecting
    }
  };

  const handleReset = () => {
    setSelectedDriverCards([]);
    setSelectedTeamCards([]);
    // If editing an existing deck, reset to the original deck
    if (isEditing && existingDeck) {
      setSelectedDriverCards(existingDeck.driverCards.map(c => c._id));
      setSelectedTeamCards(existingDeck.teamCards.map(c => c._id));
    }
  };

  const handleSave = async () => {
    try {
      setError(null);
      setSuccessMessage(null);

      await selectDeck(leagueId!, {
        driverCardIds: selectedDriverCards,
        teamCardIds: selectedTeamCards
      });

      setSuccessMessage('Deck saved successfully!');
      setIsEditing(false);
      await fetchData(); // Refresh to get updated deck
    } catch (err: any) {
      console.error('Error saving deck:', err);
      setError(err.response?.data?.error || 'Failed to save deck');
    }
  };

  // Calculate slot usage
  const getSelectedDriverCardsData = () => {
    return driverCards.filter(c => selectedDriverCards.includes(c._id));
  };

  const getSelectedTeamCardsData = () => {
    return teamCards.filter(c => selectedTeamCards.includes(c._id));
  };

  const driverCardsData = getSelectedDriverCardsData();
  const teamCardsData = getSelectedTeamCardsData();

  const driverSlotsUsed = driverCardsData.reduce((sum, card) => sum + card.slotCost, 0);
  const teamSlotsUsed = teamCardsData.reduce((sum, card) => sum + card.slotCost, 0);
  const goldDriverCardsCount = driverCardsData.filter(c => c.tier === 'gold').length;
  const goldTeamCardsCount = teamCardsData.filter(c => c.tier === 'gold').length;

  const driverCardsCount = selectedDriverCards.length;
  const teamCardsCount = selectedTeamCards.length;

  // Validation
  const driverSlotsRemaining = 12 - driverSlotsUsed;
  const teamSlotsRemaining = 10 - teamSlotsUsed;

  // Deck is complete when all slots are used (not when card count is reached)
  const isDriverDeckComplete = driverSlotsUsed === 12;
  const isTeamDeckComplete = teamSlotsUsed === 10;
  const isDeckComplete = isDriverDeckComplete && isTeamDeckComplete;

  // Carousel drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!carouselRef.current) return;
    setIsDragging(true);
    setHasDragged(false);
    setStartX(e.pageX - carouselRef.current.offsetLeft);
    setScrollLeft(carouselRef.current.scrollLeft);
    carouselRef.current.style.cursor = 'grabbing';
    carouselRef.current.style.userSelect = 'none';
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !carouselRef.current) return;
    e.preventDefault();
    const x = e.pageX - carouselRef.current.offsetLeft;
    const walk = (x - startX) * 2; // Scroll speed multiplier
    carouselRef.current.scrollLeft = scrollLeft - walk;
    
    // Track if user actually dragged (moved more than 5px)
    if (Math.abs(walk) > 5) {
      setHasDragged(true);
    }
  };

  const handleMouseUp = () => {
    if (!carouselRef.current) return;
    setIsDragging(false);
    carouselRef.current.style.cursor = 'grab';
    carouselRef.current.style.userSelect = 'auto';
    // Reset hasDragged after a short delay to allow click handlers to check it
    setTimeout(() => setHasDragged(false), 100);
  };

  const handleMouseLeave = () => {
    if (!carouselRef.current) return;
    setIsDragging(false);
    carouselRef.current.style.cursor = 'grab';
    carouselRef.current.style.userSelect = 'auto';
    setTimeout(() => setHasDragged(false), 100);
  };
  
  // Check if current tab's deck is complete
  const isCurrentTabComplete = activeTab === 'driver' ? isDriverDeckComplete : isTeamDeckComplete;

  const validationErrors: string[] = [];
  if (driverSlotsUsed > 12) validationErrors.push('Maximum 12 driver card slots allowed');
  if (driverSlotsUsed < 12 && selectedDriverCards.length > 0) validationErrors.push('You must use all 12 driver card slots');
  if (goldDriverCardsCount > 2) validationErrors.push('Maximum 2 Gold driver cards allowed');
  if (teamSlotsUsed > 10) validationErrors.push('Maximum 10 team card slots allowed');
  if (teamSlotsUsed < 10 && selectedTeamCards.length > 0) validationErrors.push('You must use all 10 team card slots');
  if (goldTeamCardsCount > 1) validationErrors.push('Maximum 1 Gold team card allowed');

  const canSave = isDeckComplete && validationErrors.length === 0 && (!isDeckLocked || isEditing);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <AppLogoSpinner size="lg" />
      </div>
    );
  }

  if (error && !driverCards.length && !teamCards.length) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-2xl text-center">
          <p className="mb-4">{error}</p>
        </div>
      </div>
    );
  }

  const selectedCards = activeTab === 'driver' ? selectedDriverCards : selectedTeamCards;
  const cardsCount = activeTab === 'driver' ? driverCardsCount : teamCardsCount;
  const slotsUsed = activeTab === 'driver' ? driverSlotsUsed : teamSlotsUsed;
  const maxSlots = activeTab === 'driver' ? 12 : 10;
  const slotsRemaining = activeTab === 'driver' ? driverSlotsRemaining : teamSlotsRemaining;

  return (
    <>
      {/* Background wrapper */}
      <div 
        className="fixed inset-0 w-full h-full"
        style={{
          backgroundImage: 'url("/My_deck_background.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
          backgroundRepeat: 'no-repeat',
          backgroundColor: '#000000'
        }}
      />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col px-4 py-2 md:px-6 md:py-4" style={{ overflow: 'visible', overflowX: 'hidden', overflowY: 'visible' }}>
        {/* Header */}
        <div className="mb-2 flex-shrink-0 max-w-7xl mx-auto w-full">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">Build Your Power Card Deck</h1>
          {isDeckLocked && (
            <div className="flex items-center gap-2 text-yellow-400 mb-2 text-sm">
              <IconWrapper icon={FaLock} />
              <span>Deck is locked. The season has started.</span>
            </div>
          )}
        </div>

        {/* Success/Error Messages */}
        <div className="max-w-7xl mx-auto w-full">
          {successMessage && (
            <div className="mb-2 p-2 bg-green-500/20 border border-green-500/50 rounded-lg text-green-300 text-sm flex-shrink-0">
              {successMessage}
            </div>
          )}
          {error && (
            <div className="mb-2 p-2 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm flex-shrink-0">
              {error}
            </div>
          )}
          {validationErrors.length > 0 && (
            <div className="mb-2 p-2 bg-red-500/20 border border-red-500/50 rounded-lg flex-shrink-0">
              <ul className="list-disc list-inside text-red-300">
                {validationErrors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Tab Switcher */}
        <div className="mb-2 flex gap-4 justify-center flex-shrink-0 max-w-7xl mx-auto w-full">
          <button
            onClick={() => setActiveTab('driver')}
            className={`px-4 py-2 md:px-6 md:py-3 rounded-lg font-bold text-sm md:text-base transition-all backdrop-blur-sm border-2 ${
              activeTab === 'driver'
                ? 'bg-red-600 text-white border-red-500 shadow-lg'
                : 'bg-white/10 text-white/70 hover:bg-white/20 border-white/20'
            }`}
          >
            Driver Cards
          </button>
          <button
            onClick={() => setActiveTab('team')}
            className={`px-4 py-2 md:px-6 md:py-3 rounded-lg font-bold text-sm md:text-base transition-all backdrop-blur-sm border-2 ${
              activeTab === 'team'
                ? 'bg-red-600 text-white border-red-500 shadow-lg'
                : 'bg-white/10 text-white/70 hover:bg-white/20 border-white/20'
            }`}
          >
            Team Cards
          </button>
        </div>

        {/* Stats Bar */}
        <div className="mb-2 backdrop-blur-sm bg-black/20 rounded-lg p-2 md:p-3 border border-white/10 flex-shrink-0 max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-white/70 text-sm mb-1">Cards Selected</div>
              <div className="text-2xl font-bold text-white">
                {cardsCount}
              </div>
            </div>
            <div>
              <div className="text-white/70 text-sm mb-1">Slots Used</div>
              <div className={`text-2xl font-bold ${slotsUsed === maxSlots ? 'text-green-400' : slotsUsed > maxSlots ? 'text-red-400' : 'text-white'}`}>
                {slotsUsed}/{maxSlots}
              </div>
            </div>
            <div>
              <div className="text-white/70 text-sm mb-1">Slots Remaining</div>
              <div className={`text-2xl font-bold ${slotsRemaining === 0 ? 'text-green-400' : slotsRemaining < 0 ? 'text-red-400' : 'text-yellow-400'}`}>
                {slotsRemaining}
              </div>
            </div>
            <div>
              <div className="text-white/70 text-sm mb-1">
                {activeTab === 'driver' ? 'Gold Driver Cards' : 'Gold Team Cards'}
              </div>
              <div className={`text-2xl font-bold ${
                activeTab === 'driver' 
                  ? (goldDriverCardsCount <= 2 ? 'text-green-400' : 'text-red-400')
                  : (goldTeamCardsCount <= 1 ? 'text-green-400' : 'text-red-400')
              }`}>
                {activeTab === 'driver' ? `${goldDriverCardsCount}/2` : `${goldTeamCardsCount}/1`}
              </div>
            </div>
          </div>
        </div>

        {/* Cards Carousel */}
        {currentCards.length === 0 ? (
          <div className="text-center text-white/70 py-8 flex items-center justify-center max-w-7xl mx-auto w-full">
            <p className="text-lg">No cards available</p>
          </div>
        ) : (
          <div className="relative mb-2 max-w-7xl mx-auto w-full" style={{ paddingTop: '20px', paddingBottom: '20px', overflow: 'visible', position: 'relative', zIndex: 10 }}>
            {/* Cards Container */}
            <div
              ref={carouselRef}
              className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory cursor-grab relative"
              style={{
                scrollBehavior: 'smooth',
                overflowY: 'visible',
                overflowX: 'auto',
                paddingTop: '20px',
                paddingBottom: '50px',
                paddingLeft: '16px',
                paddingRight: '16px',
                alignItems: 'flex-start'
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
            >
              {currentCards.map((card, index) => {
              const isSelected = selectedCards.includes(card._id);
              const canSelect = !isDeckLocked || isEditing;
              const isCenterCard = centerCardIndex === index;
              
              // Check if gold card limit is reached
              let isGoldLimitReached = false;
              if (card.tier === 'gold' && !isSelected) {
                if (activeTab === 'driver') {
                  isGoldLimitReached = goldDriverCardsCount >= 2;
                } else {
                  isGoldLimitReached = goldTeamCardsCount >= 1;
                }
              }
              
              const isDisabled = !canSelect || isGoldLimitReached;
              
              return (
                <div
                  key={card._id}
                  onClick={() => !isDisabled && handleCardClick(card._id, activeTab)}
                  className={`rounded-lg border-2 transition-all duration-300 snap-center flex flex-col ${
                    isCenterCard 
                      ? 'md:w-56 lg:w-64 z-20 shadow-2xl' 
                      : 'md:w-40 lg:w-44 z-10'
                  } ${
                    isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                  } ${
                    isSelected
                      ? ''
                      : 'border-white/20 hover:border-white/40'
                  }`}
                  style={{
                    borderColor: isSelected ? tierColors[card.tier] : undefined,
                    transform: isCenterCard ? 'scale(1.1) translateY(-15px)' : 'scale(1)',
                    width: isCenterCard 
                      ? 'min(88vw, 360px)' 
                      : 'min(75vw, 300px)',
                    aspectRatio: '744 / 1039',
                    height: 'auto',
                    flex: '0 0 auto',
                    flexShrink: 0,
                    transformOrigin: 'center center'
                  }}
                >
                  {/* Card Image Container - Uniform sizing */}
                  <div className="w-full h-full rounded-lg overflow-hidden relative">
                    <img
                      src={getCardImagePath(card.name, activeTab)}
                      alt={card.name}
                      className="w-full h-full object-contain object-center"
                      onError={(e) => {
                        // Fallback to data URI placeholder if image doesn't exist
                        const target = e.target as HTMLImageElement;
                        target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2RkZCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';
                        target.onerror = null; // Prevent infinite loop
                      }}
                    />
                    
                    {/* Tier Badge - Overlay on image */}
                    <div className="absolute top-2 left-2 z-10">
                      <div
                        className="px-2 py-1 rounded text-xs font-bold"
                        style={{
                          backgroundColor: tierColors[card.tier],
                          color: tierTextColors[card.tier]
                        }}
                      >
                        {card.tier.toUpperCase()}
                      </div>
                    </div>

                    {/* Selected Indicator - Overlay on image */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 z-10">
                        <div className="bg-green-500 rounded-full p-1">
                          <IconWrapper icon={FaCheck} className="text-white text-xs" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            </div>

            {/* Navigation Arrows - At bottom of cards container */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex gap-4">
              <button
                onClick={() => {
                  if (carouselRef.current) {
                    carouselRef.current.scrollBy({ left: -320, behavior: 'smooth' });
                  }
                }}
                className="bg-black/60 hover:bg-black/80 text-white p-3 rounded-full backdrop-blur-sm transition-all shadow-lg"
                aria-label="Previous cards"
              >
                <IconWrapper icon={FaChevronLeft} size={20} />
              </button>
              <button
                onClick={() => {
                  if (carouselRef.current) {
                    carouselRef.current.scrollBy({ left: 280, behavior: 'smooth' });
                  }
                }}
                className="bg-black/60 hover:bg-black/80 text-white p-3 rounded-full backdrop-blur-sm transition-all shadow-lg"
                aria-label="Next cards"
              >
                <IconWrapper icon={FaChevronRight} size={20} />
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center flex-shrink-0 mt-2 max-w-7xl mx-auto w-full">
          {existingDeck && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              disabled={isDeckLocked}
              className={`px-6 py-3 rounded-lg font-bold transition-all flex items-center gap-2 ${
                isDeckLocked
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              <IconWrapper icon={FaEdit} />
              Edit Deck
            </button>
          )}
          {(!existingDeck || isEditing) && (
            <>
              <button
                onClick={handleReset}
                disabled={isDeckLocked && !isEditing}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <IconWrapper icon={FaRedo} />
                Reset
              </button>
              {isEditing && existingDeck && (
                <button
                  onClick={() => {
                    // Restore original deck selections
                    setSelectedDriverCards(existingDeck.driverCards.map(c => c._id));
                    setSelectedTeamCards(existingDeck.teamCards.map(c => c._id));
                    setIsEditing(false);
                  }}
                  className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
                >
                  <IconWrapper icon={FaTimes} />
                  Cancel Edit
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={!canSave}
                className={`px-6 py-3 rounded-lg font-bold transition-all flex items-center gap-2 ${
                  canSave
                    ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg animate-pulse'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50'
                }`}
              >
                <IconWrapper icon={FaCheck} />
                {existingDeck ? 'Update Deck' : 'Save Deck'}
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default DeckBuilder;

