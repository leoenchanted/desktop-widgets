import React from 'react';
import { FaChevronLeft, FaChevronRight, FaTasks, FaThLarge } from 'react-icons/fa';

const MobileTab = ({ active, icon: Icon, label, onClick }) => (
  <button
    onClick={onClick}
    aria-pressed={active}
    className={`flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all ${
      active
        ? 'bg-white/16 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.16)]'
        : 'text-white/48 hover:bg-white/8 hover:text-white/72'
    }`}
  >
    <Icon size={13} />
    {label}
  </button>
);

const SectionNav = ({ activeSection, onToggle, onSetSection }) => {
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

      <div className="sticky top-3 z-30 mb-4 px-4 md:hidden">
        <div className="glass-panel mx-auto grid max-w-sm grid-cols-2 gap-1 p-1 shadow-2xl">
          <MobileTab
            active={isWidgets}
            icon={FaThLarge}
            label="组件区"
            onClick={() => onSetSection('widgets')}
          />
          <MobileTab
            active={!isWidgets}
            icon={FaTasks}
            label="工作区"
            onClick={() => onSetSection('work')}
          />
        </div>
      </div>

      <div className="mb-5 hidden items-center justify-center gap-2 px-6 md:flex">
        <button
          onClick={() => onSetSection('widgets')}
          className={`h-2 rounded-full transition-all duration-500 ${
            isWidgets ? 'w-8 bg-white/78' : 'w-2 bg-white/24 hover:bg-white/42'
          }`}
          title="组件区"
        />
        <button
          onClick={() => onSetSection('work')}
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
