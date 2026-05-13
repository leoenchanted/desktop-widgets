import React from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const SectionNav = ({ activeSection, onToggle }) => {
  const isWidgets = activeSection === 'widgets';

  return (
    <div className="flex items-center justify-center gap-3 mb-6 px-6">
      <button
        onClick={onToggle}
        className="w-8 h-8 rounded-full bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/15 hover:border-white/30 transition-all duration-300 active:scale-90"
      >
        <FaChevronLeft size={11} />
      </button>

      <div className="flex items-center gap-1.5">
        <div className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${
          isWidgets ? 'bg-white/80 shadow-[0_0_6px_rgba(255,255,255,0.5)]' : 'bg-white/20'
        }`} />
        <div className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${
          !isWidgets ? 'bg-white/80 shadow-[0_0_6px_rgba(255,255,255,0.5)]' : 'bg-white/20'
        }`} />
      </div>

      <button
        onClick={onToggle}
        className="w-8 h-8 rounded-full bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/15 hover:border-white/30 transition-all duration-300 active:scale-90"
      >
        <FaChevronRight size={11} />
      </button>
    </div>
  );
};

export default SectionNav;
