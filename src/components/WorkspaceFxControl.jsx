import React, { useEffect, useRef, useState } from 'react';
import { FaBolt, FaCheck, FaPowerOff } from 'react-icons/fa';
import { useSettingsStore } from '../store/useSettingsStore';
import { WORKSPACE_FX_MODES } from '../config/workspaceFxModes';
import IconButton from './ui/IconButton';

const WorkspaceFxControl = () => {
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);
  const {
    workspaceFxEnabled,
    workspaceFxMode,
    setWorkspaceFxEnabled,
    setWorkspaceFxMode,
  } = useSettingsStore();

  useEffect(() => {
    if (!open) return undefined;
    const handler = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={panelRef} className="workspace-fx-control">
      {open && (
        <div className="workspace-fx-popover glass-panel">
          <button
            type="button"
            onClick={() => setWorkspaceFxEnabled(!workspaceFxEnabled)}
            className={`workspace-fx-power ${workspaceFxEnabled ? 'is-on' : ''}`}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
              <FaPowerOff size={13} />
            </span>
            <span className="min-w-0 flex-1 text-left">
              <span className="block text-sm font-semibold text-white/88">
                {workspaceFxEnabled ? '背景特效已开启' : '背景特效已关闭'}
              </span>
              <span className="block text-[11px] font-medium text-white/42">
                全页面背景层，覆盖壁纸之上
              </span>
            </span>
          </button>

          <div className="workspace-fx-options" aria-label="全局背景特效模式">
            {WORKSPACE_FX_MODES.map((option) => {
              const selected = workspaceFxMode === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setWorkspaceFxMode(option.value)}
                  className={`workspace-fx-option ${selected ? 'is-selected' : ''}`}
                >
                  <span>{option.label}</span>
                  {selected && <FaCheck size={11} />}
                </button>
              );
            })}
          </div>
        </div>
      )}
      <IconButton
        icon={FaBolt}
        onClick={() => setOpen((value) => !value)}
        active={open || workspaceFxEnabled}
        className="h-12 w-12 rounded-full shadow-lg"
        title="背景特效设置"
      />
    </div>
  );
};

export default WorkspaceFxControl;
