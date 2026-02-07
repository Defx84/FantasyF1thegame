import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { FaTimes, FaCheck } from 'react-icons/fa';
import IconWrapper from '../utils/iconWrapper';

interface Race {
  _id: string;
  round: number;
  raceName: string;
  date: string;
  status: string;
  season: number;
  isSprintWeekend: boolean;
}

interface Driver {
  name: string;
  shortName: string;
  team: string;
}

interface Team {
  name: string;
  shortName: string;
  displayName: string;
}

interface DriverResult {
  driver: string;
  team: string;
  position: number | null;
  points: number;
  status: string;
}

interface TeamResult {
  team: string;
  racePoints: number;
  sprintPoints?: number;
  points?: number;
}

interface ManualRaceResultsProps {
  onClose: () => void;
}

const ManualRaceResults: React.FC<ManualRaceResultsProps> = ({ onClose }) => {
  const [season, setSeason] = useState<number>(new Date().getFullYear());
  const [races, setRaces] = useState<Race[]>([]);
  const [selectedRace, setSelectedRace] = useState<Race | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [driverResults, setDriverResults] = useState<DriverResult[]>([]);
  const [teamResults, setTeamResults] = useState<TeamResult[]>([]);
  const [sprintDriverResults, setSprintDriverResults] = useState<DriverResult[]>([]);
  const [sprintTeamResults, setSprintTeamResults] = useState<TeamResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loadingRaces, setLoadingRaces] = useState(false);
  const [loadingDriversTeams, setLoadingDriversTeams] = useState(false);

  // Fetch races when season changes
  useEffect(() => {
    const fetchRaces = async () => {
      setLoadingRaces(true);
      try {
        const response = await api.get('/api/admin/races-list', {
          params: { season }
        });
        setRaces(response.data.races);
        setSelectedRace(null);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch races');
      } finally {
        setLoadingRaces(false);
      }
    };
    fetchRaces();
  }, [season]);

  // Fetch drivers and teams when season changes
  useEffect(() => {
    const fetchDriversAndTeams = async () => {
      setLoadingDriversTeams(true);
      try {
        const response = await api.get(`/api/admin/drivers-teams/${season}`);
        setDrivers(response.data.drivers);
        setTeams(response.data.teams);
        
        // Initialize driver results
        const initialDriverResults: DriverResult[] = response.data.drivers.map((driver: Driver) => ({
          driver: driver.name,
          team: driver.team,
          position: null,
          points: 0,
          status: 'Finished'
        }));
        setDriverResults(initialDriverResults);
        setSprintDriverResults(initialDriverResults.map(d => ({ ...d })));
        
        // Initialize team results
        const initialTeamResults: TeamResult[] = response.data.teams.map((team: Team) => ({
          team: team.name,
          racePoints: 0,
          sprintPoints: 0
        }));
        setTeamResults(initialTeamResults);
        setSprintTeamResults(initialTeamResults.map(t => ({ ...t })));
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch drivers and teams');
      } finally {
        setLoadingDriversTeams(false);
      }
    };
    fetchDriversAndTeams();
  }, [season]);

  // Load existing race data when race is selected
  useEffect(() => {
    if (selectedRace) {
      // Reset to defaults - user will enter new data
      const resetDriverResults: DriverResult[] = drivers.map((driver: Driver) => ({
        driver: driver.name,
        team: driver.team,
        position: null,
        points: 0,
        status: 'Finished'
      }));
      setDriverResults(resetDriverResults);
      setSprintDriverResults(resetDriverResults.map(d => ({ ...d })));
      
      const resetTeamResults: TeamResult[] = teams.map((team: Team) => ({
        team: team.name,
        racePoints: 0,
        sprintPoints: 0
      }));
      setTeamResults(resetTeamResults);
      setSprintTeamResults(resetTeamResults.map(t => ({ ...t })));
    }
  }, [selectedRace, drivers, teams]);

  const handleDriverResultChange = (index: number, field: keyof DriverResult, value: any) => {
    const updated = [...driverResults];
    updated[index] = { ...updated[index], [field]: value };
    setDriverResults(updated);
  };

  const handleTeamResultChange = (index: number, field: keyof TeamResult, value: number) => {
    const updated = [...teamResults];
    updated[index] = { ...updated[index], [field]: value };
    setTeamResults(updated);
  };

  const handleSprintDriverResultChange = (index: number, field: keyof DriverResult, value: any) => {
    const updated = [...sprintDriverResults];
    updated[index] = { ...updated[index], [field]: value };
    setSprintDriverResults(updated);
  };

  const handleSprintTeamResultChange = (index: number, field: keyof TeamResult, value: number) => {
    const updated = [...sprintTeamResults];
    updated[index] = { ...updated[index], [field]: value };
    setSprintTeamResults(updated);
  };

  const handleSubmit = async () => {
    if (!selectedRace) {
      setError('Please select a race');
      return;
    }

    // Validate driver count
    if (driverResults.length !== 22) {
      setError(`Expected 22 drivers, found ${driverResults.length}`);
      return;
    }

    // Validate sprint if it's a sprint weekend
    if (selectedRace.isSprintWeekend) {
      if (sprintDriverResults.length !== 22) {
        setError(`Expected 22 drivers for sprint, found ${sprintDriverResults.length}`);
        return;
      }
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        round: selectedRace.round,
        season: selectedRace.season,
        driverResults: driverResults.map(d => ({
          driver: d.driver,
          team: d.team,
          position: d.position,
          status: d.status
        })),
        sprintResults: selectedRace.isSprintWeekend ? sprintDriverResults.map(d => ({
          driver: d.driver,
          team: d.team,
          position: d.position,
          status: d.status
        })) : null
      };

      const response = await api.post('/api/admin/manual-race-results', payload);
      setSuccess(response.data.message || 'Race results saved successfully! Points calculation triggered.');
      
      // Reset form after successful save
      setTimeout(() => {
        setSelectedRace(null);
        setSuccess(null);
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save race results');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-gray-900 rounded-xl p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto border border-white/20 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Manual Race Results Entry</h2>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors"
          >
            <IconWrapper icon={FaTimes} size={24} />
          </button>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-400 p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-500/20 border border-green-500/50 text-green-400 p-3 rounded-lg mb-4">
            {success}
          </div>
        )}

        {/* Season Selection */}
        <div className="mb-6">
          <label className="block text-white/90 mb-2 font-medium">Season</label>
          <input
            type="number"
            value={season}
            onChange={(e) => setSeason(parseInt(e.target.value) || new Date().getFullYear())}
            className="w-32 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-red-500"
            min="2020"
            max="2030"
          />
        </div>

        {/* Race Selection */}
        <div className="mb-6">
          <label className="block text-white/90 mb-2 font-medium">Select Race</label>
          {loadingRaces ? (
            <div className="text-white/70">Loading races...</div>
          ) : (
            <select
              value={selectedRace?._id || ''}
              onChange={(e) => {
                const race = races.find(r => r._id === e.target.value);
                setSelectedRace(race || null);
              }}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-red-500"
            >
              <option value="">-- Select a race --</option>
              {races.map(race => (
                <option key={race._id} value={race._id}>
                  Round {race.round}: {race.raceName} {race.isSprintWeekend ? '(Sprint)' : ''}
                </option>
              ))}
            </select>
          )}
        </div>

        {selectedRace && !loadingDriversTeams && (
          <>
            {/* Driver Results */}
            <div className="mb-6">
              <h3 className="text-xl font-bold text-white mb-4">Driver Results (Race)</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-white/10">
                      <th className="border border-white/20 px-3 py-2 text-left text-white/90 text-sm">Driver</th>
                      <th className="border border-white/20 px-3 py-2 text-left text-white/90 text-sm">Team</th>
                      <th className="border border-white/20 px-3 py-2 text-left text-white/90 text-sm">Position</th>
                      <th className="border border-white/20 px-3 py-2 text-left text-white/90 text-sm">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {driverResults.map((result, index) => (
                      <tr key={index} className="bg-white/5 hover:bg-white/10">
                        <td className="border border-white/20 px-3 py-2 text-white/90 text-sm">{result.driver}</td>
                        <td className="border border-white/20 px-3 py-2 text-white/70 text-sm">{result.team}</td>
                        <td className="border border-white/20 px-3 py-2">
                          <input
                            type="number"
                            value={result.position || ''}
                            onChange={(e) => handleDriverResultChange(index, 'position', e.target.value ? parseInt(e.target.value) : null)}
                            className="w-20 px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-sm focus:outline-none focus:border-red-500"
                            min="1"
                            max="22"
                          />
                        </td>
                        <td className="border border-white/20 px-3 py-2">
                          <select
                            value={result.status}
                            onChange={(e) => handleDriverResultChange(index, 'status', e.target.value)}
                            className="w-32 px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-sm focus:outline-none focus:border-red-500"
                          >
                            <option value="Finished">Finished</option>
                            <option value="DNF">DNF</option>
                            <option value="DNS">DNS</option>
                            <option value="DSQ">DSQ</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Sprint Driver Results */}
            {selectedRace.isSprintWeekend && (
              <div className="mb-6">
                <h3 className="text-xl font-bold text-white mb-4">Driver Results (Sprint)</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-white/10">
                        <th className="border border-white/20 px-3 py-2 text-left text-white/90 text-sm">Driver</th>
                        <th className="border border-white/20 px-3 py-2 text-left text-white/90 text-sm">Team</th>
                        <th className="border border-white/20 px-3 py-2 text-left text-white/90 text-sm">Position</th>
                        <th className="border border-white/20 px-3 py-2 text-left text-white/90 text-sm">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sprintDriverResults.map((result, index) => (
                        <tr key={index} className="bg-white/5 hover:bg-white/10">
                          <td className="border border-white/20 px-3 py-2 text-white/90 text-sm">{result.driver}</td>
                          <td className="border border-white/20 px-3 py-2 text-white/70 text-sm">{result.team}</td>
                          <td className="border border-white/20 px-3 py-2">
                            <input
                              type="number"
                              value={result.position || ''}
                              onChange={(e) => handleSprintDriverResultChange(index, 'position', e.target.value ? parseInt(e.target.value) : null)}
                              className="w-20 px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-sm focus:outline-none focus:border-red-500"
                              min="1"
                              max="22"
                            />
                          </td>
                          <td className="border border-white/20 px-3 py-2">
                            <select
                              value={result.status}
                              onChange={(e) => handleSprintDriverResultChange(index, 'status', e.target.value)}
                              className="w-32 px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-sm focus:outline-none focus:border-red-500"
                            >
                              <option value="Finished">Finished</option>
                              <option value="DNF">DNF</option>
                              <option value="DNS">DNS</option>
                              <option value="DSQ">DSQ</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}


            {/* Submit Button */}
            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <IconWrapper icon={FaCheck} size={16} />
                    Apply
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ManualRaceResults;
