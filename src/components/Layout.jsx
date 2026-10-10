import { useSettingsStore } from '../store/useSettingsStore';
import SectionNav from './SectionNav';

export default function Layout({ widgetBoard, workArea }) {
  const { activeSection, toggleSection, setSection } = useSettingsStore();
  return <div className="os-layout">
    <SectionNav activeSection={activeSection} onToggle={toggleSection} onSelect={setSection} />
    <div className="os-section-content">
      <section hidden={activeSection !== 'widgets'} aria-label="组件区" className={activeSection === 'widgets' ? 'os-section-enter' : ''}>{widgetBoard}</section>
      <section hidden={activeSection !== 'work'} aria-label="工作区" className={activeSection === 'work' ? 'os-section-enter' : ''}>{workArea}</section>
    </div>
  </div>;
}
