import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FaCog } from 'react-icons/fa';
import IconButton from '../ui/IconButton';

const PANEL_MARGIN = 16;
const PANEL_MAX_WIDTH = 376;
const PANEL_MAX_HEIGHT = 440;
const PANEL_MIN_HEIGHT = 240;

const MarkdownEditorSettingsPanel = ({
  disabled = false,
  glowCaretEnabled,
  glowIntensity,
  onGlowCaretEnabledChange,
  onGlowIntensityChange,
}) => {
  const rootRef = useRef(null);
  const panelRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [panelStyle, setPanelStyle] = useState({
    left: PANEL_MARGIN,
    top: PANEL_MARGIN,
    width: PANEL_MAX_WIDTH,
    maxHeight: PANEL_MAX_HEIGHT,
  });

  const updatePanelLayout = useCallback(() => {
    const anchor = rootRef.current;
    if (!anchor) return;

    const rect = anchor.getBoundingClientRect();
    const viewportWidth = window.visualViewport?.width || window.innerWidth;
    const viewportHeight = window.visualViewport?.height || window.innerHeight;
    const width = Math.min(PANEL_MAX_WIDTH, Math.max(292, viewportWidth - (PANEL_MARGIN * 2)));
    const maxLeft = Math.max(PANEL_MARGIN, viewportWidth - width - PANEL_MARGIN);
    const left = Math.min(Math.max(PANEL_MARGIN, rect.right - width), maxLeft);
    const spaceBelow = viewportHeight - rect.bottom - PANEL_MARGIN;
    const spaceAbove = rect.top - PANEL_MARGIN;
    const shouldOpenAbove = spaceBelow < 280 && spaceAbove > spaceBelow;
    const availableHeight = Math.max(
      PANEL_MIN_HEIGHT,
      shouldOpenAbove ? spaceAbove - 8 : spaceBelow - 8,
    );
    const maxHeight = Math.min(PANEL_MAX_HEIGHT, availableHeight);
    const top = shouldOpenAbove
      ? Math.max(PANEL_MARGIN, rect.top - maxHeight - 8)
      : Math.max(
        PANEL_MARGIN,
        Math.min(rect.bottom + 8, viewportHeight - maxHeight - PANEL_MARGIN),
      );

    setPanelStyle({ left, top, width, maxHeight });
  }, []);

  useEffect(() => {
    if (!open) return undefined;

    requestAnimationFrame(updatePanelLayout);

    const handlePointerDown = (event) => {
      if (
        !rootRef.current?.contains(event.target)
        && !panelRef.current?.contains(event.target)
      ) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    const handleViewportChange = () => updatePanelLayout();

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('scroll', handleViewportChange, true);
    window.visualViewport?.addEventListener('resize', handleViewportChange);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('scroll', handleViewportChange, true);
      window.visualViewport?.removeEventListener('resize', handleViewportChange);
    };
  }, [open, updatePanelLayout]);

  const panel = open && typeof document !== 'undefined'
    ? createPortal(
      <div
        ref={panelRef}
        className="draft-editor-settings-panel"
        style={{
          left: panelStyle.left,
          top: panelStyle.top,
          width: panelStyle.width,
          maxHeight: panelStyle.maxHeight,
        }}
      >
        <div className="editor-settings-header">
          <div>
            <p className="editor-settings-kicker">Editor</p>
            <h3 className="editor-settings-title">文本编辑器设置</h3>
          </div>
          <span className="editor-settings-badge">外观</span>
        </div>

        <div className="editor-settings-sections">
          <section className="editor-settings-section">
            <div className="editor-settings-section-head">
              <div>
                <p className="editor-settings-section-title">光标</p>
                <p className="editor-settings-section-desc">输入光标的显示效果</p>
              </div>
              <span className={glowCaretEnabled ? 'editor-settings-state is-on' : 'editor-settings-state'}>
                {glowCaretEnabled ? '开启' : '关闭'}
              </span>
            </div>

            <div className="editor-settings-control-row">
              <div className="min-w-0">
                <p className="editor-settings-control-title">发光光标</p>
                <p className="editor-settings-control-meta">纯文本 / Markdown 同步</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={glowCaretEnabled}
                onClick={() => onGlowCaretEnabledChange(!glowCaretEnabled)}
                className={`editor-settings-switch ${glowCaretEnabled ? 'is-on' : ''}`}
              >
                <span />
              </button>
            </div>

            <div className={`editor-settings-control-row is-range ${!glowCaretEnabled ? 'is-disabled' : ''}`}>
              <div className="editor-settings-range-head">
                <div>
                  <p className="editor-settings-control-title">亮度</p>
                  <p className="editor-settings-control-meta">光晕强度</p>
                </div>
                <span className="editor-settings-value">{Math.round(glowIntensity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.35"
                max="1.8"
                step="0.05"
                value={glowIntensity}
                disabled={!glowCaretEnabled}
                onChange={(event) => onGlowIntensityChange(event.target.value)}
                className="editor-settings-range"
              />
            </div>
          </section>

          <section className="editor-settings-section is-muted">
            <div className="editor-settings-section-head">
              <div>
                <p className="editor-settings-section-title">字体与排版</p>
                <p className="editor-settings-section-desc">字体、字号、行高等后续放这里</p>
              </div>
              <span className="editor-settings-state">预留</span>
            </div>
          </section>
        </div>
      </div>,
      document.body,
    )
    : null;

  return (
    <div ref={rootRef} className="relative">
      <IconButton
        icon={FaCog}
        active={open}
        onClick={() => setOpen((value) => !value)}
        disabled={disabled}
        title="文本编辑器设置"
        className="draft-toolbar-button h-9 w-9 text-white/55 disabled:opacity-40"
      />

      {panel}
    </div>
  );
};

export default MarkdownEditorSettingsPanel;
