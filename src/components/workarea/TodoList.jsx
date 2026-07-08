import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence } from 'framer-motion';
import { FaCalendarTimes, FaPlus, FaSyncAlt, FaTasks, FaTrash } from 'react-icons/fa';
import { useTodoStore } from '../../store/useTodoStore';
import TodoItem from './TodoItem';
import DatePickerPopover from './DatePickerPopover';
import GlassPanel from '../ui/GlassPanel';
import PanelHeader from '../ui/PanelHeader';
import EmptyState from '../ui/EmptyState';

function isRepeatingTodo(todo) {
  return Boolean(todo?.pinGroupId && (todo.repeat === 'daily' || todo.pinned));
}

const RepeatDeleteDialog = ({ todo, onClose, onDeleteSingle, onDeleteFuture }) => {
  if (!todo) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center px-4 py-6"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/55 backdrop-blur-xl" />
      <div
        className="relative w-full max-w-[390px] rounded-[24px] border border-white/14 bg-[#07111d]/95 p-5 text-white shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl bg-[#ffb3b3]/12 text-[#ffc7c7]">
            <FaCalendarTimes size={15} />
          </span>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-white/92">删除每日重复日程</h3>
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-white/52">{todo.text}</p>
          </div>
        </div>

        <div className="grid gap-2">
          <button
            type="button"
            onClick={onDeleteSingle}
            className="flex min-h-12 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-3 text-left transition hover:border-white/18 hover:bg-white/[0.09]"
          >
            <FaTrash size={12} className="text-white/52" />
            <span className="min-w-0">
              <strong className="block text-sm text-white/86">删除此日程</strong>
              <small className="block text-xs leading-5 text-white/42">只删除 {todo.date} 这一天，之后仍会继续每日重复。</small>
            </span>
          </button>

          <button
            type="button"
            onClick={onDeleteFuture}
            className="flex min-h-12 items-center gap-3 rounded-2xl border border-[#ffb3b3]/18 bg-[#ffb3b3]/10 px-3 text-left transition hover:border-[#ffb3b3]/30 hover:bg-[#ffb3b3]/14"
          >
            <FaCalendarTimes size={12} className="text-[#ffc7c7]" />
            <span className="min-w-0">
              <strong className="block text-sm text-[#ffe1e1]">删除今天及未来所有日程</strong>
              <small className="block text-xs leading-5 text-[#ffd0d0]/58">删除当前日期和未来同组日程，过去记录保留。</small>
            </span>
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-4 h-10 w-full rounded-2xl border border-white/10 bg-white/[0.05] text-sm font-semibold text-white/62 transition hover:bg-white/[0.08] hover:text-white/82"
        >
          取消
        </button>
      </div>
    </div>,
    document.body,
  );
};

const TodoList = ({ todayKey }) => {
  const {
    items,
    currentDate,
    loading,
    datesWithData,
    setCurrentDate,
    addTodo,
    addRepeatingTodo,
    toggleTodo,
    deleteTodo,
    updateTodo,
    fetchDates,
    fetchTodos,
  } = useTodoStore();

  const [newText, setNewText] = useState('');
  const [pendingDeleteTodo, setPendingDeleteTodo] = useState(null);

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
  const trimmedNewText = newText.trim();

  const handleAdd = async () => {
    if (!trimmedNewText) return;
    await addTodo(trimmedNewText);
    setNewText('');
    fetchDates();
  };

  const handleAddRepeating = async () => {
    if (!trimmedNewText) return;
    await addRepeatingTodo(trimmedNewText);
    setNewText('');
  };

  const handleDateChange = async (date) => {
    await setCurrentDate(date);
  };

  const handleDeleteRequest = async (id) => {
    const todo = items.find((item) => item.id === id);
    if (!todo) return;

    if (isRepeatingTodo(todo)) {
      setPendingDeleteTodo(todo);
      return;
    }

    await deleteTodo(id, 'single');
  };

  const handleDeleteSingle = async () => {
    if (!pendingDeleteTodo) return;
    await deleteTodo(pendingDeleteTodo.id, 'single');
    setPendingDeleteTodo(null);
  };

  const handleDeleteFuture = async () => {
    if (!pendingDeleteTodo) return;
    await deleteTodo(pendingDeleteTodo.id, 'future');
    setPendingDeleteTodo(null);
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
            onChange={(event) => setNewText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') handleAdd();
            }}
            placeholder="添加一个任务"
            className="min-w-0 flex-1 rounded-2xl border border-white/12 bg-white/8 px-3 py-2 text-sm text-white/82 outline-none placeholder-white/28 transition-all focus:border-[#9cc9ff]/40 focus:bg-white/12 focus:ring-1 focus:ring-[#9cc9ff]/18"
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={!trimmedNewText}
            className="glass-control flex h-10 w-10 flex-shrink-0 items-center justify-center text-white/70 disabled:opacity-35"
            title="添加任务"
          >
            <FaPlus size={12} />
          </button>
          <button
            type="button"
            onClick={handleAddRepeating}
            disabled={!trimmedNewText}
            className="glass-control flex h-10 w-10 flex-shrink-0 items-center justify-center text-[#bcdcff] disabled:opacity-35"
            title="添加每日重复任务"
          >
            <FaSyncAlt size={12} />
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
                  onDelete={handleDeleteRequest}
                  onUpdate={updateTodo}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <RepeatDeleteDialog
        todo={pendingDeleteTodo}
        onClose={() => setPendingDeleteTodo(null)}
        onDeleteSingle={handleDeleteSingle}
        onDeleteFuture={handleDeleteFuture}
      />
    </GlassPanel>
  );
};

export default TodoList;