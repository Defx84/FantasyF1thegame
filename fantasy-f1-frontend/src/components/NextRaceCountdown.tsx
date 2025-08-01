import React, { useState, useEffect } from 'react';
import * as FaIcons from 'react-icons/fa';
import { getNextRaceTiming, RaceTiming } from '../services/raceService';

// Cast icons as proper React components
const FaFlagIcon = FaIcons.FaFlag as unknown as React.FC<{ className?: string; size?: number }>;
const FaStopwatchIcon = FaIcons.FaStopwatch as unknown as React.FC<{ className?: string; size?: number }>;
const FaRunningIcon = FaIcons.FaRunning as unknown as React.FC<{ className?: string; size?: number }>;

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const calculateTimeLeft = (timeUntil: number): TimeLeft => {
  const days = Math.floor(timeUntil / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeUntil % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeUntil % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeUntil % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds };
};

// Helper to format date in dd-mm-yyyy HH:MM
const formatDateEU = (isoString: string) => {
  if (!isoString) return 'TBD';
  const date = new Date(isoString);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const NextRaceCountdown: React.FC = () => {
  const [raceData, setRaceData] = useState<RaceTiming | null>(null);
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRaceData = async () => {
      try {
        const data = await getNextRaceTiming();
        console.log('Fetched race data:', data); // Debug log
        setRaceData(data);
        if (data.hasUpcomingRace) {
          const now = Date.now();
          
          // For sprint weekends, prioritize sprint qualifying if it's the next event
          let targetTime: number;
          let eventType: string;
          
          if (data.isSprintWeekend && data.sprintQualifying) {
            const sprintQualTime = new Date(data.sprintQualifying.startTime).getTime();
            const raceTime = new Date(data.race.startTime).getTime();
            
            // Use sprint qualifying if it's the next event, otherwise use race
            if (sprintQualTime > now) {
              targetTime = sprintQualTime;
              eventType = 'sprint qualifying';
            } else if (raceTime > now) {
              targetTime = raceTime;
              eventType = 'race';
            } else {
              // Both events are in the past, use race time for display
              targetTime = raceTime;
              eventType = 'race';
            }
          } else {
            // Regular weekend, use race time
            targetTime = new Date(data.race.startTime).getTime();
            eventType = 'race';
          }
          
          const timeUntil = targetTime - now;
          console.log(`Countdown target: ${eventType}, time until: ${timeUntil}ms`);
          setTimeLeft(calculateTimeLeft(timeUntil));
        }
      } catch (err) {
        console.error('Error fetching race data:', err); // Debug log
        setError('Failed to load race data');
      } finally {
        setLoading(false);
      }
    };

    fetchRaceData();
  }, []);

  useEffect(() => {
    if (!raceData?.hasUpcomingRace) return;

    const timer = setInterval(() => {
      const now = Date.now();
      
      // For sprint weekends, prioritize sprint qualifying if it's the next event
      let targetTime: number;
      
      if (raceData.isSprintWeekend && raceData.sprintQualifying) {
        const sprintQualTime = new Date(raceData.sprintQualifying.startTime).getTime();
        const raceTime = new Date(raceData.race.startTime).getTime();
        
        // Use sprint qualifying if it's the next event, otherwise use race
        if (sprintQualTime > now) {
          targetTime = sprintQualTime;
        } else if (raceTime > now) {
          targetTime = raceTime;
        } else {
          // Both events are in the past, use race time for display
          targetTime = raceTime;
        }
      } else {
        // Regular weekend, use race time
        targetTime = new Date(raceData.race.startTime).getTime();
      }
      
      const timeUntil = targetTime - now;
      const newTimeLeft = calculateTimeLeft(timeUntil);
      setTimeLeft(newTimeLeft);
    }, 1000);

    return () => clearInterval(timer);
  }, [raceData]);

  if (loading) {
    return (
      <div className="backdrop-blur-xl bg-white/10 rounded-xl p-6 border border-white/10 animate-pulse">
        <div className="h-24 bg-white/20 rounded-lg"></div>
      </div>
    );
  }

  if (error || !raceData?.hasUpcomingRace) {
    return (
      <div className="backdrop-blur-xl bg-white/10 rounded-xl p-6 border border-white/10">
        <p className="text-white text-center">
          {error || 'No upcoming races scheduled'}
        </p>
      </div>
    );
  }

  const { raceName, round, qualifying, race, sprint } = raceData;

  return (
    <div className="bg-white/[0.02] backdrop-blur-sm rounded-lg p-6 shadow-lg">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">
          {raceData?.raceName || 'Loading...'}
        </h2>
        <div className="flex items-center justify-center space-x-2 text-white/70">
          <FaFlagIcon className="text-red-500" size={20} />
          <span>Next Race</span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="text-center">
          <div className="text-xl font-bold text-white drop-shadow-md" style={{textShadow: '0 1px 6px rgba(0,0,0,0.7)'}}>{timeLeft.days}</div>
          <div className="text-xs text-white/80">Days</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-white drop-shadow-md" style={{textShadow: '0 1px 6px rgba(0,0,0,0.7)'}}>{timeLeft.hours}</div>
          <div className="text-xs text-white/80">Hours</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-white drop-shadow-md" style={{textShadow: '0 1px 6px rgba(0,0,0,0.7)'}}>{timeLeft.minutes}</div>
          <div className="text-xs text-white/80">Minutes</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-white drop-shadow-md" style={{textShadow: '0 1px 6px rgba(0,0,0,0.7)'}}>{timeLeft.seconds}</div>
          <div className="text-xs text-white/80">Seconds</div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <FaStopwatchIcon className="text-yellow-500" size={16} />
            <span className="text-white">Qualifying</span>
          </div>
          <span className="text-white/90 drop-shadow-sm" style={{textShadow: '0 1px 4px rgba(0,0,0,0.7)'}}>
            {formatDateEU(raceData?.qualifying.startTime)}
          </span>
        </div>

        {raceData?.sprintQualifying && (
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <FaRunningIcon className="text-green-500" size={16} />
              <span className="text-white">Sprint Race</span>
            </div>
            <span className="text-white/90 drop-shadow-sm" style={{textShadow: '0 1px 4px rgba(0,0,0,0.7)'}}>
              {formatDateEU(raceData.sprintQualifying.startTime)}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <FaFlagIcon className="text-red-500" size={16} />
            <span className="text-white">Race</span>
          </div>
          <span className="text-white/90 drop-shadow-sm" style={{textShadow: '0 1px 4px rgba(0,0,0,0.7)'}}>
            {formatDateEU(raceData?.race.startTime)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default NextRaceCountdown; 