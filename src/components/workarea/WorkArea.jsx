import React from 'react';
import TodoList from './TodoList';
import MarkdownEditor from './MarkdownEditor';
import PomodoroTimer from './PomodoroTimer';
import DailyReview from './DailyReview';
import PlaceholderSlot from './PlaceholderSlot';

const WorkArea = () => {
  return (
    <div className="flex flex-col h-full gap-0">
      {/* Top full-width bar */}
      <div className="border-2 border-red-500/70 rounded-t-xl px-5 py-3 bg-black/40 mb-0">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-white/80">WORKSPACE</span>
          <div className="flex items-center gap-3 text-[10px] text-white/40">
            <span>Ctrl+S 保存</span>
            <span>Cmd+K 命令</span>
          </div>
        </div>
      </div>

      {/* Three-column main area */}
      <div className="flex flex-1 gap-0 min-h-0">
        {/* Left column: Pomodoro + DailyReview */}
        <div className="flex flex-col w-64 flex-shrink-0 gap-0 border-r-2 border-red-500/70">
          <div className="flex-1 border-b-2 border-red-500/70 overflow-auto">
            <div className="p-3 h-full">
              <PomodoroTimer />
            </div>
          </div>
          <div className="flex-1 overflow-auto">
            <div className="p-3 h-full">
              <DailyReview />
            </div>
          </div>
        </div>

        {/* Center column: Markdown Editor (main) */}
        <div className="flex-1 min-w-0 border-r-2 border-red-500/70">
          <div className="p-3 h-full">
            <MarkdownEditor />
          </div>
        </div>

        {/* Right column: TodoList + Placeholder */}
        <div className="flex flex-col w-72 flex-shrink-0 gap-0">
          <div className="flex-1 border-b-2 border-red-500/70 overflow-auto">
            <div className="p-3 h-full">
              <TodoList />
            </div>
          </div>
          <div className="flex-1 overflow-auto">
            <div className="p-3 h-full">
              <PlaceholderSlot />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkArea;
