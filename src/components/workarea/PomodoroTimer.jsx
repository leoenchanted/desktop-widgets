import React, { useEffect } from 'react';
import { FaPause, FaPlay, FaRedo, FaSeedling } from 'react-icons/fa';
import { usePomodoroStore } from '../../store/usePomodoroStore';
import GlassPanel from '../ui/GlassPanel';
import PanelHeader from '../ui/PanelHeader';

const RADIUS = 56;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const PomodoroTimer = () => {
  const {
    minutes,
    seconds,
    isRunning,
    sessionCount,
    start,
    pause,
    reset,
    cleanup,
    currentDate,
    fetchSessions,
  } = usePomodoroStore();

  useEffect(() => {
    fetchSessions(currentDate);
    return () => cleanup();
  }, [cleanup, currentDate, fetchSessions]);

  const formatTime = (m, s) => `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  const remainingSeconds = minutes * 60 + seconds;
  const progress = 1 - remainingSeconds / (25 * 60);

  return (
    <GlassPanel className={`flex h-full min-h-[250px] flex-col ${isRunning ? 'pomodoro-running' : ''}`}>
      <PanelHeader eyebrow="Focus" title="番茄钟" icon={FaSeedling} />

      <div className="flex flex-1 flex-col items-center justify-center py-5">
        <div className="relative h-36 w-36">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 128 128">
            <circle
              cx="64"
              cy="64"
              r={RADIUS}
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="7"
            />
            <circle
              cx="64"
              cy="64"
              r={RADIUS}
              fill="none"
              stroke={isRunning ? '#7ee7ad' : 'rgba(128,191,255,0.72)'}
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
              className="transition-all duration-1000 ease-linear"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-semibold tracking-tight text-white">
              {formatTime(minutes, seconds)}
            </span>
            <span className="mt-1 text-[11px] font-medium text-white/36">
              {isRunning ? '专注中' : '准备开始'}
            </span>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <button
            onClick={isRunning ? pause : start}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-[#80bfff]/22 text-white ring-1 ring-[#80bfff]/28 transition-all hover:bg-[#80bfff]/32 active:scale-95"
            title={isRunning ? '暂停' : '开始'}
          >
            {isRunning ? <FaPause size={13} /> : <FaPlay size={13} className="ml-0.5" />}
          </button>
          <button
            onClick={reset}
            className="glass-control flex h-11 w-11 items-center justify-center text-white/58 hover:text-white"
            title="重置"
          >
            <FaRedo size={13} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="glass-panel-soft p-3 text-center">
          <div className="text-lg font-semibold text-white">{sessionCount}</div>
          <div className="mt-0.5 text-[10px] font-medium text-white/35">今日完成</div>
        </div>
        <div className="glass-panel-soft p-3 text-center">
          <div className="text-lg font-semibold text-white">{sessionCount * 25}</div>
          <div className="mt-0.5 text-[10px] font-medium text-white/35">专注分钟</div>
        </div>
      </div>
    </GlassPanel>
  );
};

export default PomodoroTimer;
