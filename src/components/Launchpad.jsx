import { useState } from 'react';
import { FiEdit3, FiCheckSquare, FiClock, FiBookmark, FiActivity, FiImage, FiDownload, FiPlus, FiSearch, FiArrowUpRight, FiPenTool } from 'react-icons/fi';
import DesktopDialog from './ui/DesktopDialog';

export default function Launchpad({ onClose, onOpenApp, onWallpaper, onBackup, onWidgets }) {
  const [query, setQuery] = useState('');
  const apps = [
    { id: 'canvas', Icon: FiPenTool, label: '无限画布', description: '写字、贴图、一起构思', color: 'mint' },
    { id: 'write', Icon: FiEdit3, label: '日记草稿', description: '让想法落在纸上', color: 'blue' },
    { id: 'tasks', Icon: FiCheckSquare, label: '任务清单', description: '为今天留一点秩序', color: 'green' },
    { id: 'focus', Icon: FiClock, label: '番茄钟', description: '沉浸在一件事里', color: 'peach' },
    { id: 'notes', Icon: FiBookmark, label: '置顶记录', description: '收藏长期重要的事', color: 'sand' },
    { id: 'activity', Icon: FiActivity, label: '活动热力图', description: '看见每一天的积累', color: 'mint' },
    { id: 'wallpaper', Icon: FiImage, label: '壁纸', description: '换一种心情', color: 'blue', action: onWallpaper },
    { id: 'backup', Icon: FiDownload, label: '备份与恢复', description: '把珍贵的记录带走', color: 'mint', action: onBackup },
    { id: 'widgets', Icon: FiPlus, label: '组件库', description: '布置你的私人桌面', color: 'slate', action: onWidgets },
  ];
  const filtered = apps.filter(app => `${app.label} ${app.description} ${app.id}`.toLowerCase().includes(query.toLowerCase()));
  return <DesktopDialog title="想做点什么？" eyebrow="LAUNCHPAD" onClose={onClose} className="os-launchpad">
    <label className="os-app-search"><FiSearch /><input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="查找应用…" aria-label="查找应用" /><kbd>ESC</kbd></label>
    <div className="os-app-grid">{filtered.map(({ id, Icon, label, description, color, action }) => <button key={id} onClick={() => { onClose(); if (action) action(); else onOpenApp(id); }}><span className={`os-app-icon os-icon-${color}`}><Icon size={28} strokeWidth={1.5} /></span><strong>{label}</strong><small>{description}</small><FiArrowUpRight className="os-app-arrow" /></button>)}</div>
    {!filtered.length && <p className="os-search-empty">没有找到应用，试试「日记」或「任务」。</p>}
    <p className="os-dialog-note">每个小工具，都是你生活的一部分。</p>
  </DesktopDialog>;
}
