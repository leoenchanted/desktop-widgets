import React, { useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { FaDownload, FaHistory, FaKeyboard } from 'react-icons/fa';
import SortableBoard from './components/SortableBoard';
import WidgetPicker from './components/WidgetPicker';
import Header from './components/Header';
import Layout from './components/Layout';
import CommandPalette from './components/CommandPalette';
import ExportImportPanel from './components/ExportImportPanel';
import BackupReminder from './components/BackupReminder';
import ChangelogPanel from './components/ChangelogPanel';
import WallpaperPanel from './components/WallpaperPanel';
import DomainMigrationWarning from './components/DomainMigrationWarning';
import { useSettingsStore } from './store/useSettingsStore';
import { useCommandPalette } from './hooks/useCommandPalette';
import { useWindowControlsOverlay } from './hooks/useWindowControlsOverlay';
import { useAutoBackup } from './hooks/useAutoBackup';
import WorkArea from './components/workarea/WorkArea';
import IconButton from './components/ui/IconButton';
import { WIDGET_REGISTRY, normalizeWidgetLayout } from './config/widgetRegistry';
import { getRecord, putRecord } from './data/localDb';
import { migrateLegacyBackendIfNeeded } from './data/migrations';

const DEFAULT_LAYOUT = normalizeWidgetLayout([
  {
    i: '1',
    type: 'clock',
    w: WIDGET_REGISTRY.clock.defaultW,
    h: WIDGET_REGISTRY.clock.defaultH,
  },
  {
    i: '2',
    type: 'horoscope',
    w: WIDGET_REGISTRY.horoscope.defaultW,
    h: WIDGET_REGISTRY.horoscope.defaultH,
  },
  {
    i: '3',
    type: 'quote',
    w: WIDGET_REGISTRY.quote.defaultW,
    h: WIDGET_REGISTRY.quote.defaultH,
  },
  {
    i: '4',
    type: 'calendar',
    w: WIDGET_REGISTRY.calendar.defaultW,
    h: WIDGET_REGISTRY.calendar.defaultH,
  },
  {
    i: '5',
    type: 'image',
    w: WIDGET_REGISTRY.image.defaultW,
    h: WIDGET_REGISTRY.image.defaultH,
  },
]);

const FIXED_GRID_SIZE = 140;
const FIXED_MARGIN = 30;

function legacyLayout() {
  try {
    const saved = localStorage.getItem('glass_items');
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

function App() {
  const [items, setItems] = useState(DEFAULT_LAYOUT);
  const [dataReady, setDataReady] = useState(false);
  const [layoutReady, setLayoutReady] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [showExportImport, setShowExportImport] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);
  const [showWallpaperPanel, setShowWallpaperPanel] = useState(false);
  const pickerRef = useRef(null);

  const {
    bg,
    isEditMode,
    initializeSettings,
  } = useSettingsStore();
  const cmdPalette = useCommandPalette();
  useWindowControlsOverlay();
  useAutoBackup(dataReady);

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
      let shouldPersistLayout = false;
      if (!layout) {
        layout = legacyLayout() || DEFAULT_LAYOUT;
        shouldPersistLayout = true;
      }

      const normalizedLayout = normalizeWidgetLayout(layout);
      if (JSON.stringify(normalizedLayout) !== JSON.stringify(layout)) {
        shouldPersistLayout = true;
      }

      if (shouldPersistLayout) {
        await putRecord('widgets', {
          key: 'layout',
          value: normalizedLayout,
          updated_at: new Date().toISOString(),
        });
      }
      if (!cancelled) {
        setItems(normalizedLayout);
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
    const [newItem] = normalizeWidgetLayout([{
      i: uuidv4(),
      w: widgetConfig.defaultW,
      h: widgetConfig.defaultH,
      type: widgetConfig.id,
    }]);
    setItems((current) => [...current, newItem]);
    setShowPicker(false);
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
        onOpenWallpaper={() => setShowWallpaperPanel(true)}
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

      <BackupReminder onOpenBackup={() => setShowExportImport(true)} />
      <DomainMigrationWarning />

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

      {showWallpaperPanel && (
        <WallpaperPanel onClose={() => setShowWallpaperPanel(false)} />
      )}

      {!cmdPalette.isOpen && (
        <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+1rem)] right-5 z-30 flex flex-col gap-3 md:right-6">
          <IconButton
            icon={FaDownload}
            onClick={() => setShowExportImport(true)}
            className="h-12 w-12 rounded-full shadow-lg"
            title="备份数据"
          />
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
