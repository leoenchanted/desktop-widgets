import React, { useState } from 'react';
import { useTodoStore } from '../../store/useTodoStore';
import TodoItem from './TodoItem';
import DatePickerPopover from './DatePickerPopover';

const TodoList = () => {
  const {
    items,
    currentDate,
    loading,
    datesWithData,
    setCurrentDate,
    addTodo,
    toggleTodo,
    deleteTodo,
    updateTodo,
    fetchDates,
  } = useTodoStore();

  const [newText, setNewText] = useState('');

  React.useEffect(() => {
    useTodoStore.getState().fetchTodos(currentDate);
    fetchDates();
  }, [currentDate]);

  const handleAdd = async () => {
    if (!newText.trim()) return;
    await addTodo(newText.trim());
    setNewText('');
    fetchDates();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleAdd();
  };

  const handleDateChange = async (date) => {
    await setCurrentDate(date);
  };

  const completedCount = items.filter((i) => i.completed).length;

  return (
    <div className="bg-black/60 border-2 border-red-500/70 rounded-lg flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 border-b border-red-500/30">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] uppercase tracking-widest font-bold text-red-400/80">
            TODOLIST
          </span>
          <span className="text-[10px] text-white/30">
            {completedCount}/{items.length}
          </span>
        </div>
        <DatePickerPopover
          currentDate={currentDate}
          onDateChange={handleDateChange}
          datesWithData={datesWithData}
        />
        <div className="flex gap-2 mt-3">
          <input
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="新任务..."
            className="flex-1 bg-white/5 border border-red-500/30 rounded-lg px-3 py-1.5 text-xs text-white/80 placeholder-white/30 outline-none focus:bg-white/10 focus:border-red-500/50 transition-all"
          />
          <button
            onClick={handleAdd}
            disabled={!newText.trim()}
            className="px-3 py-1.5 bg-red-500/80 hover:bg-red-500 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg text-[10px] font-semibold transition-all"
          >
            添加
          </button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto glass-scrollbar p-2">
        {loading ? (
          <div className="flex items-center justify-center h-full text-white/30 text-xs">加载中...</div>
        ) : items.length === 0 ? (
          <div className="flex items-center justify-center h-full text-white/20 text-xs">今天还没有任务</div>
        ) : (
          items.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onToggle={toggleTodo}
              onDelete={deleteTodo}
              onUpdate={updateTodo}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default TodoList;
