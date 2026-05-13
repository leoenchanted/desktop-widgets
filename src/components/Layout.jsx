import React from 'react';
import { useSettingsStore } from '../store/useSettingsStore';
import SectionNav from './SectionNav';

const Layout = ({ widgetBoard, workArea }) => {
  const { activeSection, toggleSection } = useSettingsStore();

  return (
    <div className="w-full">
      <SectionNav activeSection={activeSection} onToggle={toggleSection} />

      <div className="overflow-hidden px-4 md:px-6">
        <div
          className="flex transition-transform duration-500 ease-apple"
          style={{
            transform: activeSection === 'widgets' ? 'translateX(0)' : 'translateX(-50%)',
            width: '200%',
          }}
        >
          {/* 组件区 */}
          <div className="w-1/2 min-h-[60vh]">
            {widgetBoard}
          </div>

          {/* 工作区 */}
          <div className="w-1/2 min-h-[60vh] px-4">
            {workArea}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Layout;
