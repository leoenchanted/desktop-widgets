import React, { useState, useRef, useCallback } from 'react';
import { FaPlus, FaTimes } from 'react-icons/fa';

const TabBar = ({ pages, activePageId, onSwitch, onAdd, onRemove, onRename }) => {
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef(null);

  const startRename = useCallback((page) => {
    setEditingId(page.id);
    setEditValue(page.title);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  const confirmRename = useCallback(() => {
    if (editingId && editValue.trim()) {
      onRename(editingId, editValue.trim());
    }
    setEditingId(null);
  }, [editingId, editValue, onRename]);

  return (
    <div className="flex items-center gap-0.5 overflow-x-auto px-5 pb-2 scrollbar-none">
      {pages.map((page) => (
        <div
          key={page.id}
          role="tab"
          aria-selected={page.id === activePageId}
          className={`group flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
            page.id === activePageId
              ? 'bg-white/12 text-white'
              : 'text-white/40 hover:bg-white/6 hover:text-white/70'
          }`}
          onClick={() => onSwitch(page.id)}
        >
          {editingId === page.id ? (
            <input
              ref={inputRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={confirmRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') confirmRename();
                if (e.key === 'Escape') setEditingId(null);
              }}
              className="w-20 bg-transparent outline-none"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span
              className="max-w-28 truncate"
              onDoubleClick={(e) => {
                e.stopPropagation();
                startRename(page);
              }}
            >
              {page.title}
            </span>
          )}
          {pages.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(page.id);
              }}
              className="flex size-4 shrink-0 items-center justify-center rounded-full text-white/20 transition-colors hover:bg-white/12 hover:text-[#ff8d8d]"
              aria-label={`关闭 ${page.title}`}
            >
              <FaTimes size={8} />
            </button>
          )}
        </div>
      ))}
      <button
        onClick={onAdd}
        className="flex size-6 shrink-0 items-center justify-center rounded-lg text-white/30 transition-colors hover:bg-white/8 hover:text-white/70"
        title="新建页面"
      >
        <FaPlus size={10} />
      </button>
    </div>
  );
};

export default TabBar;
