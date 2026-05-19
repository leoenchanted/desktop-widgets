import React from 'react';
import { useSettingsStore } from '../store/useSettingsStore';
import SectionNav from './SectionNav';

const Layout = ({ widgetBoard, workArea }) => {
  const { activeSection, toggleSection, setSection } = useSettingsStore();

  return (
    <div className="w-full">
      <SectionNav
        activeSection={activeSection}
        onToggle={toggleSection}
        onSetSection={setSection}
      />

      <div className="overflow-hidden px-4 md:px-6">
        <div
          className="flex transition-transform duration-700 ease-apple"
          style={{
            transform: activeSection === 'widgets' ? 'translateX(0)' : 'translateX(-50%)',
            width: '200%',
          }}
        >
          <div className="w-1/2 px-1 md:px-2">
            <div className="mx-auto max-w-[1640px] pb-10">{widgetBoard}</div>
          </div>

          <div className="w-1/2 px-1 md:px-2">{workArea}</div>
        </div>
      </div>
    </div>
  );
};

export default Layout;
