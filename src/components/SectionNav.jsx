import React from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const SectionNav = ({ activeSection, onToggle }) => {
  const isWidgets = activeSection === 'widgets';

  return (
    <>
      <div className="pointer-events-none fixed right-5 top-1/2 z-40 hidden -translate-y-1/2 md:block">
        <button
          onClick={onToggle}
          className="pointer-events-auto glass-panel flex h-14 w-14 items-center justify-center rounded-full p-0 text-white/62 transition-all hover:scale-105 hover:text-white"
          title={isWidgets ? '进入工作区' : '回到组件区'}
        >
          {isWidgets ? <FaChevronRight size={15} /> : <FaChevronLeft size={15} />}
        </button>
      </div>

      <div className="mb-5 flex items-center justify-center gap-2 px-6">
        <button
          onClick={onToggle}
          className={`h-2 rounded-full transition-all duration-500 ${
            isWidgets ? 'w-8 bg-white/78' : 'w-2 bg-white/24 hover:bg-white/42'
          }`}
          title="组件区"
        />
        <button
          onClick={onToggle}
          className={`h-2 rounded-full transition-all duration-500 ${
            !isWidgets ? 'w-8 bg-white/78' : 'w-2 bg-white/24 hover:bg-white/42'
          }`}
          title="工作区"
        />
      </div>
    </>
  );
};

export default SectionNav;
