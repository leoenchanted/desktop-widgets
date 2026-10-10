import { FiArrowUpRight, FiEdit3, FiCheckSquare, FiClock, FiPlus, FiMove, FiGrid } from 'react-icons/fi';
import { useSettingsStore } from '../store/useSettingsStore';
import { useClock } from '../hooks/useClock';

export default function DesktopHome({ children, count, onOpenApp, onAdd, onArrange }) {
  const username = useSettingsStore(state => state.username);
  const isEditMode = useSettingsStore(state => state.isEditMode);
  const now = useClock();
  const hour = now.getHours();
  const greeting = hour < 6 ? '夜深了' : hour < 12 ? '早上好' : hour < 18 ? '下午好' : '晚上好';
  return <div className="os-home">
    <section className="os-home-intro">
      <div><div className="os-eyebrow"><span /> A LITTLE SPACE FOR YOU</div><h1>{greeting}，{username === 'Guest' ? '今天的你' : username}。<span>让灵感，有处安放。</span></h1><p>写一点，做一点。按自己的节奏，过好今天。</p></div>
      <div className="os-home-shortcuts" aria-label="快速开始">
        {[{ id: 'write', Icon: FiEdit3, label: '随手写写', sub: '记录此刻', color: 'blue' }, { id: 'tasks', Icon: FiCheckSquare, label: '今日计划', sub: '一件一件来', color: 'green' }, { id: 'focus', Icon: FiClock, label: '专注一下', sub: '留一段自己的时间', color: 'peach' }].map(({ id, Icon, label, sub, color }) => <button key={id} onClick={() => onOpenApp(id)}><span className={`os-app-icon os-icon-${color}`}><Icon size={23} strokeWidth={1.5} /></span><span><strong>{label}</strong><small>{sub}</small></span><FiArrowUpRight className="os-shortcut-arrow" /></button>)}
      </div>
    </section>
    <div className="os-board-heading"><div><h2>我的组件</h2><span>{String(count).padStart(2, '0')}</span></div><div>{isEditMode && count > 1 && <button onClick={onArrange} title="按尺寸整理布局"><FiGrid /> 整理布局</button>}<button onClick={onAdd}><FiPlus /> 添加组件</button></div></div>
    {isEditMode && <div className="os-edit-hint" role="status"><FiMove /><span>拖动组件调整顺序，拖动右下角调整大小。完成后点击右上角 ✓。</span></div>}
    {count ? children : <button className="os-empty-desktop" onClick={onAdd}><FiPlus size={28} /><strong>从一个小组件开始</strong><span>时钟、日历、照片……把喜欢的放在桌面上。</span></button>}
    <footer className="os-home-footer"><span><i /> 只属于你的桌面</span><span>灵感 · 日常 · 专注</span><span>按 <kbd>Ctrl</kbd> <kbd>K</kbd> 快速前往</span></footer>
  </div>;
}
