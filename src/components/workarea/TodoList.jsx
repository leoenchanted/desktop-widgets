import React, { useEffect, useMemo, useState } from 'react';
import { FaPlus, FaTasks } from 'react-icons/fa';
import { useTodoStore } from '../../store/useTodoStore';
import TodoItem from './TodoItem';
import DatePickerPopover from './DatePickerPopover';
import GlassPanel from '../ui/GlassPanel';
import PanelHeader from '../ui/PanelHeader';
import EmptyState from '../ui/EmptyState';

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
    fetchTodos,
  } = useTodoStore();

  const [newText, setNewText] = useState('');

  useEffect(() => {
    fetchTodos(currentDate);
    fetchDates();
  }, [currentDate, fetchDates, fetchTodos]);

  const completedCount = useMemo(
    () => items.filter((item) => Boolean(item.completed)).length,
    [items],
  );
  const progress = items.length ? Math.round((completedCount / items.length) * 100) : 0;

  const handleAdd = async () => {
    if (!newText.trim()) return;
    await addTodo(newText.trim());
    setNewText('');
    fetchDates();
  };

  const handleDateChange = async (date) => {
    await setCurrentDate(date);
  };

  return (
    <GlassPanel className="flex h-full min-h-[250px] flex-col overflow-hidden" padded={false}>
      <div className="px-4 pb-3 pt-4">
        <PanelHeader
          eyebrow="Todo"
          title="任务清单"
          icon={FaTasks}
          action={
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-white/58">
              {completedCount}/{items.length}
            </span>
          }
        />

        <div className="mt-4">
          <DatePickerPopover
            currentDate={currentDate}
            onDateChange={handleDateChange}
            datesWithData={datesWithData}
          />
        </div>

        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/8">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#7ee7ad] to-[#80bfff] transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="mt-4 flex gap-2">
          <input
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd();
            }}
            placeholder="添加一个任务"
            className="min-w-0 flex-1 rounded-2xl border border-white/12 bg-white/8 px-3 py-2 text-sm text-white/82 outline-none placeholder-white/28 transition-all focus:border-[#80bfff]/40 focus:bg-white/12 focus:ring-1 focus:ring-[#80bfff]/18"
          />
          <button
            onClick={handleAdd}
            disabled={!newText.trim()}
            className="glass-control flex h-10 w-10 items-center justify-center text-white/70 disabled:opacity-35"
            title="添加任务"
          >
            <FaPlus size={12} />
          </button>
        </div>
      </div>

      <div className="soft-divider" />

      <div className="flex-1 overflow-y-auto p-2 glass-scrollbar">
        {loading ? (
          <div className="flex h-full items-center justify-center text-sm text-white/35">
            加载中...
          </div>
        ) : items.length === 0 ? (
          <EmptyState title="今天还没有任务" icon={FaTasks} />
        ) : (
          <div className="space-y-1">
            {items.map((todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onToggle={toggleTodo}
                onDelete={deleteTodo}
                onUpdate={updateTodo}
              />
            ))}
          </div>
        )}
      </div>
    </GlassPanel>
  );
};

export default TodoList;
