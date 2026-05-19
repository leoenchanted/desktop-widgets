import React, { useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { FaDownload, FaFileUpload, FaHistory, FaImage, FaKeyboard } from 'react-icons/fa';
import SortableBoard from './components/SortableBoard';
import WidgetPicker from './components/WidgetPicker';
import Header from './components/Header';
import Layout from './components/Layout';
import CommandPalette from './components/CommandPalette';
import ExportImportPanel from './components/ExportImportPanel';
import BackupReminder from './components/BackupReminder';
import ChangelogPanel from './components/ChangelogPanel';
import { useSettingsStore } from './store/useSettingsStore';
import { useCommandPalette } from './hooks/useCommandPalette';
import WorkArea from './components/workarea/WorkArea';
import IconButton from './components/ui/IconButton';
import { wallpaperApi } from './api/wallpaperApi';
import { getRecord, putRecord } from './data/localDb';
import { migrateLegacyBackendIfNeeded } from './data/migrations';

const DEFAULT_LAYOUT = [
  { i: '1', w: 2, h: 1, type: 'clock' },
  { i: '2', w: 2, h: 2, type: 'horoscope' },
  { i: '3', w: 2, h: 1, type: 'quote' },
  { i: '4', w: 1, h: 1, type: 'calendar' },
  { i: '5', w: 1, h: 1, type: 'image' },
];

const FIXED_GRID_SIZE = 140;
const FIXED_MARGIN = 30;

function normalizeWallpaperUrl(value) {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('//')) return `https:${trimmed}`;
  if (/^(https?:|data:image\/)/i.test(trimmed)) return trimmed;
  if (/^[\w.-]+\.[a-z]{2,}(\/.*)?$/i.test(trimmed)) return `https://${trimmed}`;
  return trimmed;
}

function canUseWallpaperValue(value) {
  return /^(https?:|data:image\/)/i.test(value);
}

function legacyLayout() {
  try {
    const saved = localStorage.getItem('glass_items');
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve(event.target.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function App() {
  const [items, setItems] = useState(DEFAULT_LAYOUT);
  const [dataReady, setDataReady] = useState(false);
  const [layoutReady, setLayoutReady] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [showExportImport, setShowExportImport] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [wallpaperStatus, setWallpaperStatus] = useState('');
  const [isUploadingWallpaper, setIsUploadingWallpaper] = useState(false);
  const pickerRef = useRef(null);
  const bgInputRef = useRef(null);

  const {
    bg,
    setBg,
    setWallpaperAsset,
    isEditMode,
    initializeSettings,
  } = useSettingsStore();
  const cmdPalette = useCommandPalette();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      await migrateLegacyBackendIfNeeded();
      await initializeSettings();
      if (!cancelled) setDataReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [initializeSettings]);

  useEffect(() => {
    if (!dataReady) return undefined;
    let cancelled = false;

    (async () => {
      const saved = await getRecord('widgets', 'layout');
      let layout = saved?.value;
      if (!layout) {
        layout = legacyLayout() || DEFAULT_LAYOUT;
        await putRecord('widgets', {
          key: 'layout',
          value: layout,
          updated_at: new Date().toISOString(),
        });
      }
      if (!cancelled) {
        setItems(layout);
        setLayoutReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [dataReady]);

  useEffect(() => {
    if (!layoutReady) return;
    putRecord('widgets', {
      key: 'layout',
      value: items,
      updated_at: new Date().toISOString(),
    }).catch((error) => {
      console.error('Failed to persist widget layout', error);
    });
  }, [items, layoutReady]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setShowPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (bg) {
      document.body.style.backgroundImage = `url("${bg.replaceAll('"', '\\"')}")`;
      document.body.style.backgroundSize = 'cover';
      document.body.style.backgroundPosition = 'center';
      document.body.style.backgroundAttachment = 'fixed';
      document.body.style.backgroundColor = 'transparent';
    } else {
      document.body.style.backgroundImage = 'none';
      document.body.style.backgroundColor = '#0a0f18';
    }
  }, [bg]);

  useEffect(() => {
    const handler = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'e') {
        event.preventDefault();
        setShowExportImport((value) => !value);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const handleAddWidget = (widgetConfig) => {
    const newItem = {
      i: uuidv4(),
      w: widgetConfig.defaultW,
      h: widgetConfig.defaultH,
      type: widgetConfig.id,
    };
    setItems((current) => [...current, newItem]);
    setShowPicker(false);
  };

  const applyWallpaperUrl = () => {
    const nextBg = normalizeWallpaperUrl(urlInput);
    if (!canUseWallpaperValue(nextBg)) {
      setWallpaperStatus('请输入 http(s) 图片链接，或上传本地图片');
      return;
    }
    setBg(nextBg);
    setUrlInput(nextBg);
    setWallpaperStatus('壁纸 URL 已保存到本地设置');
  };

  const handleBgUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setWallpaperStatus('请选择图片文件');
      event.target.value = '';
      return;
    }

    setIsUploadingWallpaper(true);
    setWallpaperStatus('正在压缩并保存到浏览器本地...');
    try {
      const result = await wallpaperApi.upload({ file });
      setWallpaperAsset(result.assetId, result.url);
      setUrlInput('');
      setWallpaperStatus(
        result.compressed
          ? '本地壁纸已高质量压缩并保存'
          : '本地壁纸已原画质保存',
      );
    } catch (error) {
      console.error('Failed to save wallpaper in IndexedDB, falling back to data URL', error);
      const dataUrl = await readAsDataUrl(file);
      setBg(dataUrl);
      setUrlInput('');
      setWallpaperStatus('已回退为浏览器 data URL 保存');
    } finally {
      setIsUploadingWallpaper(false);
      event.target.value = '';
    }
  };

  if (!dataReady) {
    return (
      <div className="app-shell flex min-h-screen w-full items-center justify-center px-5 text-white">
        <div className="glass-panel w-full max-w-sm p-5 text-center animate-bubble">
          <div className="panel-kicker">Local Workspace</div>
          <div className="mt-2 text-base font-semibold text-white/88">正在打开本地工作台</div>
          <div className="mt-2 text-xs leading-5 text-white/42">
            正在准备 IndexedDB、本地持久化存储和旧数据迁移。
          </div>
        </div>
      </div>
    );
  }

  const widgetBoard = (
    <SortableBoard
      items={items}
      setItems={setItems}
      onRemoveItem={(id) => setItems((current) => current.filter((item) => item.i !== id))}
      gridSize={FIXED_GRID_SIZE}
      margin={FIXED_MARGIN}
      isEditMode={isEditMode}
    />
  );

  return (
    <div className="app-shell min-h-screen w-full pb-24 text-white">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-black/22" />

      <Header
        onTogglePicker={() => setShowPicker((value) => !value)}
        showPicker={showPicker}
      />

      <div ref={pickerRef} className="relative z-[999]">
        {showPicker && (
          <div className="absolute right-6 top-0 mt-2 md:right-8">
            <WidgetPicker onAdd={handleAddWidget} />
          </div>
        )}
      </div>

      <Layout widgetBoard={widgetBoard} workArea={<WorkArea />} />

      {isEditMode && (
        <div className="glass-panel fixed bottom-[calc(env(safe-area-inset-bottom)+1.25rem)] left-1/2 z-40 flex w-[min(92vw,760px)] -translate-x-1/2 flex-wrap items-end justify-center gap-4 px-5 py-4 shadow-2xl animate-fade-in md:bottom-8">
          <div className="min-w-[260px] flex-1">
            <label className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white/42">
              <FaImage />
              壁纸
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={urlInput}
                placeholder="图片 URL"
                onChange={(event) => setUrlInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && urlInput.trim()) {
                    applyWallpaperUrl();
                  }
                }}
                className="min-w-0 flex-1 rounded-2xl border border-white/12 bg-white/8 px-3 py-2 text-sm text-white/82 outline-none placeholder-white/28 transition-all focus:border-[#80bfff]/40 focus:bg-white/12"
              />
              <button
                onClick={applyWallpaperUrl}
                disabled={!urlInput.trim()}
                className="glass-control flex h-10 items-center justify-center px-3 text-xs font-semibold text-white/62 hover:text-white disabled:opacity-35"
                title="应用 URL 壁纸"
              >
                应用
              </button>
              <input
                type="file"
                ref={bgInputRef}
                hidden
                accept="image/*"
                onChange={handleBgUpload}
              />
              <button
                onClick={() => bgInputRef.current.click()}
                disabled={isUploadingWallpaper}
                className="glass-control flex h-10 w-10 items-center justify-center text-white/60 hover:text-white disabled:opacity-35"
                title="上传本地壁纸"
              >
                <FaFileUpload size={14} />
              </button>
              {bg && /^https?:/i.test(bg) && (
                <button
                  onClick={() => setUrlInput(bg)}
                  className="glass-control flex h-10 items-center justify-center px-3 text-xs font-semibold text-white/52 hover:text-white"
                  title="填入当前壁纸"
                >
                  当前
                </button>
              )}
            </div>
            {wallpaperStatus && (
              <div className="mt-2 text-xs font-medium text-white/42">
                {wallpaperStatus}
              </div>
            )}
          </div>

          <button
            onClick={() => setShowExportImport(true)}
            className="glass-control flex h-10 items-center gap-2 px-4 text-sm font-semibold text-white/66 hover:text-white"
          >
            <FaDownload size={12} />
            备份
          </button>
        </div>
      )}

      <BackupReminder onOpenBackup={() => setShowExportImport(true)} />

      {cmdPalette.isOpen && (
        <CommandPalette
          close={cmdPalette.close}
          onAddWidget={handleAddWidget}
          onOpenBackup={() => setShowExportImport(true)}
        />
      )}

      {showExportImport && (
        <ExportImportPanel onClose={() => setShowExportImport(false)} />
      )}

      {showChangelog && (
        <ChangelogPanel onClose={() => setShowChangelog(false)} />
      )}

      {!cmdPalette.isOpen && (
        <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+1rem)] right-5 z-30 flex flex-col gap-3 md:right-6">
          <IconButton
            icon={FaHistory}
            onClick={() => setShowChangelog(true)}
            className="h-12 w-12 rounded-full shadow-lg"
            title="更新日志"
          />
          <IconButton
            icon={FaKeyboard}
            onClick={cmdPalette.open}
            className="h-12 w-12 rounded-full shadow-lg"
            title="命令面板"
          />
        </div>
      )}
    </div>
  );
}

export default App;
