import React from 'react';
import { FaCalendarDay, FaDatabase, FaLayerGroup } from 'react-icons/fa';
import TodoList from './TodoList';
import MarkdownEditor from './MarkdownEditor';
import PomodoroTimer from './PomodoroTimer';
import DailyReview from './DailyReview';
import PlaceholderSlot from './PlaceholderSlot';
import GlassPanel from '../ui/GlassPanel';
import StatusPill from '../ui/StatusPill';
import { formatDate, today } from '../../utils/date';

const WorkArea = () => {
  const date = today();

  return (
    <div className="mx-auto flex w-full max-w-[1640px] flex-col gap-4 pb-8 md:min-h-[calc(100vh-230px)]">
      <GlassPanel className="cockpit-panel cockpit-ruler px-5 py-5 md:px-6" padded={false}>
        <div className="relative z-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="panel-kicker flex items-center gap-2">
              <FaLayerGroup size={11} />
              Workspace Cockpit
            </div>
            <h1 className="mt-2 text-2xl font-medium leading-none text-white md:text-4xl">
              今日工作台
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2 pb-1">
            <StatusPill variant="accent">
              <FaCalendarDay className="mr-1.5" size={11} />
              {formatDate(date)}
            </StatusPill>
            <StatusPill>
              <FaDatabase className="mr-1.5" size={10} />
              IndexedDB 本地保存
            </StatusPill>
          </div>
        </div>
      </GlassPanel>

      <div className="workspace-grid flex-1">
        <aside className="workspace-stack">
          <PomodoroTimer />
          <DailyReview />
        </aside>

        <main className="min-h-[520px] min-w-0 md:min-h-[620px]">
          <MarkdownEditor />
        </main>

        <aside className="workspace-stack">
          <TodoList />
          <PlaceholderSlot title="灵感暂存" description="待扩展" />
        </aside>
      </div>
    </div>
  );
};

export default WorkArea;
