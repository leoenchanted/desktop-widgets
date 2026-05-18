import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  FaCalendarAlt,
  FaDownload,
  FaExchangeAlt,
  FaPlus,
  FaSearch,
  FaTasks,
  FaThLarge,
} from 'react-icons/fa';
import { useSettingsStore } from '../store/useSettingsStore';
import { useTodoStore } from '../store/useTodoStore';
import { useMarkdownStore } from '../store/useMarkdownStore';
import { exportBackup } from '../utils/backup';
import { today } from '../utils/date';
import { AVAILABLE_WIDGETS } from '../config/widgetRegistry';

const CommandPalette = ({ close, onAddWidget, onOpenBackup }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  const { toggleSection, activeSection, setSection } = useSettingsStore();
  const { addTodo, setCurrentDate: setTodoDate } = useTodoStore();
  const { setCurrentDate: setMarkdownDate } = useMarkdownStore();

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 40);
    return () => clearTimeout(timer);
  }, []);

  const baseCommands = useMemo(() => {
    const nextSection = activeSection === 'widgets' ? '工作区' : '组件区';
    const commands = [
      {
        id: 'toggle-section',
        icon: FaExchangeAlt,
        label: `切换到${nextSection}`,
        keywords: ['section', 'switch', '切换'],
        action: () => {
          toggleSection();
          close();
        },
      },
      {
        id: 'goto-widgets',
        icon: FaThLarge,
        label: '打开组件区',
        keywords: ['widgets', '组件'],
        action: () => {
          setSection('widgets');
          close();
        },
      },
      {
        id: 'goto-work',
        icon: FaTasks,
        label: '打开工作区',
        keywords: ['work', 'workspace', '工作'],
        action: () => {
          setSection('work');
          close();
        },
      },
      {
        id: 'add-todo',
        icon: FaPlus,
        label: '添加任务',
        keywords: ['todo', 'task', '任务'],
        action: async (q) => {
          const text = q.replace(/^(todo|task|任务|添加任务)\s*/i, '').trim() || '新任务';
          await addTodo(text);
          setSection('work');
          close();
        },
      },
      {
        id: 'goto-today',
        icon: FaCalendarAlt,
        label: '跳转到今天',
        keywords: ['today', 'date', '今天', '日期'],
        action: async () => {
          const date = today();
          await Promise.all([setTodoDate(date), setMarkdownDate(date)]);
          setSection('work');
          close();
        },
      },
      {
        id: 'backup-panel',
        icon: FaDownload,
        label: '打开备份',
        keywords: ['backup', 'import', 'export', '备份', '导入', '导出'],
        action: () => {
          onOpenBackup?.();
          close();
        },
      },
      {
        id: 'export',
        icon: FaDownload,
        label: '立即导出 JSON',
        keywords: ['export', 'json', '导出'],
        action: async () => {
          await exportBackup();
          close();
        },
      },
    ];

    AVAILABLE_WIDGETS.forEach((widget) => {
      commands.push({
        id: `widget-${widget.id}`,
        icon: widget.icon,
        label: `添加组件：${widget.name}`,
        keywords: ['widget', 'add', '组件', widget.name, widget.category],
        action: () => {
          onAddWidget?.(widget);
          setSection('widgets');
          close();
        },
      });
    });

    return commands;
  }, [
    activeSection,
    addTodo,
    close,
    onAddWidget,
    onOpenBackup,
    setMarkdownDate,
    setSection,
    setTodoDate,
    toggleSection,
  ]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return baseCommands;

    return baseCommands.filter((command) => {
      const haystack = [command.label, ...(command.keywords || [])]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q) || q.startsWith('todo ') || q.startsWith('任务 ');
    });
  }, [baseCommands, query]);

  const runCommand = (command) => {
    command?.action(query);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      runCommand(filtered[selectedIndex]);
    } else if (e.key === 'Escape') {
      close();
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center px-4 pt-[14vh]" onClick={close}>
      <div className="absolute inset-0 bg-black/42 backdrop-blur-sm" />

      <div
        className="glass-panel relative w-full max-w-2xl overflow-hidden p-0 shadow-2xl animate-bubble"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
          <FaSearch className="flex-shrink-0 text-white/34" size={14} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="搜索命令、输入 todo 内容或添加组件"
            className="min-w-0 flex-1 bg-transparent text-base text-white outline-none placeholder-white/30"
          />
          <kbd className="rounded-lg border border-white/10 bg-white/8 px-2 py-1 text-[10px] font-semibold text-white/38">
            ESC
          </kbd>
        </div>

        <div className="max-h-[420px] overflow-y-auto p-2 glass-scrollbar">
          {filtered.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-white/28">没有匹配的命令</div>
          ) : (
            filtered.map((command, index) => {
              const Icon = command.icon;
              return (
                <button
                  key={command.id}
                  onClick={() => runCommand(command)}
                  className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-all ${
                    index === selectedIndex
                      ? 'bg-white/12 text-white'
                      : 'text-white/62 hover:bg-white/7 hover:text-white'
                  }`}
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/9 text-[#b7dcff]">
                    <Icon size={14} />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{command.label}</span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
