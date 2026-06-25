import React, { useEffect, useState } from 'react';
import { FaCalendarDay, FaDatabase, FaLayerGroup } from 'react-icons/fa';
import TodoList from './TodoList';
import MarkdownEditor from './MarkdownEditor';
import PomodoroTimer from './PomodoroTimer';
import PinnedNote from './PinnedNote';
import ActivityHeatmap from './ActivityHeatmap';
import GlassPanel from '../ui/GlassPanel';
import StatusPill from '../ui/StatusPill';
import { useTodayKey } from '../../hooks/useTodayKey';
import { formatDate } from '../../utils/date';

const WorkArea = () => {
  const todayKey = useTodayKey();
  const [selectedDate, setSelectedDate] = useState(todayKey);

  useEffect(() => {
    setSelectedDate(todayKey);
  }, [todayKey]);

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
              {formatDate(selectedDate)}
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
          <PomodoroTimer todayKey={selectedDate} />
          <ActivityHeatmap
            todayKey={todayKey}
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
          />
        </aside>

        <main className="h-[min(72svh,680px)] min-h-[520px] min-w-0 md:h-[clamp(620px,calc(100svh-260px),780px)] md:min-h-0">
          <MarkdownEditor todayKey={selectedDate} />
        </main>

        <aside className="workspace-stack">
          <TodoList todayKey={selectedDate} />
          <PinnedNote />
        </aside>
      </div>
    </div>
  );
};

export default WorkArea;
