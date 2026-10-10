import { useEffect, useState } from 'react';
import { FiColumns, FiEdit3, FiCheckSquare, FiClock, FiBookmark, FiActivity, FiArrowLeft } from 'react-icons/fi';
import TodoList from './TodoList';
import MarkdownEditor from './MarkdownEditor';
import PomodoroTimer from './PomodoroTimer';
import PinnedNote from './PinnedNote';
import ActivityHeatmap from './ActivityHeatmap';
import { useTodayKey } from '../../hooks/useTodayKey';
import { formatDate } from '../../utils/date';
import { useSettingsStore } from '../../store/useSettingsStore';

const views = [
  { id: 'all', label: '总览', Icon: FiColumns }, { id: 'write', label: '写作', Icon: FiEdit3 },
  { id: 'tasks', label: '任务', Icon: FiCheckSquare }, { id: 'focus', label: '专注', Icon: FiClock },
  { id: 'notes', label: '置顶', Icon: FiBookmark }, { id: 'activity', label: '足迹', Icon: FiActivity },
];

export default function WorkArea({ view = 'all', onViewChange }) {
  const todayKey = useTodayKey();
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const setSection = useSettingsStore(state => state.setSection);
  const activeSection = useSettingsStore(state => state.activeSection);
  useEffect(() => { setSelectedDate(todayKey); }, [todayKey]);
  return <div className={`os-workspace os-view-${view}`}>
    <div className="os-window-bar"><div className="os-window-name"><button onClick={() => setSection('widgets')} title="返回桌面" aria-label="返回桌面"><FiArrowLeft /></button><span>工作空间</span><span className="os-window-slash">/</span><span className="os-window-date">{formatDate(selectedDate)}</span></div><span className="os-window-local"><i /> 浏览器本地保存</span></div>
    <div className="os-workspace-toolbar"><div><h1>{view === 'all' ? '让今天，有条不紊。' : { write: '给想法，一点空间。', tasks: '一次，做好一件事。', focus: '此刻，只专注于你。', notes: '重要的事，留在这里。', activity: '每一点积累，都算数。' }[view]}</h1></div>
      <div className="os-view-switcher" aria-label="工作区视图">{views.map(({ id, label, Icon }) => <button key={id} onClick={() => onViewChange(id)} aria-pressed={view === id} title={`${label}视图`}><Icon size={14} /><span>{label}</span></button>)}</div>
    </div>
    <div className="workspace-grid">
      <aside className="workspace-stack os-stack-left">
        <div className="os-tool-slot os-tool-focus"><PomodoroTimer todayKey={selectedDate} /></div>
        <div className="os-tool-slot os-tool-activity"><ActivityHeatmap visible={activeSection === 'work' && (view === 'all' || view === 'activity')} todayKey={todayKey} selectedDate={selectedDate} onDateSelect={date => { setSelectedDate(date); onViewChange('all'); }} /></div>
      </aside>
      <main className="os-editor-slot"><MarkdownEditor todayKey={selectedDate} /></main>
      <aside className="workspace-stack os-stack-right">
        <div className="os-tool-slot os-tool-tasks"><TodoList todayKey={selectedDate} /></div>
        <div className="os-tool-slot os-tool-notes"><PinnedNote /></div>
      </aside>
    </div>
  </div>;
}
