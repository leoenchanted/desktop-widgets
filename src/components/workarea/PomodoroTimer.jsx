import React, { useEffect } from 'react';
import { FaPlay, FaPause, FaRedo } from 'react-icons/fa';
import { usePomodoroStore } from '../../store/usePomodoroStore';

const PomodoroTimer = () => {
  const { minutes, seconds, isRunning, sessionCount, start, pause, reset, cleanup, currentDate, fetchSessions } = usePomodoroStore();

  useEffect(() => {
    fetchSessions(currentDate);
    return () => cleanup();
  }, [currentDate]);

  const formatTime = (m, s) =>
    `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

  const progress = 1 - (minutes * 60 + seconds) / (25 * 60);

  return (
    <div className="bg-black/60 border-2 border-red-500/70 rounded-lg flex flex-col items-center justify-center p-4 h-full">
      <span className="text-[10px] uppercase tracking-widest font-bold text-red-400/80 mb-3">
        番茄钟
      </span>

      {/* Timer Circle */}
      <div className="relative w-28 h-28 mb-3">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
          <circle cx="64" cy="64" r="56" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
          <circle
            cx="64" cy="64" r="56"
            fill="none"
            stroke={isRunning ? '#ef4444' : 'rgba(255,255,255,0.3)'}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 56}`}
            strokeDashoffset={`${2 * Math.PI * 56 * (1 - progress)}`}
            className="transition-all duration-1000 ease-linear"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-2xl font-light tracking-wider ${isRunning ? 'text-white' : 'text-white/60'}`}>
            {formatTime(minutes, seconds)}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-3 mb-2">
        <button
          onClick={isRunning ? pause : start}
          className="w-9 h-9 rounded-full bg-red-500/80 hover:bg-red-500 flex items-center justify-center text-white transition-all active:scale-90"
        >
          {isRunning ? <FaPause size={12} /> : <FaPlay size={12} />}
        </button>
        <button
          onClick={reset}
          className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition-all active:scale-90"
        >
          <FaRedo size={12} />
        </button>
      </div>

      {/* Session count */}
      <div className="text-[10px] text-white/30">
        今日完成 <span className="text-red-400/80 font-semibold">{sessionCount}</span> 个
      </div>
    </div>
  );
};

export default PomodoroTimer;
