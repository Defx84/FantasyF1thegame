// Trigger frontend update: trivial change
import React, { useState, useEffect } from 'react';
import { getNextRaceTiming } from '../services/raceService';
import { FaFlagCheckered, FaStopwatch, FaRunning } from 'react-icons/fa';

interface DashboardRaceTiming {
  raceName: string;
  round: number;
  qualifying?: {
    startTime: string;
    timeUntil: number;
  };
  race?: {
    startTime: string;
    timeUntil: number;
  };
  sprintQualifying?: {
    startTime: string;
    timeUntil: number;
  };
  sprint?: {
    startTime: string;
    timeUntil: number;
  };
  status?: string;
  endOfWeekend?: string;
}

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

const DashboardRaceCountdown: React.FC = () => {
  const [raceData, setRaceData] = useState<DashboardRaceTiming | null>(null);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRace = async () => {
      try {
        const data = await getNextRaceTiming();
        setRaceData(data as DashboardRaceTiming);
        if (data && data.race?.startTime) {
          const target = new Date(data.race.startTime).getTime();
          const now = Date.now();
          // Debug logs for countdown issue
          console.log("DEBUG: Current time (local):", new Date());
          console.log("DEBUG: Current time (UTC):", new Date().toISOString());
          console.log("DEBUG: Race start (from API):", data.race.startTime, "as Date:", new Date(data.race.startTime));
          console.log("DEBUG: Milliseconds until race:", target - now);
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
    const target = new Date(raceData.race.startTime).getTime();
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(target));
    }, 1000);
    return () => clearInterval(timer);
  }, [raceData]);

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
    raceData?.race ? { label: 'Race', icon: <FaFlagCheckeredIcon className="text-red-400" />, time: raceData.race.startTime } : null,
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
      <div className="space-y-3">
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