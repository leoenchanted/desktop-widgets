import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { FaImage, FaFileUpload, FaDownload, FaUpload } from 'react-icons/fa';
import SortableBoard from './components/SortableBoard';
import WidgetPicker from './components/WidgetPicker';
import Header from './components/Header';
import Layout from './components/Layout';
import CommandPalette from './components/CommandPalette';
import ExportImportPanel from './components/ExportImportPanel';
import { useSettingsStore } from './store/useSettingsStore';
import { useCommandPalette } from './hooks/useCommandPalette';
import WorkArea from './components/workarea/WorkArea';

const DEFAULT_LAYOUT = [
  { i: '1', w: 2, h: 1, type: 'clock' },
  { i: '2', w: 2, h: 2, type: 'horoscope' },
  { i: '3', w: 2, h: 1, type: 'quote' },
  { i: '4', w: 1, h: 1, type: 'calendar' },
  { i: '5', w: 1, h: 1, type: 'image' },
];

const FIXED_GRID_SIZE = 140;
const FIXED_MARGIN = 30;

function App() {
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem('glass_items');
    return saved ? JSON.parse(saved) : DEFAULT_LAYOUT;
  });
  const [showPicker, setShowPicker] = useState(false);
  const [showExportImport, setShowExportImport] = useState(false);
  const [urlInput, setUrlInput] = useState('');
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

  // Apply background on mount and when bg changes
  useEffect(() => {
    if (bg && !bg.startsWith('data:') && !bg.startsWith('http')) return;
    if (bg) {
      document.body.style.backgroundImage = `url('${bg}')`;
      document.body.style.backgroundSize = 'cover';
      document.body.style.backgroundPosition = 'center';
      document.body.style.backgroundAttachment = 'fixed';
      document.body.style.backgroundColor = 'transparent';
    } else {
      // Reset to dark fallback
      document.body.style.backgroundImage = 'none';
      document.body.style.backgroundColor = '#1a1a2e';
    }
  }, [bg]);

  const handleAddWidget = (widgetConfig) => {
    const newItem = {
      i: uuidv4(),
      w: widgetConfig.defaultW,
      h: widgetConfig.defaultH,
      type: widgetConfig.id,
    };
    setItems([...items, newItem]);
    setShowPicker(false);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'E') {
        e.preventDefault();
        setShowExportImport((v) => !v);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const handleBgUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setBg(ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  const widgetBoard = (
    <SortableBoard
      items={items}
      setItems={setItems}
      onRemoveItem={(id) => setItems(items.filter((i) => i.i !== id))}
      gridSize={FIXED_GRID_SIZE}
      margin={FIXED_MARGIN}
      isEditMode={isEditMode}
    />
  );

  // WorkArea with all productivity tools
  const workArea = <WorkArea />;

  return (
    <div className="min-h-screen w-full text-white font-sans pb-20">
      <div className="fixed inset-0 bg-black/15 pointer-events-none -z-10" />

      <Header
        onTogglePicker={() => setShowPicker(!showPicker)}
        showPicker={showPicker}
      />

      <div ref={pickerRef} className="relative z-[999]">
        {showPicker && (
          <div className="absolute top-0 right-6 md:right-8 mt-2">
            <WidgetPicker onAdd={handleAddWidget} />
          </div>
        )}
      </div>

      <Layout widgetBoard={widgetBoard} workArea={workArea} />

      {/* Settings Dock */}
      {isEditMode && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-40 bg-black/70 backdrop-blur-2xl border border-white/10 px-8 py-4 rounded-3xl shadow-2xl flex flex-wrap justify-center items-center gap-6 animate-fade-in w-auto">
          <div className="flex flex-col gap-1 w-64">
            <label className="text-[10px] text-white/50 uppercase font-bold flex items-center gap-1">
              <FaImage /> 壁纸设置
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={urlInput}
                placeholder="输入图片 URL 后按回车..."
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && urlInput.trim()) {
                    setBg(urlInput.trim());
                  }
                }}
                className="flex-1 bg-white/10 border border-white/10 rounded px-2 py-1 text-xs text-white/80 focus:bg-white/20 outline-none placeholder-white/30"
              />
              <input
                type="file"
                ref={bgInputRef}
                hidden
                accept="image/*"
                onChange={handleBgUpload}
              />
              <button
                onClick={() => bgInputRef.current.click()}
                className="bg-white/10 hover:bg-white/20 border border-white/10 rounded px-3 flex items-center justify-center text-white/70 transition-colors"
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
                  className="bg-white/10 hover:bg-white/20 border border-white/10 rounded px-2 flex items-center justify-center text-white/50 text-[10px] transition-colors"
                  title="当前壁纸"
                >
                  ✓
                </button>
              )}
            </div>
          </div>

          <button
            onClick={() => setShowExportImport(true)}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl px-4 py-2 text-xs text-white/70 hover:text-white transition-all"
          >
            <FaDownload size={12} />
            备份
          </button>
        </div>
      )}

      {/* Command Palette */}
      <CommandPalette isOpen={cmdPalette.isOpen} close={cmdPalette.close} />

      {/* Export/Import Modal */}
      {showExportImport && (
        <ExportImportPanel onClose={() => setShowExportImport(false)} />
      )}

      {/* Cmd+K hint */}
      {!cmdPalette.isOpen && (
        <button
          onClick={cmdPalette.open}
          className="fixed bottom-6 right-6 z-30 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/20 transition-all duration-300 hover:scale-110 shadow-lg"
          title="命令面板 (Cmd+K)"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z"/>
          </svg>
        </button>
      )}
    </div>
  );
}

export default App;
