import React, { useState, useRef, useEffect } from 'react';
import { FaSearch, FaExchangeAlt, FaPlus, FaDownload, FaCalendarAlt } from 'react-icons/fa';
import { useSettingsStore } from '../store/useSettingsStore';
import { useTodoStore } from '../store/useTodoStore';
import { useMarkdownStore } from '../store/useMarkdownStore';
import { exportBackup } from '../utils/backup';
import { today } from '../utils/date';

const CommandPalette = ({ isOpen, close }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  const { toggleSection, activeSection } = useSettingsStore();
  const { addTodo, setCurrentDate: setTodoDate } = useTodoStore();
  const { setCurrentDate: setMdDate } = useMarkdownStore();

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const commands = [
    {
      id: 'toggle-section',
      icon: <FaExchangeAlt />,
      label: `切换到${activeSection === 'widgets' ? '工作区' : '组件区'}`,
      action: () => { toggleSection(); close(); },
    },
    {
      id: 'add-todo',
      icon: <FaPlus />,
      label: '添加任务: ',
      action: (q) => {
        const text = q.replace(/^add todo/i, '').trim() || '新任务';
        addTodo(text);
        close();
      },
    },
    {
      id: 'goto-today',
      icon: <FaCalendarAlt />,
      label: '跳转至今',
      action: () => {
        const d = today();
        setTodoDate(d);
        setMdDate(d);
        close();
      },
    },
    {
      id: 'export',
      icon: <FaDownload />,
      label: '导出备份',
      action: async () => { await exportBackup(); close(); },
    },
  ];

  const filtered = query
    ? commands.filter((c) => c.label.toLowerCase().includes(query.toLowerCase()))
    : commands;

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].action(query);
      }
    } else if (e.key === 'Escape') {
      close();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center pt-[15vh]"
      onClick={close}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative w-full max-w-lg bg-[#1c1c1e]/95 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden animate-bubble origin-top"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
          <FaSearch className="text-white/30 flex-shrink-0" size={14} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
            onKeyDown={handleKeyDown}
            placeholder="输入命令..."
            className="flex-1 bg-transparent text-sm text-white outline-none placeholder-white/30"
          />
          <kbd className="text-[10px] text-white/30 bg-white/5 px-1.5 py-0.5 rounded border border-white/10">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="py-2 max-h-72 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center text-white/20 text-sm">
              没有匹配的命令
            </div>
          ) : (
            filtered.map((cmd, i) => (
              <button
                key={cmd.id}
                onClick={() => cmd.action(query)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                  i === selectedIndex
                    ? 'bg-white/10 text-white'
                    : 'text-white/60 hover:bg-white/5 hover:text-white/80'
                }`}
              >
                <span className="w-5 flex justify-center text-[#0A84FF]">
                  {cmd.icon}
                </span>
                <span className="text-sm">{cmd.label}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
