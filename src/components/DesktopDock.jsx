import { useState } from 'react';
import { FiGrid, FiLayout, FiCommand, FiSearch, FiDownload, FiMoon, FiHelpCircle, FiPenTool } from 'react-icons/fi';

export default function DesktopDock({ activeSection, onSection, onLaunchpad, onSearch, onBackup, onLock, onHelp, onCanvas }) {
  const [hovered, setHovered] = useState(null);
  const actions = [
    { id: 'widgets', label: '组件区', Icon: FiGrid, color: 'blue', action: () => onSection('widgets') },
    { id: 'work', label: '工作区', Icon: FiLayout, color: 'green', action: () => onSection('work') },
    { id: 'canvas', label: '无限画布', Icon: FiPenTool, color: 'mint', action: onCanvas },
    { id: 'apps', label: '应用启动台', Icon: FiCommand, color: 'peach', action: onLaunchpad },
    { id: 'search', label: '命令面板', Icon: FiSearch, color: 'slate', action: onSearch },
    { id: 'backup', label: '备份数据', Icon: FiDownload, color: 'mint', action: onBackup },
    { id: 'help', label: '使用指南', Icon: FiHelpCircle, color: 'slate', action: onHelp },
    { id: 'lock', label: '回到锁屏', Icon: FiMoon, color: 'slate', action: onLock },
  ];
  return <nav className="os-dock" aria-label="桌面 Dock" onMouseLeave={() => setHovered(null)}>
    {actions.map(({ id, label, Icon, color, action }, index) => <button key={id} className={`os-dock-item ${id === 'backup' ? 'os-dock-divider' : ''}`} aria-label={label} title={label} aria-current={activeSection === id ? 'page' : undefined} onClick={action} onMouseEnter={() => setHovered(index)}>
      <span className="os-dock-tooltip">{label}{id === 'search' && <kbd>Ctrl K</kbd>}</span>
      <span className={`os-app-icon os-icon-${color}`} style={{ '--dock-scale': hovered === index ? 1.18 : hovered !== null && Math.abs(hovered - index) === 1 ? 1.06 : 1 }}><Icon size={23} strokeWidth={1.6} /></span>
      <span className={`os-dock-indicator ${activeSection === id ? 'is-active' : ''}`} />
    </button>)}
  </nav>;
}
