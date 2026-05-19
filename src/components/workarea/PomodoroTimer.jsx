import React, { useEffect } from 'react';
import { FaPause, FaPlay, FaRedo, FaSeedling } from 'react-icons/fa';
import { usePomodoroStore } from '../../store/usePomodoroStore';
import GlassPanel from '../ui/GlassPanel';
import PanelHeader from '../ui/PanelHeader';

const RADIUS = 56;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const DURATION_PRESETS = [15, 25, 45];

const PomodoroTimer = () => {
  const {
    minutes,
    seconds,
    durationMinutes,
    isRunning,
    sessionCount,
    focusMinutes,
    initializeDuration,
    setDuration,
    start,
    pause,
    reset,
    cleanup,
    currentDate,
    fetchSessions,
  } = usePomodoroStore();

  useEffect(() => {
    initializeDuration();
    fetchSessions(currentDate);
    return () => cleanup();
  }, [cleanup, currentDate, fetchSessions, initializeDuration]);

  const formatTime = (m, s) => `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  const remainingSeconds = minutes * 60 + seconds;
  const totalSeconds = durationMinutes * 60;
  const progress = totalSeconds > 0 ? 1 - remainingSeconds / totalSeconds : 0;

  return (
    <GlassPanel className={`flex h-full min-h-[250px] flex-col overflow-hidden ${isRunning ? 'pomodoro-running' : ''}`}>
      <PanelHeader eyebrow="Focus" title="番茄钟" icon={FaSeedling} />

      <div className="mt-3 grid grid-cols-[1fr_auto] items-center gap-2">
        <div className="grid min-w-0 grid-cols-3 gap-1">
          {DURATION_PRESETS.map((duration) => (
            <button
              key={duration}
              onClick={() => setDuration(duration)}
              disabled={isRunning}
              className={`glass-control h-7 px-1 text-[11px] font-semibold ${
                durationMinutes === duration ? 'border-[#9cc9ff]/34 bg-[#9cc9ff]/16 text-white' : 'text-white/48 hover:text-white'
              } disabled:opacity-40`}
              title={`${duration} 分钟`}
            >
              {duration}
            </button>
          ))}
        </div>
        <label className="glass-control flex h-7 w-[74px] items-center justify-center gap-1 px-1.5 text-[11px] text-white/46">
          <input
            type="number"
            min="5"
            max="120"
            value={durationMinutes}
            onChange={(event) => setDuration(event.target.value)}
            disabled={isRunning}
            className="w-8 bg-transparent text-center font-semibold text-white/78 outline-none disabled:opacity-40"
            title="自定义番茄钟分钟数"
          />
          min
        </label>
      </div>

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center py-3">
        <div className="relative h-28 w-28">
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
            <span className="text-[1.65rem] font-semibold tracking-tight text-white">
              {formatTime(minutes, seconds)}
            </span>
            <span className="mt-1 text-[11px] font-medium text-white/36">
              {isRunning ? '专注中' : '准备开始'}
            </span>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2.5">
          <button
            onClick={isRunning ? pause : start}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#80bfff]/22 text-white ring-1 ring-[#80bfff]/28 transition-all hover:bg-[#80bfff]/32 active:scale-95"
            title={isRunning ? '暂停' : '开始'}
          >
            {isRunning ? <FaPause size={13} /> : <FaPlay size={13} className="ml-0.5" />}
          </button>
          <button
            onClick={reset}
            className="glass-control flex h-10 w-10 items-center justify-center text-white/58 hover:text-white"
            title="重置"
          >
            <FaRedo size={13} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="glass-panel-soft px-2 py-2 text-center">
          <div className="text-base font-semibold text-white">{sessionCount}</div>
          <div className="mt-0.5 text-[10px] font-medium text-white/35">今日完成</div>
        </div>
        <div className="glass-panel-soft px-2 py-2 text-center">
          <div className="text-base font-semibold text-white">{focusMinutes}</div>
          <div className="mt-0.5 text-[10px] font-medium text-white/35">专注分钟</div>
        </div>
      </div>
    </GlassPanel>
  );
};

export default PomodoroTimer;
