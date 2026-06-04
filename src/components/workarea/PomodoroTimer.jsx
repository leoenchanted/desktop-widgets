import React, { useEffect, useRef, useState } from 'react';
import { FaBell, FaCheck, FaCog, FaPause, FaPlay, FaRedo, FaSeedling, FaVolumeUp } from 'react-icons/fa';
import { usePomodoroStore } from '../../store/usePomodoroStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import GlassPanel from '../ui/GlassPanel';
import IconButton from '../ui/IconButton';
import PanelHeader from '../ui/PanelHeader';

const RADIUS = 56;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const DURATION_PRESETS = [1, 15, 25];

const getNotificationPermission = () => {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return window.Notification.permission;
};

const playCompletionSound = () => {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;

  const context = new AudioContext();
  const now = context.currentTime;
  const output = context.createGain();
  output.gain.setValueAtTime(0.0001, now);
  output.gain.exponentialRampToValueAtTime(0.12, now + 0.025);
  output.gain.exponentialRampToValueAtTime(0.0001, now + 0.52);
  output.connect(context.destination);

  [0, 0.16].forEach((offset, index) => {
    const oscillator = context.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(index === 0 ? 660 : 880, now + offset);
    oscillator.connect(output);
    oscillator.start(now + offset);
    oscillator.stop(now + offset + 0.18);
  });

  window.setTimeout(() => {
    context.close().catch(() => {});
  }, 760);
};

const PomodoroTimer = ({ todayKey }) => {
  const {
    minutes,
    seconds,
    durationMinutes,
    isRunning,
    completionSignal,
    soundEnabled,
    notificationEnabled,
    sessionCount,
    focusMinutes,
    initializeDuration,
    setSoundEnabled,
    setNotificationEnabled,
    setDuration,
    start,
    pause,
    reset,
    cleanup,
    setCurrentDate,
    syncWithClock,
  } = usePomodoroStore();
  const username = useSettingsStore((state) => state.username);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState(getNotificationPermission);
  const [notificationStatus, setNotificationStatus] = useState('');
  const lastCompletionSignalRef = useRef(completionSignal);
  const settingsPanelRef = useRef(null);
  const settingsButtonRef = useRef(null);

  useEffect(() => {
    initializeDuration();
    return () => cleanup();
  }, [cleanup, initializeDuration]);

  useEffect(() => {
    setCurrentDate(todayKey);
  }, [setCurrentDate, todayKey]);

  useEffect(() => {
    const handleResume = () => {
      syncWithClock();
    };

    window.addEventListener('focus', handleResume);
    document.addEventListener('visibilitychange', handleResume);

    return () => {
      window.removeEventListener('focus', handleResume);
      document.removeEventListener('visibilitychange', handleResume);
    };
  }, [syncWithClock]);

  useEffect(() => {
    if (notificationEnabled && ['denied', 'unsupported'].includes(notificationPermission)) {
      setNotificationEnabled(false);
    }
  }, [notificationEnabled, notificationPermission, setNotificationEnabled]);

  useEffect(() => {
    if (!settingsOpen) return undefined;

    const handlePointerDown = (event) => {
      const panel = settingsPanelRef.current;
      const button = settingsButtonRef.current;
      if (panel?.contains(event.target) || button?.contains(event.target)) return;
      setSettingsOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [settingsOpen]);

  useEffect(() => {
    if (completionSignal === 0 || completionSignal === lastCompletionSignalRef.current) return;
    lastCompletionSignalRef.current = completionSignal;

    if (soundEnabled) playCompletionSound();

    if (
      notificationEnabled
      && typeof window !== 'undefined'
      && 'Notification' in window
      && window.Notification.permission === 'granted'
    ) {
      new window.Notification(`${username || 'Guest'}，您的番茄钟到点啦！`, {
        icon: '/pwa-icon.svg',
        tag: 'desktop-widgets-pomodoro',
        renotify: true,
      });
    }
  }, [completionSignal, notificationEnabled, soundEnabled, username]);

  const handleToggleNotification = async () => {
    if (notificationEnabled) {
      await setNotificationEnabled(false);
      setNotificationStatus('桌面通知已关闭');
      return;
    }

    if (typeof window === 'undefined' || !('Notification' in window)) {
      setNotificationPermission('unsupported');
      setNotificationStatus('当前浏览器不支持桌面通知');
      return;
    }

    const permission = window.Notification.permission === 'default'
      ? await window.Notification.requestPermission()
      : window.Notification.permission;

    setNotificationPermission(permission);

    if (permission === 'granted') {
      await setNotificationEnabled(true);
      setNotificationStatus('桌面通知已开启');
      return;
    }

    await setNotificationEnabled(false);
    setNotificationStatus(permission === 'denied' ? '浏览器已拒绝通知权限' : '需要允许通知后才能开启');
  };

  const formatTime = (m, s) => `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  const remainingSeconds = minutes * 60 + seconds;
  const totalSeconds = durationMinutes * 60;
  const progress = totalSeconds > 0 ? 1 - remainingSeconds / totalSeconds : 0;

  return (
    <GlassPanel className={`workspace-fixed-panel relative flex flex-col overflow-hidden ${isRunning ? 'pomodoro-running' : ''}`}>
      <PanelHeader
        eyebrow="Focus"
        title="番茄钟"
        icon={FaSeedling}
        action={(
          <IconButton
            ref={settingsButtonRef}
            icon={FaCog}
            onClick={() => setSettingsOpen((value) => !value)}
            active={settingsOpen}
            title="番茄钟设置"
            className="h-9 w-9"
          />
        )}
      />

      {settingsOpen && (
        <div ref={settingsPanelRef} className="pomodoro-settings-popover absolute right-4 top-14 z-30 w-[min(16rem,calc(100%-2rem))] p-3">
          <div className="mb-2 flex items-center justify-between gap-3 px-1">
            <span className="text-xs font-semibold text-white/86">提醒设置</span>
            <span className="text-[10px] font-medium text-white/52">完成时触发</span>
          </div>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="pomodoro-settings-option flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left"
            >
              <span className="flex min-w-0 items-center gap-2">
                <FaVolumeUp size={13} className="text-white/70" />
                <span className="min-w-0">
                  <span className="block text-xs font-semibold text-white/90">结束提示音</span>
                  <span className="block text-[10px] text-white/62">默认开启，完成时播放短提示</span>
                </span>
              </span>
              <span className={`flex h-5 w-9 flex-shrink-0 items-center rounded-full p-0.5 transition-colors ${
                soundEnabled ? 'justify-end bg-[#7ee7ad]/32' : 'justify-start bg-white/12'
              }`}>
                <span className="h-4 w-4 rounded-full bg-white/86 shadow-sm" />
              </span>
            </button>

            <button
              type="button"
              onClick={handleToggleNotification}
              className="pomodoro-settings-option flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left"
            >
              <span className="flex min-w-0 items-center gap-2">
                <FaBell size={13} className="text-white/70" />
                <span className="min-w-0">
                  <span className="block text-xs font-semibold text-white/90">桌面通知</span>
                  <span className="block text-[10px] text-white/62">
                    {notificationPermission === 'unsupported'
                      ? '当前浏览器不支持'
                      : notificationPermission === 'denied'
                        ? '需要在浏览器设置中允许'
                        : notificationEnabled
                          ? '已开启系统通知'
                          : '结束时显示系统通知'}
                  </span>
                </span>
              </span>
              <span className={`flex h-5 w-9 flex-shrink-0 items-center rounded-full p-0.5 transition-colors ${
                notificationEnabled ? 'justify-end bg-[#80bfff]/34' : 'justify-start bg-white/12'
              }`}>
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/86 text-[8px] text-[#1b2733] shadow-sm">
                  {notificationEnabled && <FaCheck size={8} />}
                </span>
              </span>
            </button>
          </div>

          {notificationStatus && (
            <div className="mt-2 rounded-lg border border-[#80bfff]/18 bg-[#80bfff]/10 px-2.5 py-2 text-[10px] leading-relaxed text-white/72">
              {notificationStatus}
            </div>
          )}
        </div>
      )}

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
            min="1"
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
