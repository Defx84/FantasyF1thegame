import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaEdit, FaCheck, FaTimes, FaUserShield, FaInfoCircle } from 'react-icons/fa';
import IconWrapper from '../utils/iconWrapper';
import { api } from '../services/api';
import { getDrivers, getTeams } from '../utils/validation';
import { adminOverrideSelection, getUsedSelections, UsedSelections } from '../services/selectionService';
import { normalizeDriverForSeason, normalizeTeamForSeason } from '../constants/f1DataLoader';
import type { FC } from 'react';
import AppLogoSpinner from '../components/AppLogoSpinner';
import AvatarImage from '../components/Avatar/AvatarImage';

interface Selection {
  _id: string;
  userId: string;
  username: string;
  mainDriver: string;
  reserveDriver: string;
  team: string;
  points: number;
  isAdminAssigned: boolean;
  assignedBy?: string;
  assignedAt?: string;
  notes?: string;
}

interface RaceDetails {
  raceName: string;
  circuit: string;
  country: string;
  date: string;
  round: number;
  _id: string;
}

interface LeagueMember {
  id: string;
  _id: string;
  username: string;
}

interface LeagueResponse {
  _id: string;
  name: string;
  members: LeagueMember[];
}

interface EditFormState {
  mainDriver: string;
  reserveDriver: string;
  team: string;
  notes: string;
}

interface UsedSelectionsMap {
  [userId: string]: UsedSelections;
}

const InfoIcon = FaInfoCircle as unknown as FC<{ size?: number }>;

const RaceDetails: React.FC = () => {
  const { leagueId, round } = useParams<{ leagueId: string; round: string }>();
  const navigate = useNavigate();
  const [raceDetails, setRaceDetails] = useState<RaceDetails | null>(null);
  const [selections, setSelections] = useState<Selection[]>([]);
  const [leagueMembers, setLeagueMembers] = useState<LeagueMember[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editForms, setEditForms] = useState<{ [userId: string]: EditFormState }>({});
  const [usedSelections, setUsedSelections] = useState<UsedSelectionsMap>({});
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipTimeout = useRef<NodeJS.Timeout | null>(null);
  const [leagueSeason, setLeagueSeason] = useState<number>(2026); // Default to 2026

  // Get available drivers and teams based on season
  const availableDrivers = getDrivers(leagueSeason);
  const availableTeams = getTeams(leagueSeason);

  // Helper: is driver "used" (so we disable it in dropdown). On admin override we allow re-selecting the current selection for this round.
  const isDriverUsed = (userId: string, driverId: string, currentSelection?: Selection | null, role?: 'main' | 'reserve'): boolean => {
    if (currentSelection && role) {
      const current = role === 'main' ? currentSelection.mainDriver : currentSelection.reserveDriver;
      if (current && normalizeDriverForSeason(current, leagueSeason) === normalizeDriverForSeason(driverId, leagueSeason)) return false; // allow current
    }
    const userSelections = usedSelections[userId];
    if (!userSelections) return false;
    const usedList = userSelections.usedDrivers || [];
    if (!usedList) return false;
    const normalizedDriverId = normalizeDriverForSeason(driverId, leagueSeason);
    return usedList.some(usedDriver => normalizeDriverForSeason(usedDriver, leagueSeason) === normalizedDriverId);
  };

  // Helper: is team "used". On admin override we allow re-selecting the current team for this round.
  const isTeamUsed = (userId: string, teamId: string, currentSelection?: Selection | null): boolean => {
    if (currentSelection?.team && normalizeTeamForSeason(currentSelection.team, leagueSeason) === normalizeTeamForSeason(teamId, leagueSeason)) return false; // allow current
    const userSelections = usedSelections[userId];
    if (!userSelections) return false;
    const usedTeams = userSelections.usedTeams;
    if (!usedTeams) return false;
    const normalizedTeamId = normalizeTeamForSeason(teamId, leagueSeason);
    return usedTeams.some(usedTeam => normalizeTeamForSeason(usedTeam, leagueSeason) === normalizedTeamId);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [raceResponse, selectionsResponse, leagueResponse] = await Promise.all([
        api.get(`/api/race/league/${leagueId}/round/${round}`),
        api.get(`/api/selections/league/${leagueId}/race/${round}`),
        api.get(`/api/league/${leagueId}`)
      ]);

      const raceData = raceResponse.data;
      const selectionsData = selectionsResponse.data;
      const leagueData: LeagueResponse = leagueResponse.data;

      // Get season from league data
      const season = (leagueData as any).season || 2026;
      setLeagueSeason(season);

      setRaceDetails(raceData);
      setSelections(selectionsData.selections || []);
      setIsAdmin(selectionsData.isAdmin || false);
      
      if (leagueData && Array.isArray(leagueData.members)) {
        setLeagueMembers(leagueData.members);
        
        // Fetch used selections for each member
        const usedSelectionsMap: UsedSelectionsMap = {};
        if (!leagueId || !round) {
          console.warn('League ID or round is undefined');
          return;
        }
        console.log('Fetching used selections for league:', leagueId, 'round:', round);
        leagueData.members.forEach(member => {
          console.log('Member object:', member, 'leagueId:', leagueId);
        });
        await Promise.all(
          leagueData.members.map(async (member) => {
            if (member.id) {
              console.log('Calling getUsedSelections with:', { leagueId, round: parseInt(round) });
              const used = await getUsedSelections(leagueId, parseInt(round));
              usedSelectionsMap[member.id] = used;
            }
          })
        );
        setUsedSelections(usedSelectionsMap);
      } else {
        console.warn('Invalid league members data:', leagueData);
        setLeagueMembers([]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load race details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [leagueId, round]);

  useEffect(() => {
    // Log all normalized driver options
    console.log('🔍 [Admin] Normalized Main Driver Options:');
    availableDrivers.forEach(driver => {
      const normalized = normalizeDriverForSeason(driver, leagueSeason);
      console.log(`[Admin] ${driver} => ${normalized}`);
    });
    // Log all normalized team options
    console.log('🔍 [Admin] Normalized Team Options:');
    availableTeams.forEach(team => {
      const normalized = normalizeTeamForSeason(team, leagueSeason);
      console.log(`[Admin] ${team} => ${normalized}`);
    });
    // Log used selections from API for each user
    Object.entries(usedSelections).forEach(([userId, used]) => {
      if (used) {
        console.log(`📦 [Admin] Used Selections for user ${userId}:`, used);
        console.log(`[Admin] 🧩 Normalized usedDrivers:`, used.usedDrivers?.map(d => normalizeDriverForSeason(d, leagueSeason)) || []);
        console.log(`[Admin] 🧩 Normalized usedTeams:`, used.usedTeams?.map(t => normalizeTeamForSeason(t, leagueSeason)) || []);
      }
    });
  }, [availableDrivers, availableTeams, usedSelections, leagueSeason]);

  const handleEdit = async (member: LeagueMember) => {
    if (!member.id) {
      console.warn("Member is missing ID!", member);
      return;
    }
    console.log("Starting edit for member:", { id: member.id, username: member.username });
    const selection = selections.find(s => s.userId === member.id);
    
    // Fetch used selections for the target user
    try {
      const usedSelectionsResponse = await getUsedSelections(leagueId!, parseInt(round!), member.id);
      setUsedSelections(prev => ({
        ...prev,
        [member.id]: usedSelectionsResponse
      }));
    } catch (err) {
      console.error('Error fetching used selections:', err);
      setError('Failed to fetch used selections');
      return;
    }

    setEditForms(prev => {
      const newForm = {
        mainDriver: selection?.mainDriver || '',
        reserveDriver: selection?.reserveDriver || '',
        team: selection?.team || '',
        notes: selection?.notes || ''
      };
      console.log("Setting edit form for member:", { id: member.id, form: newForm });
      return {
        ...prev,
        [member.id]: newForm
      };
    });
  };

  const handleSave = async (memberId: string, withPoints: boolean) => {
    try {
      const form = editForms[memberId];
      if (!leagueId || !raceDetails || !form) {
        throw new Error('Missing required data');
      }

      await adminOverrideSelection({
        leagueId,
        userId: memberId,
        raceId: raceDetails._id,
        mainDriver: form.mainDriver,
        reserveDriver: form.reserveDriver,
        team: form.team,
        assignPoints: withPoints,
        notes: form.notes
      });
      
      // Refresh selections
      const response = await api.get(`/api/selections/league/${leagueId}/race/${round}`);
      setSelections(prevSelections => {
        return prevSelections.map(selection => 
          selection.userId === memberId 
            ? (response.data.selections as Selection[]).find((s: Selection) => s.userId === memberId) || selection
            : selection
        );
      });

      setEditForms(prev => {
        const updated = { ...prev };
        delete updated[memberId];
        return updated;
      });
    } catch (err) {
      console.error('Error saving selection:', err);
      setError('Failed to save selection');
    }
  };

  const handleCancel = (memberId: string) => {
    setEditForms(prev => {
      const updated = { ...prev };
      delete updated[memberId];
      return updated;
    });
  };

  const handleTooltipToggle = () => {
    setShowTooltip((prev) => !prev);
    if (!showTooltip) {
      if (tooltipTimeout.current) clearTimeout(tooltipTimeout.current);
      tooltipTimeout.current = setTimeout(() => setShowTooltip(false), 3000);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      setShowTooltip(false);
    };
    if (showTooltip) {
      document.addEventListener('click', handleClickOutside);
    } else {
      document.removeEventListener('click', handleClickOutside);
    }
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showTooltip]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <AppLogoSpinner size="lg" />
      </div>
    );
  }

  if (error || !raceDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-2xl">{error || 'Race not found'}</div>
      </div>
    );
  }

  return (
    <>
      {/* Background wrapper — match Race History */}
      <div 
        className="fixed inset-0 w-full h-full"
        style={{
          backgroundImage: 'url("/Race_history.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundColor: '#111827',
          filter: 'brightness(0.9)'
        }}
      />

      {/* Content wrapper */}
      <div className="relative min-h-screen">
        {/* Main content */}
        <div className="relative z-10 w-full p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            <div className="backdrop-blur-sm bg-white/[0.02] rounded-xl p-6 border border-white/5 mb-8">
              <h1 className="text-4xl font-bold text-white mb-4">{raceDetails.raceName}</h1>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-white/70">
                <p>Circuit: {raceDetails.circuit}</p>
                <p>Country: {raceDetails.country}</p>
                <p>Round: {raceDetails.round}</p>
              </div>
            </div>

            <div className="backdrop-blur-sm bg-white/[0.02] rounded-xl border border-white/5 overflow-visible relative">
              {/* Desktop Table View */}
              <div className="hidden md:block">
                <table className="w-full text-white">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="p-4 text-left">Player</th>
                      <th className="p-4 text-left">Main Driver</th>
                      <th className="p-4 text-left">Reserve Driver</th>
                      <th className="p-4 text-left">Team</th>
                      <th className="p-4 text-left">Status</th>
                      {isAdmin && <th className="p-2 md:p-4 text-left relative group">
                        <span className="flex items-center">
                          Actions
                          <span
                            className="ml-2 cursor-pointer text-blue-300 opacity-80 group-hover:opacity-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
                            onClick={e => { e.stopPropagation(); handleTooltipToggle(); }}
                            tabIndex={0}
                            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handleTooltipToggle(); }}
                            role="button"
                            aria-label="Show action legend"
                          >
                            <InfoIcon size={16} />
                          </span>
                        </span>
                        <div className={`z-50 ${showTooltip ? 'block' : 'hidden'} group-hover:block absolute bottom-0 left-1/2 -translate-x-1/2 w-64 bg-gray-900 text-white text-xs rounded-lg shadow-2xl border border-blue-400 p-3 text-center font-semibold pointer-events-none mt-2`} style={{ fontSize: '0.95rem', padding: '0.85rem' }}>
                          <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-blue-400"></div>
                          <div className="mb-1"><span className="font-bold text-red-400">Edit</span>: Edit and assign a selection to a user</div>
                          <div className="mb-1"><span className="font-bold text-green-400">Real Points</span>: Assign and calculate points from the real race</div>
                          <div><span className="font-bold text-yellow-400">0 Points</span>: Assign 0 points for a missed deadline</div>
                        </div>
                      </th>}
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      if (!Array.isArray(leagueMembers) || leagueMembers.length === 0) {
                        return (
                          <tr>
                            <td colSpan={6} className="p-4 text-center text-gray-500">
                              No league members found
                            </td>
                          </tr>
                        );
                      }

                      return leagueMembers.map(member => {
                        if (!member.id) {
                          console.warn("Member is missing ID!", member);
                        }
                        
                        const selection = selections.find(s => s.userId === member.id);
                        const isEditing = !!editForms[member.id];

                        return (
                          <tr key={member.id} className="border-b border-white/10 hover:bg-white/5">
                            <td className="p-4">
                              <div className="flex items-center">
                                <AvatarImage 
                                  userId={member.id} 
                                  username={member.username} 
                                  size={40} 
                                  className="mr-3" 
                                />
                                {member.username}
                              </div>
                            </td>
                            <td className="p-4">
                              {isEditing ? (
                                <select
                                  className="w-full bg-gray-800 text-white border border-gray-700 rounded p-2"
                                  value={editForms[member.id]?.mainDriver || ''}
                                  onChange={(e) => {
                                    const newValue = e.target.value;
                                    setEditForms(prev => ({
                                      ...prev,
                                      [member.id]: {
                                        ...prev[member.id],
                                        mainDriver: newValue
                                      }
                                    }));
                                  }}
                                >
                                  <option value="">-</option>
                                  {availableDrivers.map(driver => {
                                    const isUsed = isDriverUsed(member.id, driver, selection, 'main');
                                    return (
                                      <option 
                                        key={driver} 
                                        value={driver}
                                        disabled={isUsed}
                                        style={{ 
                                          color: isUsed ? '#666' : 'inherit',
                                          textDecoration: isUsed ? 'line-through' : 'none'
                                        }}
                                      >
                                        {driver} {isUsed ? '(Used)' : ''}
                                      </option>
                                    );
                                  })}
                                </select>
                              ) : (
                                selection?.mainDriver ? normalizeDriverForSeason(selection.mainDriver, leagueSeason) : '-'
                              )}
                            </td>
                            <td className="p-4">
                              {isEditing ? (
                                <select
                                  className="w-full bg-gray-800 text-white border border-gray-700 rounded p-2"
                                  value={editForms[member.id]?.reserveDriver || ''}
                                  onChange={(e) => {
                                    const newValue = e.target.value;
                                    setEditForms(prev => ({
                                      ...prev,
                                      [member.id]: {
                                        ...prev[member.id],
                                        reserveDriver: newValue
                                      }
                                    }));
                                  }}
                                >
                                  <option value="">-</option>
                                  {availableDrivers.map(driver => {
                                    const isUsed = isDriverUsed(member.id, driver, selection, 'reserve');
                                    return (
                                      <option 
                                        key={driver} 
                                        value={driver}
                                        disabled={isUsed}
                                        style={{ 
                                          color: isUsed ? '#666' : 'inherit',
                                          textDecoration: isUsed ? 'line-through' : 'none'
                                        }}
                                      >
                                        {driver} {isUsed ? '(Used)' : ''}
                                      </option>
                                    );
                                  })}
                                </select>
                              ) : (
                                selection?.reserveDriver ? normalizeDriverForSeason(selection.reserveDriver, leagueSeason) : '-'
                              )}
                            </td>
                            <td className="p-4">
                              {isEditing ? (
                                <select
                                  className="w-full bg-gray-800 text-white border border-gray-700 rounded p-2"
                                  value={editForms[member.id]?.team || ''}
                                  onChange={(e) => {
                                    const newValue = e.target.value;
                                    setEditForms(prev => ({
                                      ...prev,
                                      [member.id]: {
                                        ...prev[member.id],
                                        team: newValue
                                      }
                                    }));
                                  }}
                                >
                                  <option value="">-</option>
                                  {availableTeams.map(team => {
                                    const isUsed = isTeamUsed(member.id, team, selection);
                                    return (
                                      <option 
                                        key={team} 
                                        value={team}
                                        disabled={isUsed}
                                        style={{ 
                                          color: isUsed ? '#666' : 'inherit',
                                          textDecoration: isUsed ? 'line-through' : 'none'
                                        }}
                                      >
                                        {team} {isUsed ? '(Used)' : ''}
                                      </option>
                                    );
                                  })}
                                </select>
                              ) : (
                                selection?.team ? normalizeTeamForSeason(selection.team, leagueSeason) : '-'
                              )}
                            </td>
                            <td className="p-4">
                              {selection?.isAdminAssigned ? (
                                <span className="flex items-center text-yellow-500">
                                  <IconWrapper icon={FaUserShield} className="mr-1" />
                                  Admin Assigned
                                </span>
                              ) : '-'}
                            </td>
                            {isAdmin && (
                              <td className="p-2 md:p-4">
                                {isEditing ? (
                                  <div className="flex flex-col space-y-2 md:flex-row md:space-x-2 md:space-y-0">
                                    <button
                                      onClick={() => handleSave(member.id, true)}
                                      className="flex items-center gap-2 px-3 py-2 min-w-[44px] min-h-[44px] justify-center text-sm bg-green-600 hover:bg-green-700 rounded text-white"
                                    >
                                      <IconWrapper icon={FaCheck} /> Real points
                                    </button>
                                    <button
                                      onClick={() => handleSave(member.id, false)}
                                      className="flex items-center gap-2 px-3 py-2 min-w-[44px] min-h-[44px] justify-center text-sm bg-yellow-600 hover:bg-yellow-700 rounded text-white"
                                    >
                                      <IconWrapper icon={FaCheck} /> 0 points
                                    </button>
                                    <button
                                      onClick={() => handleCancel(member.id)}
                                      className="flex items-center gap-2 px-3 py-2 min-w-[44px] min-h-[44px] justify-center text-sm bg-gray-600 hover:bg-gray-700 rounded text-white"
                                    >
                                      <IconWrapper icon={FaTimes} /> Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => handleEdit(member)}
                                    className="flex items-center gap-2 px-3 py-2 min-w-[44px] min-h-[44px] justify-center text-sm bg-red-600 hover:bg-red-700 rounded text-white"
                                  >
                                    <IconWrapper icon={FaEdit} /> Edit
                                  </button>
                                )}
                              </td>
                            )}
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden p-4 space-y-4">
                {(() => {
                  if (!Array.isArray(leagueMembers) || leagueMembers.length === 0) {
                    return (
                      <div className="text-center text-gray-500 py-8">
                        No league members found
                      </div>
                    );
                  }

                  return leagueMembers.map(member => {
                    if (!member.id) {
                      console.warn("Member is missing ID!", member);
                    }
                    
                    const selection = selections.find(s => s.userId === member.id);
                    const isEditing = !!editForms[member.id];

                    return (
                      <div key={member.id} className="bg-white/[0.05] rounded-lg p-4 border border-white/10">
                        {/* Player Name Header */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center">
                            <AvatarImage 
                              userId={member.id} 
                              username={member.username} 
                              size={48} 
                              className="mr-3" 
                            />
                            <h3 className="text-lg font-semibold text-white">{member.username}</h3>
                          </div>
                          {selection?.isAdminAssigned && (
                            <span className="flex items-center text-yellow-500 text-sm">
                              <IconWrapper icon={FaUserShield} className="mr-1" />
                              Admin
                            </span>
                          )}
                        </div>

                        {/* Selections */}
                        <div className="space-y-3">
                          {/* Main Driver */}
                          <div className="flex flex-col">
                            <label className="text-sm font-medium text-white/70 mb-1">Main Driver</label>
                            {isEditing ? (
                              <select
                                className="w-full bg-gray-800 text-white border border-gray-700 rounded p-2 text-sm"
                                value={editForms[member.id]?.mainDriver || ''}
                                onChange={(e) => {
                                  const newValue = e.target.value;
                                  setEditForms(prev => ({
                                    ...prev,
                                    [member.id]: {
                                      ...prev[member.id],
                                      mainDriver: newValue
                                    }
                                  }));
                                }}
                              >
                                <option value="">-</option>
                                {availableDrivers.map(driver => {
                                  const isUsed = isDriverUsed(member.id, driver, selection, 'main');
                                  return (
                                    <option 
                                      key={driver} 
                                      value={driver}
                                      disabled={isUsed}
                                      style={{ 
                                        color: isUsed ? '#666' : 'inherit',
                                        textDecoration: isUsed ? 'line-through' : 'none'
                                      }}
                                    >
                                      {driver} {isUsed ? '(Used)' : ''}
                                    </option>
                                  );
                                })}
                              </select>
                            ) : (
                              <span className="text-white text-sm">
                                {selection?.mainDriver ? normalizeDriverForSeason(selection.mainDriver, leagueSeason) : '-'}
                              </span>
                            )}
                          </div>

                          {/* Reserve Driver */}
                          <div className="flex flex-col">
                            <label className="text-sm font-medium text-white/70 mb-1">Reserve Driver</label>
                            {isEditing ? (
                              <select
                                className="w-full bg-gray-800 text-white border border-gray-700 rounded p-2 text-sm"
                                value={editForms[member.id]?.reserveDriver || ''}
                                onChange={(e) => {
                                  const newValue = e.target.value;
                                  setEditForms(prev => ({
                                    ...prev,
                                    [member.id]: {
                                      ...prev[member.id],
                                      reserveDriver: newValue
                                    }
                                  }));
                                }}
                              >
                                <option value="">-</option>
                                {availableDrivers.map(driver => {
                                  const isUsed = isDriverUsed(member.id, driver, selection, 'reserve');
                                  return (
                                    <option 
                                      key={driver} 
                                      value={driver}
                                      disabled={isUsed}
                                      style={{ 
                                        color: isUsed ? '#666' : 'inherit',
                                        textDecoration: isUsed ? 'line-through' : 'none'
                                      }}
                                    >
                                      {driver} {isUsed ? '(Used)' : ''}
                                    </option>
                                  );
                                })}
                              </select>
                            ) : (
                              <span className="text-white text-sm">
                                {selection?.reserveDriver ? normalizeDriverForSeason(selection.reserveDriver, leagueSeason) : '-'}
                              </span>
                            )}
                          </div>

                          {/* Team */}
                          <div className="flex flex-col">
                            <label className="text-sm font-medium text-white/70 mb-1">Team</label>
                            {isEditing ? (
                              <select
                                className="w-full bg-gray-800 text-white border border-gray-700 rounded p-2 text-sm"
                                value={editForms[member.id]?.team || ''}
                                onChange={(e) => {
                                  const newValue = e.target.value;
                                  setEditForms(prev => ({
                                    ...prev,
                                    [member.id]: {
                                      ...prev[member.id],
                                      team: newValue
                                    }
                                  }));
                                }}
                              >
                                <option value="">-</option>
                                {availableTeams.map(team => {
                                  const isUsed = isTeamUsed(member.id, team, selection);
                                  return (
                                    <option 
                                      key={team} 
                                      value={team}
                                      disabled={isUsed}
                                      style={{ 
                                        color: isUsed ? '#666' : 'inherit',
                                        textDecoration: isUsed ? 'line-through' : 'none'
                                      }}
                                    >
                                      {team} {isUsed ? '(Used)' : ''}
                                    </option>
                                  );
                                })}
                              </select>
                            ) : (
                              <span className="text-white text-sm">
                                {selection?.team ? normalizeTeamForSeason(selection.team, leagueSeason) : '-'}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Admin Actions */}
                        {isAdmin && (
                          <div className="mt-4 pt-3 border-t border-white/10">
                            {isEditing ? (
                              <div className="flex flex-col space-y-2">
                                <button
                                  onClick={() => handleSave(member.id, true)}
                                  className="flex items-center justify-center gap-2 px-4 py-2 text-sm bg-green-600 hover:bg-green-700 rounded text-white"
                                >
                                  <IconWrapper icon={FaCheck} /> Real points
                                </button>
                                <button
                                  onClick={() => handleSave(member.id, false)}
                                  className="flex items-center justify-center gap-2 px-4 py-2 text-sm bg-yellow-600 hover:bg-yellow-700 rounded text-white"
                                >
                                  <IconWrapper icon={FaCheck} /> 0 points
                                </button>
                                <button
                                  onClick={() => handleCancel(member.id)}
                                  className="flex items-center justify-center gap-2 px-4 py-2 text-sm bg-gray-600 hover:bg-gray-700 rounded text-white"
                                >
                                  <IconWrapper icon={FaTimes} /> Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleEdit(member)}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm bg-red-600 hover:bg-red-700 rounded text-white"
                              >
                                <IconWrapper icon={FaEdit} /> Edit
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default RaceDetails; 