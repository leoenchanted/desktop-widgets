import React, { useState } from 'react';
import { FaCheck, FaTrash } from 'react-icons/fa';

const TodoItem = ({ todo, onToggle, onDelete, onUpdate }) => {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(todo.text);
  const completed = Boolean(todo.completed);

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
    <div className="group flex items-center gap-2 rounded-2xl px-2.5 py-2 transition-all duration-200 hover:bg-white/8">
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
          onChange={(e) => setText(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') {
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

      <button
        onClick={() => onDelete(todo.id)}
        className="rounded-lg p-1.5 text-white/0 transition-all duration-200 hover:bg-white/8 hover:text-[#ffb3b3] group-hover:text-white/30"
        title="删除任务"
      >
        <FaTrash size={10} />
      </button>
    </div>
  );
};

export default TodoItem;
