import React, { useState } from 'react';
import { FaTrash, FaCheck } from 'react-icons/fa';

const TodoItem = ({ todo, onToggle, onDelete, onUpdate }) => {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(todo.text);

  const handleSave = () => {
    if (text.trim() && text !== todo.text) {
      onUpdate(todo.id, text.trim());
    } else {
      setText(todo.text);
    }
    setEditing(false);
  };

  return (
    <div className="group flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-white/5 transition-all duration-200">
      <button
        onClick={() => onToggle(todo.id)}
        className={`w-4 h-4 rounded-sm border flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
          todo.completed
            ? 'bg-red-500 border-red-500'
            : 'border-red-500/50 hover:border-red-500'
        }`}
      >
        {todo.completed && <FaCheck size={7} className="text-white" />}
      </button>

      {editing ? (
        <input
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          className="flex-1 bg-transparent border-b border-red-500/30 outline-none text-xs text-white py-0.5"
        />
      ) : (
        <span
          onClick={() => setEditing(true)}
          className={`flex-1 text-xs cursor-text transition-all duration-300 ${
            todo.completed
              ? 'line-through text-white/30'
              : 'text-white/70 hover:text-white'
          }`}
        >
          {todo.text}
        </span>
      )}

      <button
        onClick={() => onDelete(todo.id)}
        className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-red-400 transition-all duration-200 p-1"
      >
        <FaTrash size={9} />
      </button>
    </div>
  );
};

export default TodoItem;
