import React, { useState, useEffect, useRef } from 'react';
import { getNextRaceTiming, RaceTiming } from '../services/raceService';
import { FaFlagCheckered, FaStopwatch, FaRunning } from 'react-icons/fa';

const formatDateEU = (isoString: string) => {
  if (!isoString) return 'TBD';
  const date = new Date(isoString);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const calculateTimeLeft = (target: number) => {
  const now = Date.now();
  const diff = target - now;
  const total = Math.max(diff, 0);
  const days = Math.floor(total / (1000 * 60 * 60 * 24));
  const hours = Math.floor((total % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((total % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((total % (1000 * 60)) / 1000);
  return { days, hours, minutes, seconds };
};

const FaFlagCheckeredIcon = FaFlagCheckered as React.FC<{ className?: string }>;
const FaStopwatchIcon = FaStopwatch as React.FC<{ className?: string }>;
const FaRunningIcon = FaRunning as React.FC<{ className?: string }>;

interface DashboardRaceCountdownProps {
  /** When provided, passed to getNextRaceTiming so auto-assign runs for this league's season */
  leagueId?: string;
}

const DashboardRaceCountdown: React.FC<DashboardRaceCountdownProps> = ({ leagueId }) => {
  const [raceData, setRaceData] = useState<RaceTiming | null>(null);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const deadlineTriggeredRef = useRef(false);

  useEffect(() => {
    const fetchRace = async () => {
      try {
        const data = await getNextRaceTiming(leagueId ? { leagueId } : undefined);
        setRaceData(data);
        if (data && data.race && data.race.startTime) {
          const now = Date.now();
          
          // For sprint weekends, prioritize sprint qualifying if it's the next event
          let target: number;
          let eventType: string;
          
          if (data.isSprintWeekend && data.sprintQualifying) {
            const sprintQualTime = new Date(data.sprintQualifying.startTime).getTime();
            const raceTime = new Date(data.race.startTime).getTime();
            
            // Use sprint qualifying if it's the next event, otherwise use race
            if (sprintQualTime > now) {
              target = sprintQualTime;
              eventType = 'sprint qualifying';
            } else if (raceTime > now) {
              target = raceTime;
              eventType = 'race';
            } else {
              // Both events are in the past, use race time for display
              target = raceTime;
              eventType = 'race';
            }
          } else {
            // Regular weekend, use race time
            target = new Date(data.race.startTime).getTime();
            eventType = 'race';
          }
          
          // Debug logs for countdown issue
          console.log("DEBUG: Current time (local):", new Date());
          console.log("DEBUG: Current time (UTC):", new Date().toISOString());
          console.log("DEBUG: Countdown target:", eventType, "time:", new Date(target).toISOString());
          console.log("DEBUG: Milliseconds until event:", target - now);
          setTimeLeft(calculateTimeLeft(target));
        }
      } catch (err) {
        setError('Failed to load race data');
      } finally {
        setLoading(false);
      }
    };
    fetchRace();
  }, []);

  useEffect(() => {
    if (!raceData?.race?.startTime) return;
    
    const now = Date.now();
    
    // For sprint weekends, prioritize sprint qualifying if it's the next event
    let target: number;
    
    if (raceData.isSprintWeekend && raceData.sprintQualifying) {
      const sprintQualTime = new Date(raceData.sprintQualifying.startTime).getTime();
      const raceTime = new Date(raceData.race.startTime).getTime();
      
      // Use sprint qualifying if it's the next event, otherwise use race
      if (sprintQualTime > now) {
        target = sprintQualTime;
      } else if (raceTime > now) {
        target = raceTime;
      } else {
        // Both events are in the past, use race time for display
        target = raceTime;
      }
    } else {
      // Regular weekend, use race time
      target = new Date(raceData.race.startTime).getTime();
    }
    
    const timer = setInterval(() => {
      const next = calculateTimeLeft(target);
      setTimeLeft(next);
      // When countdown reaches zero, trigger backend auto-assign (once)
      const atDeadline = next.days === 0 && next.hours === 0 && next.minutes === 0 && next.seconds === 0;
      if (atDeadline && !deadlineTriggeredRef.current) {
        deadlineTriggeredRef.current = true;
        getNextRaceTiming(leagueId ? { leagueId } : undefined).catch(() => {});
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [raceData, leagueId]);

  if (loading) {
    return <div className="backdrop-blur-xl bg-white/10 rounded-xl p-6 border border-white/10 animate-pulse"><div className="h-24 bg-white/20 rounded-lg"></div></div>;
  }
  if (error || !raceData) {
    return <div className="backdrop-blur-xl bg-white/10 rounded-xl p-6 border border-white/10"><p className="text-white text-center">{error || 'No upcoming races scheduled'}</p></div>;
  }

  const events = [
    raceData?.qualifying ? { label: 'Qualifying', icon: <FaStopwatchIcon className="text-yellow-400" />, time: raceData.qualifying.startTime } : null,
    raceData?.sprintQualifying ? { label: 'Sprint Qualifying', icon: <FaRunningIcon className="text-green-400" />, time: raceData.sprintQualifying.startTime } : null,
    raceData?.sprint ? { label: 'Sprint Race', icon: <FaRunningIcon className="text-green-400" />, time: raceData.sprint.startTime } : null,
    raceData.race?.startTime ? { label: 'Race', icon: <FaFlagCheckeredIcon className="text-red-400" />, time: raceData.race.startTime } : null,
  ].filter((e): e is { label: string; icon: JSX.Element; time: string } => !!e);

  return (
    <div className="bg-red-200/30 rounded-lg p-6 shadow-lg">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">{raceData.raceName || 'Next Race'}</h2>
        <div className="flex items-center justify-center space-x-2 text-white/70">
          <FaFlagCheckeredIcon className="text-red-500" />
          <span>Race Countdown</span>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="text-center">
          <div className="text-xl font-bold text-white drop-shadow-md">{timeLeft.days}</div>
          <div className="text-xs text-white/80">Days</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-white drop-shadow-md">{timeLeft.hours}</div>
          <div className="text-xs text-white/80">Hours</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-white drop-shadow-md">{timeLeft.minutes}</div>
          <div className="text-xs text-white/80">Minutes</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-white drop-shadow-md">{timeLeft.seconds}</div>
          <div className="text-xs text-white/80">Seconds</div>
        </div>
      </div>
      <div className="space-y-2">
        {events.map((event, idx) => (
          <div key={idx} className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              {event.icon}
              <span className="text-white font-medium">{event.label}</span>
            </div>
            <span className="text-white/90 drop-shadow-sm">{formatDateEU(event.time)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DashboardRaceCountdown; 