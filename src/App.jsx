import React, { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { FaExclamationTriangle, FaRedo } from 'react-icons/fa';
import { AnimatePresence, MotionConfig } from 'framer-motion';
import LockScreen from './components/LockScreen';
import DesktopDock from './components/DesktopDock';
import DesktopHome from './components/DesktopHome';
import Launchpad from './components/Launchpad';
import DesktopGuide from './components/DesktopGuide';
import DesktopDialog from './components/ui/DesktopDialog';
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
import WorkspaceFxControl from './components/WorkspaceFxControl';
import { useSettingsStore } from './store/useSettingsStore';
import { useCommandPalette } from './hooks/useCommandPalette';
import { useWindowControlsOverlay } from './hooks/useWindowControlsOverlay';
import { useAutoBackup } from './hooks/useAutoBackup';
import WorkArea from './components/workarea/WorkArea';
import WorkspaceFxLayer from './components/workarea/WorkspaceFxLayer';
import IconButton from './components/ui/IconButton';
import { WIDGET_REGISTRY, normalizeWidgetLayout } from './config/widgetRegistry';
import { getRecord, putRecord } from './data/localDb';
import { migrateLegacyBackendIfNeeded } from './data/migrations';
import { readInvite } from './canvas/invite';

const CanvasWorkspace = lazy(() => import('./components/CanvasWorkspace'));

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
const FIXED_MARGIN = 20;

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
  const [startupError, setStartupError] = useState('');
  const [layoutReady, setLayoutReady] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [showExportImport, setShowExportImport] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);
  const [showWallpaperPanel, setShowWallpaperPanel] = useState(false);
  const [locked, setLocked] = useState(() => !readInvite());
  const [canvasOpen, setCanvasOpen] = useState(() => Boolean(readInvite()));
  const [canvasRouteKey, setCanvasRouteKey] = useState(0);
  const [showLaunchpad, setShowLaunchpad] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [workView, setWorkView] = useState('all');
  const enterDesktopRef = useRef(null);

  const {
    bg,
    isEditMode,
    initializeSettings,
    workspaceFxEnabled,
    workspaceFxMode,
    activeSection,
    setSection,
    username,
  } = useSettingsStore();
  const cmdPalette = useCommandPalette(!locked);
  useWindowControlsOverlay();
  useAutoBackup(dataReady);

  useEffect(() => {
    const openInvite = () => {
      if (!readInvite()) return;
      setLocked(false);
      setCanvasOpen(true);
      setCanvasRouteKey(value => value + 1);
    };
    window.addEventListener('hashchange', openInvite);
    return () => window.removeEventListener('hashchange', openInvite);
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        await migrateLegacyBackendIfNeeded();
        await initializeSettings();
        if (!cancelled) setDataReady(true);
      } catch (error) {
        console.error('Failed to initialize local workspace', error);
        if (!cancelled) {
          setStartupError(error?.message || '本地工作台初始化失败');
        }
      }
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
    })().catch((error) => {
      if (!cancelled) setStartupError(error?.message || '组件布局暂时无法读取');
    });

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
      if (locked) return;
      if (event.key === 'Escape') {
        setShowWallpaperPanel(false);
        setShowChangelog(false);
        setShowExportImport(false);
      }
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'e') {
        event.preventDefault();
        setShowExportImport((value) => !value);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [locked]);

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

  const openApp = (view) => {
    if (view === 'canvas') {
      setCanvasOpen(true);
      setShowLaunchpad(false);
      return;
    }
    setWorkView(view);
    setSection('work');
  };
  const closeCanvas = () => {
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
    setCanvasOpen(false);
  };
  const lockDesktop = () => {
    cmdPalette.close();
    setShowPicker(false);
    setShowLaunchpad(false);
    setLocked(true);
  };
  const enterDesktop = () => { setLocked(false); };

  if (!dataReady || !layoutReady || startupError) {
    return (
      <div className="app-shell flex min-h-screen w-full items-center justify-center px-5 text-white">
        <div className="glass-panel w-full max-w-sm p-5 text-center animate-bubble">
          <div className="panel-kicker">Local Workspace</div>
          {startupError ? (
            <>
              <div className="mt-3 flex items-center justify-center gap-2 text-base font-semibold text-[#ffd0d0]">
                <FaExclamationTriangle size={14} />
                本地数据库暂时打不开
              </div>
              <div className="mt-3 rounded-2xl border border-[#ff8d8d]/18 bg-[#ff8d8d]/10 px-3 py-3 text-xs leading-5 text-white/62">
                {startupError}
              </div>
              <div className="mt-3 text-xs leading-5 text-white/42">
                通常是旧标签页或旧 PWA 窗口还占着数据库。先关闭其他本页面窗口，再刷新当前页面。
              </div>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="glass-control mt-4 inline-flex h-10 items-center justify-center gap-2 px-4 text-sm font-semibold text-white/72 hover:text-white"
              >
                <FaRedo size={12} />
                刷新重试
              </button>
            </>
          ) : (
            <>
              <div className="mt-2 text-base font-semibold text-white/88">正在打开本地工作台</div>
              <div className="mt-2 text-xs leading-5 text-white/42">
                正在准备你的组件、记录和个人设置。
              </div>
            </>
          )}
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
    <MotionConfig reducedMotion="user">
    <div className={`app-shell os-shell min-h-screen w-full text-white ${locked ? 'is-locked' : 'is-unlocked'}`}>
      <div className="pointer-events-none fixed inset-0 -z-10 bg-black/22" />
      <WorkspaceFxLayer enabled={workspaceFxEnabled} mode={workspaceFxMode} scope="global" />

      <div inert={locked || undefined} aria-hidden={locked || undefined}>
      <div className="app-content-layer" ref={enterDesktopRef} tabIndex={-1}>
        <Header
          onTogglePicker={() => setShowPicker((value) => !value)}
          onOpenWallpaper={() => setShowWallpaperPanel(true)}
          showPicker={showPicker}
          onLaunchpad={() => setShowLaunchpad(true)}
        />

        <Layout widgetBoard={<DesktopHome count={items.length} onOpenApp={openApp} onAdd={() => setShowPicker(true)} onArrange={() => setItems(current => [...current].sort((a, b) => b.h - a.h || b.w - a.w))}>{widgetBoard}</DesktopHome>} workArea={<WorkArea view={workView} onViewChange={setWorkView} />} />
      </div>

      {!locked && <BackupReminder onOpenBackup={() => setShowExportImport(true)} />}

      {!locked && cmdPalette.isOpen && (
        <CommandPalette
          close={cmdPalette.close}
          onAddWidget={handleAddWidget}
          onOpenBackup={() => setShowExportImport(true)}
        />
      )}

      {!locked && showExportImport && (
        <ExportImportPanel onClose={() => setShowExportImport(false)} />
      )}

      {!locked && showChangelog && (
        <ChangelogPanel onClose={() => setShowChangelog(false)} />
      )}

      {!locked && showWallpaperPanel && (
        <WallpaperPanel onClose={() => setShowWallpaperPanel(false)} />
      )}

      {!locked && showPicker && <DesktopDialog title="把喜欢的，放上桌面。" eyebrow="WIDGET LIBRARY" onClose={() => setShowPicker(false)}><WidgetPicker onAdd={config => { handleAddWidget(config); setSection('widgets'); }} /></DesktopDialog>}
      {!locked && showLaunchpad && <Launchpad onClose={() => setShowLaunchpad(false)} onOpenApp={openApp} onWallpaper={() => setShowWallpaperPanel(true)} onBackup={() => setShowExportImport(true)} onWidgets={() => setShowPicker(true)} />}
      {!locked && showGuide && <DesktopGuide onClose={() => setShowGuide(false)} onChangelog={() => setShowChangelog(true)} />}
      <DesktopDock activeSection={activeSection} onSection={setSection} onLaunchpad={() => setShowLaunchpad(true)} onSearch={cmdPalette.open} onBackup={() => setShowExportImport(true)} onHelp={() => setShowGuide(true)} onLock={lockDesktop} onCanvas={() => openApp('canvas')} />
      <div className="os-fx-tray"><WorkspaceFxControl /></div>
      </div>
      {!locked && canvasOpen && <Suspense fallback={<div className="canvas-route-loading">正在打开画布…</div>}><CanvasWorkspace key={canvasRouteKey} bg={bg} onBack={closeCanvas} /></Suspense>}
      <AnimatePresence onExitComplete={() => { if (!canvasOpen && document.activeElement === document.body) enterDesktopRef.current?.focus({ preventScroll: true }); }}>{locked && <LockScreen key="lock" onEnter={enterDesktop} username={username} bg={bg} />}</AnimatePresence>
      <DomainMigrationWarning />
    </div>
    </MotionConfig>
  );
}

export default App;
