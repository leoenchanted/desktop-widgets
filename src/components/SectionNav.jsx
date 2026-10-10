import { FiGrid, FiLayout, FiRepeat } from 'react-icons/fi';
import { motion } from 'framer-motion';

export default function SectionNav({ activeSection, onToggle, onSelect }) {
  return <nav className="os-section-nav" aria-label="桌面分区">
    <div className="os-section-segments">{[{ id: 'widgets', label: '组件区', Icon: FiGrid }, { id: 'work', label: '工作区', Icon: FiLayout }].map(({ id, label, Icon }) => <button key={id} onClick={() => onSelect(id)} aria-pressed={activeSection === id}>
      {activeSection === id && <motion.span layoutId="section-highlight" className="os-section-highlight" transition={{ type: 'spring', stiffness: 380, damping: 32 }} />}
      <Icon size={14} /><span>{label}</span>
    </button>)}</div>
    <button className="os-section-swap" onClick={onToggle} title={activeSection === 'widgets' ? '切换到工作区' : '切换到组件区'} aria-label="切换分区"><FiRepeat size={15} /></button>
  </nav>;
}
