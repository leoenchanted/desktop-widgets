import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaCheck, FaSyncAlt, FaTrash } from 'react-icons/fa';

const TodoItem = ({ todo, onToggle, onDelete, onUpdate }) => {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(todo.text);
  const completed = Boolean(todo.completed);
  const repeating = Boolean(todo.pinGroupId && (todo.repeat === 'daily' || todo.pinned));

  const handleSave = () => {
    const nextText = text.trim();
    if (nextText && nextText !== todo.text) {
      onUpdate(todo.id, nextText);
    } else {
      setText(todo.text);
    }
    setEditing(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginTop: 0, marginBottom: 0, overflow: 'hidden' }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="group flex items-center gap-2 rounded-2xl px-2.5 py-2 transition-all duration-200 hover:bg-white/8"
    >
      <button
        onClick={() => onToggle(todo.id)}
        className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${
          completed
            ? 'border-[#7ee7ad]/70 bg-[#7ee7ad]/22 text-[#c8f8da]'
            : 'border-white/18 bg-white/6 text-transparent hover:border-[#80bfff]/50'
        }`}
        title={completed ? '标记未完成' : '标记完成'}
      >
        <FaCheck size={9} />
      </button>

      {editing ? (
        <input
          autoFocus
          value={text}
          onChange={(event) => setText(event.target.value)}
          onBlur={handleSave}
          onKeyDown={(event) => {
            if (event.key === 'Enter') handleSave();
            if (event.key === 'Escape') {
              setText(todo.text);
              setEditing(false);
            }
          }}
          className="min-w-0 flex-1 border-b border-[#80bfff]/35 bg-transparent py-0.5 text-sm text-white outline-none"
        />
      ) : (
        <button
          onClick={() => setEditing(true)}
          className={`min-w-0 flex-1 truncate text-left text-sm transition-all duration-300 ${
            completed ? 'text-white/32 line-through' : 'text-white/76 hover:text-white'
          }`}
        >
          {todo.text}
        </button>
      )}

      {repeating && (
        <span
          className="flex h-6 flex-shrink-0 items-center gap-1 rounded-lg bg-[#9cc9ff]/10 px-1.5 text-[10px] font-semibold text-[#bcdcff]"
          title="每日重复日程"
        >
          <FaSyncAlt size={8} />
          每日
        </span>
      )}

      <button
        onClick={() => onDelete(todo.id)}
        className="rounded-lg p-1.5 text-white/0 transition-all duration-200 hover:bg-white/8 hover:text-[#ffb3b3] group-hover:text-white/30"
        title="删除任务"
      >
        <FaTrash size={10} />
      </button>
    </motion.div>
  );
};

export default TodoItem;