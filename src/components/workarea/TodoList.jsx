import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { FaPlus, FaTasks } from 'react-icons/fa';
import { useTodoStore } from '../../store/useTodoStore';
import TodoItem from './TodoItem';
import DatePickerPopover from './DatePickerPopover';
import GlassPanel from '../ui/GlassPanel';
import PanelHeader from '../ui/PanelHeader';
import EmptyState from '../ui/EmptyState';

const TodoList = ({ todayKey }) => {
  const {
    items,
    currentDate,
    loading,
    datesWithData,
    setCurrentDate,
    addTodo,
    toggleTodo,
    togglePin,
    deleteTodo,
    updateTodo,
    fetchDates,
    fetchTodos,
  } = useTodoStore();

  const [newText, setNewText] = useState('');

  useEffect(() => {
    setCurrentDate(todayKey);
  }, [setCurrentDate, todayKey]);

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
    <GlassPanel className="todo-list-panel workspace-fixed-panel relative z-20 overflow-hidden" padded={false}>
      <div className="todo-list-header px-4 pb-3 pt-4">
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

        <div className="relative z-30 mt-4">
          <DatePickerPopover
            currentDate={currentDate}
            onDateChange={handleDateChange}
            datesWithData={datesWithData}
          />
        </div>

        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/8">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#9ae9bd] to-[#9cc9ff] transition-all duration-500"
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
            className="min-w-0 flex-1 rounded-2xl border border-white/12 bg-white/8 px-3 py-2 text-sm text-white/82 outline-none placeholder-white/28 transition-all focus:border-[#9cc9ff]/40 focus:bg-white/12 focus:ring-1 focus:ring-[#9cc9ff]/18"
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

      <div className="todo-list-divider soft-divider" />

      <div className="todo-list-scroll absolute bottom-0 left-0 right-0 overflow-y-scroll overscroll-contain p-2 glass-scrollbar">
        {loading ? (
          <div className="flex h-full items-center justify-center text-sm text-white/35">
            加载中...
          </div>
        ) : items.length === 0 ? (
          <EmptyState title="今天还没有任务" icon={FaTasks} />
        ) : (
          <div className="space-y-1">
            <AnimatePresence initial={false}>
              {items.map((todo) => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  onToggle={toggleTodo}
                  onTogglePin={togglePin}
                  onDelete={deleteTodo}
                  onUpdate={updateTodo}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </GlassPanel>
  );
};

export default TodoList;
