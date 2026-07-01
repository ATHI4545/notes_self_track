import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import {
  RiPlayLine, RiPauseLine, RiRefreshLine, RiCupLine, RiRestaurantLine, RiBriefcaseLine,
} from 'react-icons/ri';
import { toast } from 'react-toastify';

const MODES = [
  { key: 'focus',      label: 'Focus',       seconds: 25 * 60, icon: RiBriefcaseLine, color: '#6366f1' },
  { key: 'short',      label: 'Short Break', seconds:  5 * 60, icon: RiCupLine,       color: '#10b981' },
  { key: 'long',       label: 'Long Break',  seconds: 15 * 60, icon: RiRestaurantLine, color: '#f59e0b' },
];

export default function Pomodoro() {
  const [mode, setMode]           = useState(MODES[0]);
  const [timeLeft, setTimeLeft]   = useState(MODES[0].seconds);
  const [running, setRunning]     = useState(false);
  const [sessions, setSessions]   = useState(0);

  const pct = Math.round((timeLeft / mode.seconds) * 100);

  useEffect(() => {
    setTimeLeft(mode.seconds);
    setRunning(false);
  }, [mode]);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(id);
          setRunning(false);
          if (mode.key === 'focus') {
            setSessions(s => s + 1);
            toast.success('🍅 Focus session complete! Great work!');
          } else {
            toast.info('☕ Break over! Ready for another session?');
          }
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, mode.key]);

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const reset = () => {
    setRunning(false);
    setTimeLeft(mode.seconds);
  };

  return (
    <div className="glass-card p-8 flex flex-col items-center gap-8 max-w-md mx-auto">
      {/* Mode tabs */}
      <div className="flex gap-2 p-1 rounded-xl bg-slate-100 dark:bg-white/5 w-full">
        {MODES.map(m => (
          <button
            key={m.key}
            onClick={() => setMode(m)}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all duration-200
              ${mode.key === m.key
                ? 'bg-white dark:bg-white/15 text-primary-600 dark:text-primary-400 shadow-card'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Circular timer */}
      <motion.div
        key={mode.key}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-52 h-52 relative"
      >
        <CircularProgressbar
          value={pct}
          text={fmt(timeLeft)}
          counterClockwise
          styles={buildStyles({
            textSize: '1.4rem',
            textColor: mode.color,
            pathColor: mode.color,
            trailColor: 'rgba(148,163,184,0.2)',
            pathTransitionDuration: 0.5,
          })}
        />
        {running && (
          <div className="absolute inset-0 rounded-full animate-ping opacity-10"
               style={{ backgroundColor: mode.color }} />
        )}
      </motion.div>

      {/* Mode label */}
      <div className="text-center">
        <p className="text-lg font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2 justify-center">
          <mode.icon style={{ color: mode.color }} />
          {mode.label}
        </p>
        <p className="text-sm text-slate-400 dark:text-slate-500 mt-0.5">
          Sessions completed: <span className="font-bold text-primary-500">{sessions}</span>
        </p>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        <button
          onClick={reset}
          className="w-12 h-12 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center
                     text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:scale-110 transition-all duration-200"
          title="Reset"
        >
          <RiRefreshLine className="text-xl" />
        </button>

        <button
          onClick={() => setRunning(r => !r)}
          className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl
                     hover:scale-110 active:scale-95 transition-all duration-200 shadow-glow"
          style={{ background: `linear-gradient(135deg, ${mode.color}, ${mode.color}dd)` }}
          title={running ? 'Pause' : 'Start'}
        >
          {running ? <RiPauseLine /> : <RiPlayLine />}
        </button>

        <div className="w-12 h-12" /> {/* spacer */}
      </div>

      {/* Info */}
      <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
        Work 25 min · Short break 5 min · Long break 15 min
      </p>
    </div>
  );
}
