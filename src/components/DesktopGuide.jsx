import { FiArrowUp, FiGrid, FiLayout, FiDownload } from 'react-icons/fi';
import DesktopDialog from './ui/DesktopDialog';

export default function DesktopGuide({ onClose, onChangelog }) {
  return <DesktopDialog title="你的桌面，由你定义。" eyebrow="MAKE YOURSELF AT HOME" onClose={onClose}>
    <p className="os-guide-intro">一个放下杂念、记录日常的小空间。第一次来，从这里开始。</p>
    <div className="os-guide-steps">{[
      [FiArrowUp, '01', '轻轻上滑，回到自己的空间', '锁屏支持上滑、滚轮和点击进入。Dock 月亮按钮可随时回到锁屏；这是欢迎界面，不是密码保护。'],
      [FiGrid, '02', '把喜欢的，放在桌面上', '右上角 + 添加组件，编辑按钮调整排列与大小；旁边的壁纸按钮可以换背景。'],
      [FiLayout, '03', '开始一件小事', '工作区集合日记、任务、专注和置顶记录。顶部视图按钮可以只看当前需要的工具。'],
      [FiDownload, '04', '记得带走你的记录', '内容保存在当前浏览器。Dock 的备份按钮可以导出完整 JSON，也能导入旧备份。'],
    ].map(([Icon, number, title, description]) => <div key={number}><span className="os-guide-icon"><Icon size={19} /></span><div><small>{number}</small><h3>{title}</h3><p>{description}</p></div></div>)}</div>
    <div className="os-guide-bottom"><span><kbd>Ctrl / ⌘ K</kbd> 命令面板 <kbd>Esc</kbd> 关闭窗口</span><button onClick={() => { onClose(); onChangelog(); }}>查看更新日志 ↗</button></div>
  </DesktopDialog>;
}
