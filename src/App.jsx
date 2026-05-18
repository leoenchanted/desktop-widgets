import React, { useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { FaDownload, FaFileUpload, FaImage, FaKeyboard } from 'react-icons/fa';
import SortableBoard from './components/SortableBoard';
import WidgetPicker from './components/WidgetPicker';
import Header from './components/Header';
import Layout from './components/Layout';
import CommandPalette from './components/CommandPalette';
import ExportImportPanel from './components/ExportImportPanel';
import { useSettingsStore } from './store/useSettingsStore';
import { useCommandPalette } from './hooks/useCommandPalette';
import WorkArea from './components/workarea/WorkArea';
import IconButton from './components/ui/IconButton';
import { wallpaperApi } from './api/wallpaperApi';

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
  if (/^(https?:|data:image\/|\/api\/wallpaper\/files\/)/i.test(trimmed)) {
    return trimmed;
  }
  if (/^[\w.-]+\.[a-z]{2,}(\/.*)?$/i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

function canUseWallpaperValue(value) {
  return /^(https?:|data:image\/|\/api\/wallpaper\/files\/)/i.test(value);
}

function App() {
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem('glass_items');
    return saved ? JSON.parse(saved) : DEFAULT_LAYOUT;
  });
  const [showPicker, setShowPicker] = useState(false);
  const [showExportImport, setShowExportImport] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [wallpaperStatus, setWallpaperStatus] = useState('');
  const [isUploadingWallpaper, setIsUploadingWallpaper] = useState(false);
  const pickerRef = useRef(null);
  const bgInputRef = useRef(null);

  const { bg, setBg, isEditMode } = useSettingsStore();
  const cmdPalette = useCommandPalette();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setShowPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    localStorage.setItem('glass_items', JSON.stringify(items));
  }, [items]);

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
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        setShowExportImport((v) => !v);
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
    setWallpaperStatus('壁纸已更新');
  };

  const handleBgUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setWallpaperStatus('请选择图片文件');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target.result;
      setIsUploadingWallpaper(true);
      setWallpaperStatus('正在保存本地图片...');
      try {
        const result = await wallpaperApi.upload({
          filename: file.name,
          mimeType: file.type,
          dataUrl,
        });
        setBg(result.url);
        setUrlInput(result.url);
        setWallpaperStatus('本地壁纸已保存');
      } catch (error) {
        console.error('Failed to upload wallpaper, falling back to data URL', error);
        setBg(dataUrl);
        setUrlInput('');
        setWallpaperStatus('已使用浏览器本地缓存');
      } finally {
        setIsUploadingWallpaper(false);
        e.target.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

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
    <div className="app-shell min-h-screen w-full pb-20 text-white">
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
        <div className="glass-panel fixed bottom-8 left-1/2 z-40 flex w-[min(92vw,760px)] -translate-x-1/2 flex-wrap items-end justify-center gap-4 px-5 py-4 shadow-2xl animate-fade-in">
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
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && urlInput.trim()) {
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
              {bg && !bg.startsWith('data:') && (
                <button
                  onClick={() => {
                    setBg(bg);
                    setUrlInput(bg);
                  }}
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

      {!cmdPalette.isOpen && (
        <IconButton
          icon={FaKeyboard}
          onClick={cmdPalette.open}
          className="fixed bottom-6 right-6 z-30 h-12 w-12 rounded-full shadow-lg"
          title="命令面板"
        />
      )}
    </div>
  );
}

export default App;
