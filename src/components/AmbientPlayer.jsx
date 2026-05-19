import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  FaChevronDown,
  FaPause,
  FaPlay,
  FaVolumeMute,
  FaVolumeUp,
} from 'react-icons/fa';
import { AMBIENT_SOUNDS, getAmbientSound } from '../data/ambientSounds';
import { getSetting, setSetting } from '../data/localDb';

const DEFAULT_VOLUME = 0.36;

function createNoiseBuffer(context, type) {
  const length = context.sampleRate * 2;
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);

  if (type === 'pink') {
    let b0 = 0;
    let b1 = 0;
    let b2 = 0;
    let b3 = 0;
    let b4 = 0;
    let b5 = 0;
    let b6 = 0;

    for (let index = 0; index < length; index += 1) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.969 * b2 + white * 0.153852;
      b3 = 0.8665 * b3 + white * 0.3104856;
      b4 = 0.55 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.016898;
      data[index] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
    return buffer;
  }

  if (type === 'brown') {
    let last = 0;
    for (let index = 0; index < length; index += 1) {
      const white = Math.random() * 2 - 1;
      data[index] = (last + 0.02 * white) / 1.02;
      last = data[index];
      data[index] *= 3.5;
    }
    return buffer;
  }

  for (let index = 0; index < length; index += 1) {
    data[index] = (Math.random() * 2 - 1) * 0.5;
  }
  return buffer;
}

async function sampleExists(src) {
  try {
    const response = await fetch(src, { method: 'HEAD', cache: 'no-store' });
    return response.ok;
  } catch {
    return false;
  }
}

const SoundBars = ({ active }) => (
  <span className="flex h-5 items-center gap-[3px]" aria-hidden="true">
    {[0, 1, 2].map((index) => (
      <span
        key={index}
        className={`ambient-bar block w-[3px] rounded-full ${active ? 'bg-[#9ae9bd]/80' : 'bg-white/28'}`}
        style={{
          height: active ? `${8 + index * 3}px` : '5px',
          animationDelay: `${index * 140}ms`,
          animationPlayState: active ? 'running' : 'paused',
        }}
      />
    ))}
  </span>
);

const AmbientPlayer = ({ className = '' }) => {
  const [selectedId, setSelectedId] = useState('white');
  const [volume, setVolume] = useState(DEFAULT_VOLUME);
  const [muted, setMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [message, setMessage] = useState('');
  const [settingsReady, setSettingsReady] = useState(false);
  const contextRef = useRef(null);
  const gainRef = useRef(null);
  const sourceRef = useRef(null);
  const audioRef = useRef(null);
  const panelRef = useRef(null);

  const selectedSound = getAmbientSound(selectedId);
  const outputVolume = muted ? 0 : volume;

  const stopAll = useCallback(() => {
    if (sourceRef.current) {
      try {
        sourceRef.current.stop();
      } catch {
        // Source may already be stopped by the browser.
      }
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, []);

  const ensureAudioContext = useCallback(() => {
    if (!contextRef.current) {
      contextRef.current = new AudioContext();
      gainRef.current = contextRef.current.createGain();
      gainRef.current.connect(contextRef.current.destination);
    }
    return contextRef.current;
  }, []);

  const startGenerated = useCallback(async (sound) => {
    stopAll();
    const context = ensureAudioContext();
    if (context.state === 'suspended') await context.resume();

    const source = context.createBufferSource();
    source.buffer = createNoiseBuffer(context, sound.id);
    source.loop = true;
    source.connect(gainRef.current);
    gainRef.current.gain.setTargetAtTime(outputVolume, context.currentTime, 0.06);
    source.start();
    sourceRef.current = source;
  }, [ensureAudioContext, outputVolume, stopAll]);

  const startSample = useCallback(async (sound) => {
    const exists = await sampleExists(sound.src);
    if (!exists) {
      throw new Error(`把 ${sound.fileName} 放到 public/audio/ambient 后再播放`);
    }

    stopAll();
    if (!audioRef.current) audioRef.current = new Audio();
    audioRef.current.src = sound.src;
    audioRef.current.loop = true;
    audioRef.current.volume = outputVolume;
    await audioRef.current.play();
  }, [outputVolume, stopAll]);

  const startPlayback = useCallback(async (soundId = selectedId) => {
    const sound = getAmbientSound(soundId);
    setMessage('');

    try {
      if (sound.type === 'generated') {
        await startGenerated(sound);
      } else {
        await startSample(sound);
      }
      setIsPlaying(true);
    } catch (error) {
      stopAll();
      setIsPlaying(false);
      setMessage(error.message || '播放失败，请检查音源文件');
    }
  }, [selectedId, startGenerated, startSample, stopAll]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const [storedSound, storedVolume, storedMuted] = await Promise.all([
        getSetting('ambientSound', 'white'),
        getSetting('ambientVolume', DEFAULT_VOLUME),
        getSetting('ambientMuted', false),
      ]);

      if (cancelled) return;
      setSelectedId(getAmbientSound(storedSound).id);
      setVolume(Number(storedVolume ?? DEFAULT_VOLUME));
      setMuted(Boolean(storedMuted));
      setSettingsReady(true);
    })();

    return () => {
      cancelled = true;
      stopAll();
    };
  }, [stopAll]);

  useEffect(() => {
    if (!settingsReady) return;
    setSetting('ambientSound', selectedId);
  }, [selectedId, settingsReady]);

  useEffect(() => {
    if (!settingsReady) return;
    setSetting('ambientVolume', volume);
  }, [settingsReady, volume]);

  useEffect(() => {
    if (!settingsReady) return;
    setSetting('ambientMuted', muted);
  }, [muted, settingsReady]);

  useEffect(() => {
    if (gainRef.current && contextRef.current) {
      gainRef.current.gain.setTargetAtTime(outputVolume, contextRef.current.currentTime, 0.05);
    }
    if (audioRef.current) audioRef.current.volume = outputVolume;
  }, [outputVolume]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setExpanded(false);
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  const handleToggle = () => {
    if (isPlaying) {
      stopAll();
      setIsPlaying(false);
      return;
    }
    startPlayback();
  };

  const handleSelect = async (soundId) => {
    setSelectedId(soundId);
    setExpanded(false);
    if (isPlaying) {
      stopAll();
      setIsPlaying(false);
      await startPlayback(soundId);
    }
  };

  return (
    <div
      ref={panelRef}
      className={`relative z-30 w-full ${className}`}
    >
      <div className="glass-panel ambient-player-panel overflow-hidden rounded-2xl p-1.5 shadow-2xl">
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleToggle}
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-white/12 text-white/82 transition-all hover:bg-white/18 hover:text-white active:scale-95"
            title={isPlaying ? '暂停环境音' : '播放环境音'}
          >
            {isPlaying ? <FaPause size={11} /> : <FaPlay size={11} className="ml-0.5" />}
          </button>

          <button
            onClick={() => setExpanded((value) => !value)}
            className="flex min-w-0 flex-1 items-center gap-2 rounded-xl px-2 py-1.5 text-left transition-all hover:bg-white/8"
            title="选择环境音"
          >
            <span
              className="h-2 w-2 flex-shrink-0 rounded-full shadow-[0_0_14px_currentColor]"
              style={{ backgroundColor: selectedSound.color, color: selectedSound.color }}
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-semibold text-white/86">
                {selectedSound.label}
              </span>
              <span className="block text-[9px] font-medium uppercase tracking-[0.14em] text-white/32">
                Ambient
              </span>
            </span>
            <SoundBars active={isPlaying} />
            <FaChevronDown
              size={10}
              className={`flex-shrink-0 text-white/35 transition-transform ${expanded ? 'rotate-180' : ''}`}
            />
          </button>

          <button
            onClick={() => setMuted((value) => !value)}
            className="hidden h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl text-white/48 transition-all hover:bg-white/8 hover:text-white sm:flex"
            title={muted ? '取消静音' : '静音'}
          >
            {muted ? <FaVolumeMute size={13} /> : <FaVolumeUp size={13} />}
          </button>

          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(event) => setVolume(Number(event.target.value))}
            className="ambient-volume hidden w-16 sm:block"
            style={{ '--ambient-level': `${volume * 100}%` }}
            title="音量"
          />
        </div>

        {expanded && (
          <div className="mt-1.5 grid grid-cols-3 gap-1 border-t border-white/10 pt-1.5">
            {AMBIENT_SOUNDS.map((sound) => (
              <button
                key={sound.id}
                onClick={() => handleSelect(sound.id)}
                className={`rounded-xl px-2 py-2 text-left transition-all ${
                  sound.id === selectedId
                    ? 'bg-white/14 text-white'
                    : 'text-white/50 hover:bg-white/8 hover:text-white/80'
                }`}
                title={sound.type === 'sample' ? `需要 ${sound.fileName}` : sound.label}
              >
                <span
                  className="mb-1 block h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: sound.color }}
                />
                <span className="block text-[11px] font-semibold">{sound.label}</span>
                <span className="mt-0.5 block text-[10px] text-white/28">
                  {sound.type === 'generated' ? '实时生成' : '本地循环'}
                </span>
              </button>
            ))}

            <div className="col-span-3 flex items-center gap-2.5 px-1 pt-1.5 sm:hidden">
              <button
                onClick={() => setMuted((value) => !value)}
                className="glass-control flex h-9 w-9 flex-shrink-0 items-center justify-center text-white/58"
                title={muted ? '取消静音' : '静音'}
              >
                {muted ? <FaVolumeMute size={13} /> : <FaVolumeUp size={13} />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(event) => setVolume(Number(event.target.value))}
                className="ambient-volume min-w-0 flex-1"
                style={{ '--ambient-level': `${volume * 100}%` }}
                title="音量"
              />
            </div>
          </div>
        )}

        {message && (
          <div className="mx-1 mt-2 rounded-xl border border-[#f1cf75]/18 bg-[#f1cf75]/10 px-3 py-2 text-xs leading-5 text-[#ffe5a3]">
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

export default AmbientPlayer;
