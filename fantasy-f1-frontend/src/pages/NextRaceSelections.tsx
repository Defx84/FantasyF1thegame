import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getNextRaceTiming, RaceTiming } from '../services/raceService';
import { getUsedSelections, saveSelections, getCurrentSelections, Selection, UsedSelections } from '../services/selectionService';
import IconWrapper from '../utils/iconWrapper';
import { FaLock, FaEdit, FaCheck, FaTimes, FaArrowLeft, FaSyncAlt } from 'react-icons/fa';
import { teamColors } from '../constants/teamColors';
import { drivers as allDrivers, teams as allTeams, driverTeams } from '../utils/validation';
import { getTimeUntilLock, isSelectionsLocked, formatTimeLeft } from '../utils/raceUtils';
import { normalizeDriver, normalizeTeam } from '../utils/normalization';
import { api } from '../services/api';

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

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const NextRaceSelections: React.FC = () => {
  const navigate = useNavigate();
  const { leagueId } = useParams<{ leagueId: string }>();
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
    usedMainDrivers: [],
    usedReserveDrivers: [],
    usedTeams: []
  });
  const [switcherooCount, setSwitcherooCount] = useState<number | null>(null);
  const [switcherooTotal, setSwitcherooTotal] = useState<number>(3);
  const [switcherooLoading, setSwitcherooLoading] = useState(true);
  const [switcherooError, setSwitcherooError] = useState<string | null>(null);
  const [isSwitcherooWindow, setIsSwitcherooWindow] = useState(false);
  const [raceStatus, setRaceStatus] = useState<string | null>(null);
  const [lastSwitcherooWindowFetch, setLastSwitcherooWindowFetch] = useState<number>(0);

  // Map drivers to our interface
  const drivers: Driver[] = allDrivers.map(name => ({
    id: name.toLowerCase(),
    name,
    team: driverTeams[name],
    teamColor: teamColors[driverTeams[name]] || '#FFFFFF'
  }));

  // Map teams to our interface
  const teams: Team[] = allTeams.map(name => ({
    id: name.toLowerCase(),
    name,
    color: teamColors[name]
  }));

  const fetchData = async () => {
    try {
      if (!leagueId) {
        setError('League ID is required');
        return;
      }

      setLoading(true);
      // Fetch the next race timing
      const raceTiming = await getNextRaceTiming();
      // Use the round from raceTiming
      const round = raceTiming?.round;
      // Only fetch used selections if round is available
      let usedSelectionsData: UsedSelections = { usedMainDrivers: [], usedReserveDrivers: [], usedTeams: [] };
      if (round) {
        usedSelectionsData = await getUsedSelections(leagueId, round);
      }
      // Fetch current selections
      const currentSelectionsData = await getCurrentSelections(leagueId);

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
    // Only advance to next race after endOfWeekend
    const now = new Date();
    const endOfWeekend = raceData.endOfWeekend ? new Date(raceData.endOfWeekend) : null;
    if (endOfWeekend && now > endOfWeekend) {
      // Optionally, trigger logic to advance to next race here
      // For now, just lock the UI (or you could trigger a refetch for the next race)
      setIsLocked(true);
      return;
    }
    if (raceStatus === 'completed') {
      setIsLocked(true);
      return;
    }
    if (timeUntilDeadline <= 0) {
      setIsLocked(true);
      return;
    }
    const timer = setInterval(() => {
      const newTimeLeft = getTimeUntilLock(raceData);
      setTimeUntilDeadline(newTimeLeft);
      setIsLocked(isSelectionsLocked(raceData));
    }, 1000);
    return () => clearInterval(timer);
  }, [raceData, timeUntilDeadline, raceStatus]);

  const handleSelection = (type: keyof Selection, id: string) => {
    // Allow selection if editing or if no selections have been made yet
    if (isLocked || (!isEditing && currentSelections && 
      (currentSelections.mainDriver || 
       currentSelections.reserveDriver || 
       currentSelections.team))) return;

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
      await fetchData(); // Refresh data after saving
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

  const isDriverUsed = (driverId: string, type: 'main' | 'reserve'): boolean => {
    const usedList = type === 'main' ? usedSelections.usedMainDrivers : usedSelections.usedReserveDrivers;
    const normalizedDriverId = normalizeDriver(driverId);
    const result = usedList.some(usedDriver => normalizeDriver(usedDriver) === normalizedDriverId);
    console.log(`Checking if used: ${driverId} => ${normalizedDriverId} | result: ${result}`);
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
    const normalizedCurrent = normalizeDriver(currentValue);
    const normalizedId = normalizeDriver(id);
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

  // Helper function to get item style
  const getItemStyle = (type: keyof Selection, id: string, color: string) => {
    const selected = isItemSelected(type, id);
    return {
      backgroundColor: selected ? color : `${color}10`,
      minHeight: '1.8rem', // Reduced from 2.5rem to 1.8rem
    };
  };

  // Helper function to get item class names
  const getItemClassNames = (type: keyof Selection, id: string) => {
    const selected = isItemSelected(type, id);
    const isUsed = (type === 'mainDriver' || type === 'reserveDriver') 
      ? isDriverUsed(id, type === 'mainDriver' ? 'main' : 'reserve')
      : isTeamUsed(id);

    return `w-full px-2 py-1 rounded-lg border transition-all duration-200 relative ${
      selected ? 'border-2 border-white bg-opacity-100' : 'border border-white/20 hover:border-white/60'
    } ${isUsed ? 'opacity-40 cursor-not-allowed filter grayscale before:absolute before:content-["" ] before:left-0 before:right-0 before:top-1/2 before:-translate-y-1/2 before:h-[2px] before:bg-[#FFD600] before:pointer-events-none' : 'hover:bg-opacity-100'}`;
  };

  // Helper function to get item status text
  const getItemStatusText = (type: keyof Selection, id: string) => {
    const isUsed = (type === 'mainDriver' || type === 'reserveDriver') 
      ? isDriverUsed(id, type === 'mainDriver' ? 'main' : 'reserve')
      : isTeamUsed(id);

    if (isUsed) {
      return <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-red-600 font-bold tracking-wider z-10">USED</span>;
    }
    return null;
  };

  // Update the renderDriverButton function
  const renderDriverButton = (driver: Driver, type: 'mainDriver' | 'reserveDriver') => {
    const isUsed = isDriverUsed(driver.id, type === 'mainDriver' ? 'main' : 'reserve');
    // Debug log
    console.log(`[${type}] Button:`, {
      driverId: driver.id,
      normalizedId: normalizeDriver(driver.id),
      usedList: (type === 'mainDriver' ? usedSelections.usedMainDrivers : usedSelections.usedReserveDrivers).map(normalizeDriver)
    });
    return (
      <button
        key={driver.id}
        onClick={() => handleSelection(type, driver.id)}
        className={getItemClassNames(type, driver.id)}
        style={getItemStyle(type, driver.id, driver.teamColor)}
        disabled={isUsed || isLocked}
      >
        {isItemSelected(type, driver.id) && (
          <IconWrapper icon={FaCheck} className="absolute left-2 top-1/2 -translate-y-1/2 text-white text-xs z-10" />
        )}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-xs ${isItemSelected(type, driver.id) ? 'text-white font-medium pl-4' : ''}`}>
            {driver.name}
          </span>
        </div>
      </button>
    );
  };

  // Update the renderTeamButton function
  const renderTeamButton = (team: Team) => {
    const isUsed = isTeamUsed(team.id);
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
        style={getItemStyle('team', team.id, team.color)}
        disabled={isUsed || isLocked}
      >
        {isItemSelected('team', team.id) && (
          <IconWrapper icon={FaCheck} className="absolute left-2 top-1/2 -translate-y-1/2 text-white text-xs z-10" />
        )}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-xs ${isItemSelected('team', team.id) ? 'text-white font-medium pl-4' : ''}`}>
            {team.name}
          </span>
        </div>
      </button>
    );
  };

  // Add this near the top of your component
  const getSelectionStats = () => {
    return {
      mainDriversUsed: usedSelections.usedMainDrivers.length,
      reserveDriversUsed: usedSelections.usedReserveDrivers.length,
      teamsUsed: usedSelections.usedTeams.length,
      mainDriversRemaining: 20 - usedSelections.usedMainDrivers.length,
      reserveDriversRemaining: 20 - usedSelections.usedReserveDrivers.length,
      teamsRemaining: 10 - usedSelections.usedTeams.length
    };
  };

  // Add debug logging
  useEffect(() => {
    console.log('Used Selections:', {
      mainDrivers: usedSelections.usedMainDrivers.map(d => ({ original: d, normalized: normalizeDriver(d) })),
      reserveDrivers: usedSelections.usedReserveDrivers.map(d => ({ original: d, normalized: normalizeDriver(d) })),
      teams: usedSelections.usedTeams.map(t => ({ original: t, normalized: normalizeTeam(t) }))
    });
  }, [usedSelections]);

  useEffect(() => {
    // Log all normalized driver options
    console.log('🔍 Normalized Main Driver Options:');
    allDrivers.forEach(driver => {
      const normalized = normalizeDriver(driver);
      console.log(`${driver} => ${normalized}`);
    });
    // Log all normalized team options
    console.log('🔍 Normalized Team Options:');
    allTeams.forEach(team => {
      const normalized = normalizeTeam(team);
      console.log(`${team} => ${normalized}`);
    });
    // Log used selections from API
    console.log('📦 Used Selections from API:', usedSelections);
    // Log normalized used selections
    console.log('🧩 Normalized usedMainDrivers:', usedSelections.usedMainDrivers.map(normalizeDriver));
    console.log('🧩 Normalized usedReserveDrivers:', usedSelections.usedReserveDrivers.map(normalizeDriver));
    console.log('🧩 Normalized usedTeams:', usedSelections.usedTeams.map(normalizeTeam));
  }, [allDrivers, allTeams, usedSelections]);

  // Helper to chunk drivers into pairs
  function chunkArray<T>(arr: T[], size: number): T[][] {
    const result: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      result.push(arr.slice(i, i + size));
    }
    return result;
  }

  // Fetch switcheroo count
  const fetchSwitcherooCount = async () => {
    setSwitcherooLoading(true);
    setSwitcherooError(null);
    try {
      const accessToken = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/switcheroo/remaining?leagueId=${leagueId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      );
      if (!res.ok) throw new Error('Failed to fetch switcheroo count');
      const data = await res.json();
      setSwitcherooCount(data.remaining);
      setSwitcherooTotal(data.total || 3);
    } catch (err: any) {
      setSwitcherooError('Could not load switcheroo info');
    } finally {
      setSwitcherooLoading(false);
    }
  };

  useEffect(() => {
    fetchSwitcherooCount();
  }, []);

  const fetchSwitcherooWindowStatus = async () => {
    const now = Date.now();
    if (now - lastSwitcherooWindowFetch < 30000) return; // Only fetch once every 30 seconds
    setLastSwitcherooWindowFetch(now);
    try {
      const response = await api.get('/api/switcheroo/window-status', {
        params: { raceId: raceData?.round }
      });
      setIsSwitcherooWindow(response.data.isSwitcherooAllowed);
    } catch (error) {
      console.error('Error fetching switcheroo window status:', error);
    }
  };

  useEffect(() => {
    if (raceData?.round) {
      fetchSwitcherooWindowStatus();
    }
  }, [raceData]);

  // Switcheroo handler
  const handleSwitcheroo = async () => {
    if (!currentSelections || !currentSelections.mainDriver || !currentSelections.reserveDriver || !leagueId) return;
    try {
      setSwitcherooLoading(true);
      // Call the switcheroo endpoint to perform the swap on the backend
      await api.post('/api/switcheroo', {
        raceId: raceData?.round,
        leagueId,
        originalDriver: currentSelections.mainDriver,
        newDriver: currentSelections.reserveDriver,
      });
      await fetchSwitcherooCount(); // Refresh switcheroo count
      await fetchData(); // Refresh selections
    } catch (err) {
      setSwitcherooError('Switcheroo failed');
    } finally {
      setSwitcherooLoading(false);
    }
  };

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
          backgroundImage: 'url("/selections.webp")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed',
        }}
      />
      {/* Main content wrapper */}
      <div className="relative w-full flex flex-col bg-transparent text-white z-10">
        <div className="flex-1 container mx-auto px-4 py-8 pt-16">
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

          {/* Main content area with selections and utility panel */}
          <div className="flex flex-col lg:flex-row max-w-7xl mx-auto gap-6">
            {/* Selection columns */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Main Driver */}
              <div className="backdrop-blur-sm bg-black/20 rounded-lg p-3 flex flex-col max-h-[calc(100vh-180px)]">
                <h3 className="text-lg font-bold mb-2 text-center">Main Driver</h3>
                <div className="flex-1 grid grid-cols-2 gap-2 overflow-y-auto scrollbar-thin scrollbar-thumb-red-500/50 scrollbar-track-transparent pr-2">
                  {chunkArray(drivers, 2).map((pair, idx) => (
                    <React.Fragment key={idx}>
                      {pair.map(driver => renderDriverButton(driver, 'mainDriver'))}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* Reserve Driver */}
              <div className="backdrop-blur-sm bg-black/20 rounded-lg p-3 flex flex-col max-h-[calc(100vh-180px)]">
                <h3 className="text-lg font-bold mb-2 text-center">Reserve Driver</h3>
                <div className="flex-1 grid grid-cols-2 gap-2 overflow-y-auto scrollbar-thin scrollbar-thumb-red-500/50 scrollbar-track-transparent pr-2">
                  {chunkArray(drivers, 2).map((pair, idx) => (
                    <React.Fragment key={idx}>
                      {pair.map(driver => renderDriverButton(driver, 'reserveDriver'))}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* Teams */}
              <div className="backdrop-blur-sm bg-black/20 rounded-lg p-3 flex flex-col max-h-[calc(100vh-180px)]">
                <h3 className="text-lg font-bold mb-2 text-center">Team</h3>
                <div className="flex-1 space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-red-500/50 scrollbar-track-transparent pr-2">
                  {teams.map(team => renderTeamButton(team))}
                </div>
              </div>
            </div>

            {/* Utility panel with Switcheroo and main actions */}
            <div className="w-full lg:w-64 flex flex-col justify-center mt-6 lg:mt-0">
              <div className="backdrop-blur-sm bg-black/20 rounded-lg p-6 text-center space-y-4">
                <div className="flex flex-col items-center gap-4">
                  <button
                    className={`w-full flex items-center justify-center gap-2 px-6 py-4 rounded-lg font-bold text-xl transition-all duration-200 relative overflow-hidden
                      ${isSwitcherooWindow && switcherooCount && switcherooCount > 0 
                        ? 'before:absolute before:inset-0 before:bg-[repeating-linear-gradient(-45deg,#FFD700,#FFD700_10px,#000_10px,#000_20px)] hover:brightness-110 shadow-lg text-black' 
                        : 'bg-gray-600 text-gray-300 cursor-not-allowed'}`}
                    disabled={!isSwitcherooWindow || !switcherooCount || switcherooCount <= 0}
                    title={isSwitcherooWindow ? (switcherooCount && switcherooCount > 0 ? 'Switcheroo available!' : 'No switcheroos left') : 'Switcheroo not available now'}
                    onClick={handleSwitcheroo}
                  >
                    <div className="relative z-10 flex items-center justify-center gap-2 bg-yellow-400/90 w-full h-full rounded-lg py-2">
                      <IconWrapper icon={FaSyncAlt} className="text-2xl" />
                      Switcheroo
                    </div>
                  </button>
                  <div className="text-center">
                    <div className="text-sm font-semibold text-white/80 uppercase tracking-wider mb-1">Switcheroos Left</div>
                    <div className={`text-2xl font-bold ${switcherooCount && switcherooCount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {switcherooLoading ? '...' : (switcherooCount ?? '?')}/{switcherooTotal}
                    </div>
                  </div>
                  <div className="text-sm font-medium">
                    {isSwitcherooWindow && switcherooCount && switcherooCount > 0 ? (
                      <span className="text-green-400">Available Now!</span>
                    ) : (
                      <span className="text-gray-400">Currently Unavailable</span>
                    )}
                  </div>
                </div>
                {/* Main action buttons */}
                <div className="flex flex-col gap-3 mt-6">
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
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default NextRaceSelections; 