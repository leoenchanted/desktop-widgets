import { FaCheck, FaSlidersH, FaImage, FaPlus } from 'react-icons/fa';
import { useSettingsStore } from '../store/useSettingsStore';
import IconButton from './ui/IconButton';
import AmbientPlayer from './AmbientPlayer';
import { useClock } from '../hooks/useClock';

export default function Header({ onTogglePicker, onOpenWallpaper, onLaunchpad, showPicker }) {
  const { username, setUsername, isEditMode, toggleEditMode, setSection } = useSettingsStore();
  const now = useClock();
  return <header className="app-header os-menubar">
    <div className="titlebar-drag-zone" aria-hidden="true" />
    <div className="os-menubar-left"><button className="os-wordmark" onClick={onLaunchpad} title="应用启动台"><span className="os-brand-symbol">d.</span><span>desktop</span></button><span className="os-menu-separator" /><input value={username} onChange={e => setUsername(e.target.value)} aria-label="桌面用户名" title="点击修改你的名字" spellCheck={false} maxLength={32} /><span className="os-local-indicator" title="记录保存在当前浏览器"><i /> 本地空间</span></div>
    <div className="os-menubar-ambient"><AmbientPlayer /></div>
    <div className="app-header-actions os-menubar-actions">
      <time className="os-menu-time">{now.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })}<b>{now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</b></time>
      <IconButton icon={isEditMode ? FaCheck : FaSlidersH} onClick={() => { setSection('widgets'); toggleEditMode(); }} active={isEditMode} title={isEditMode ? '完成编辑' : '编辑桌面'} />
      <IconButton icon={FaImage} onClick={onOpenWallpaper} title="壁纸设置" />
      <IconButton icon={FaPlus} onClick={onTogglePicker} active={showPicker} title="添加组件" />
    </div>
  </header>;
}
