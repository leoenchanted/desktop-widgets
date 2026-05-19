import React from 'react';
import { FaExchangeAlt } from 'react-icons/fa';

const SectionNav = ({ activeSection, onToggle }) => {
  const isWidgets = activeSection === 'widgets';

  return (
    <div className="mb-5 flex justify-center px-4 md:mb-7">
      <button
        onClick={onToggle}
        className="glass-panel group inline-flex items-center gap-3 rounded-full px-3 py-2 text-white/68 shadow-2xl transition-all hover:-translate-y-0.5 hover:border-white/26 hover:text-white"
        title={isWidgets ? '切换到工作区' : '切换到组件区'}
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-[#b7dcff] transition-transform group-hover:rotate-180">
          <FaExchangeAlt size={13} />
        </span>
        <span className="flex items-center gap-2 pr-2 text-xs font-semibold">
          <span className={isWidgets ? 'text-white' : 'text-white/36'}>组件区</span>
          <span className="text-white/26">/</span>
          <span className={!isWidgets ? 'text-white' : 'text-white/36'}>工作区</span>
        </span>
      </button>
    </div>
  );
};

export default SectionNav;
