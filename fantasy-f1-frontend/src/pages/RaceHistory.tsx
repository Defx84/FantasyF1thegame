import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaFlagCheckered, FaLock } from 'react-icons/fa';
import IconWrapper from '../utils/iconWrapper';
import { api } from '../services/api';
import { getLeague } from '../services/leagueService';
import CountryFlag from 'react-country-flag';

// Mapping from country names to ISO country codes
const COUNTRY_CODE_MAP: Record<string, string> = {
  Australia: 'AU',
  China: 'CN',
  Japan: 'JP',
  Bahrain: 'BH',
  'Saudi Arabia': 'SA',
  USA: 'US',
  Italy: 'IT',
  Spain: 'ES',
  Monaco: 'MC',
  Canada: 'CA',
  Austria: 'AT',
  Hungary: 'HU',
  Belgium: 'BE',
  Netherlands: 'NL',
  Singapore: 'SG',
  Qatar: 'QA',
  Mexico: 'MX',
  Brazil: 'BR',
  'United Kingdom': 'GB',
  'Great Britain': 'GB',
  'great britain': 'GB',
  'UK': 'GB',
  'Britain': 'GB',
  'England': 'GB',
  Azerbaijan: 'AZ',
  'United States': 'US',
  'Abu Dhabi': 'AE',
  'UAE': 'AE',
  // Add more as needed
};

interface Race {
  _id: string;
  raceName: string;
  circuit: string;
  country: string;
  raceStart: string;
  date: string;
  round: number;
  season: number;
}

const RaceHistory: React.FC = () => {
  const { leagueId } = useParams<{ leagueId: string }>();
  const navigate = useNavigate();
  const [races, setRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leagueSeason, setLeagueSeason] = useState<number | null>(null);

  useEffect(() => {
    const fetchRaces = async () => {
      try {
        // First, fetch league data to get the season
        const leagueData = await getLeague(leagueId!);
        const season = leagueData.season || new Date().getFullYear();
        setLeagueSeason(season);

        // Then fetch races (backend already filters by league.season)
        const response = await api.get(`/api/race/league/${leagueId}`);
        const racesData = response.data || [];
        
        // Additional frontend filter to ensure we only show races for the correct season
        const filteredRaces = racesData.filter((race: Race) => race.season === season);
        
        console.log(`RaceHistory: League season: ${season}, Races found: ${racesData.length}, Filtered: ${filteredRaces.length}`);
        
        setRaces(filteredRaces);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching race history:', err);
        setError('Failed to load races');
        setLoading(false);
      }
    };

    if (leagueId) {
      fetchRaces();
    }
  }, [leagueId]);

  const isPastRace = (race: Race) => {
    const raceDate = new Date(race.date);
    const now = new Date();
    return raceDate < now;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-2xl">{error}</div>
      </div>
    );
  }

  return (
    <>
      {/* Background wrapper */}
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
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-4xl font-bold text-white">Race History</h1>
              {leagueSeason && (
                <span className="text-xl font-semibold text-white/70">
                  Season {leagueSeason}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {races.map((race) => {
                const isPast = isPastRace(race);
                return (
                  <div
                    key={race._id}
                    onClick={() => isPast ? navigate(`/league/${leagueId}/race/${race.round}`) : null}
                    className={`rounded-lg p-6 border backdrop-blur-sm text-white ${
                      isPast
                        ? 'bg-white/[0.02] hover:bg-white/[0.05] cursor-pointer border-white/5'
                        : 'bg-black/30 cursor-not-allowed border-white/5'
                    } transition-colors`}
                  >
                    <div className="flex items-center mb-4">
                      {race.country && COUNTRY_CODE_MAP[race.country] ? (
                        <CountryFlag countryCode={COUNTRY_CODE_MAP[race.country]} svg style={{ width: '2em', height: '2em', marginRight: '0.75em', borderRadius: '0.25em', boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }} title={race.country} />
                      ) : (
                        <IconWrapper icon={isPast ? FaFlagCheckered : FaLock} className={`mr-3 ${isPast ? 'text-red-500' : 'text-gray-600'}`} />
                      )}
                      <h2 className={`text-xl font-bold ${!isPast && 'text-gray-500'}`}>
                        {race.raceName}
                      </h2>
                    </div>
                    <div className="space-y-2">
                      <p className="flex items-center">
                        <span className={`font-medium ${!isPast && 'text-gray-600'}`}>Circuit:</span>
                        <span className={`ml-2 ${!isPast && 'text-gray-500'}`}>{race.circuit}</span>
                      </p>
                      <p className="flex items-center">
                        <span className={`font-medium ${!isPast && 'text-gray-600'}`}>Country:</span>
                        <span className={`ml-2 ${!isPast && 'text-gray-500'}`}>{race.country}</span>
                      </p>
                      <p className="flex items-center">
                        <span className={`font-medium ${!isPast && 'text-gray-600'}`}>Round:</span>
                        <span className={`ml-2 ${!isPast && 'text-gray-500'}`}>{race.round}</span>
                      </p>
                      <p className="flex items-center">
                        <span className={`font-medium ${!isPast && 'text-gray-600'}`}>Date:</span>
                        <span className={`ml-2 ${!isPast && 'text-gray-500'}`}>
                          {formatDate(race.date)}
                        </span>
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default RaceHistory; 