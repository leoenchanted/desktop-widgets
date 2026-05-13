import React, { useState } from 'react';
import { FaCog, FaCheck } from 'react-icons/fa';
import { useSettingsStore } from '../store/useSettingsStore';

const Header = ({ onTogglePicker, showPicker }) => {
  const { username, setUsername, isEditMode, toggleEditMode } = useSettingsStore();

  return (
    <header className="pt-10 pb-8 px-6 md:px-8 flex flex-col md:flex-row justify-between items-end w-full mx-auto">
      <div>
        <div className="text-lg text-white/80 mb-1">Good Morning,</div>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="text-5xl md:text-6xl font-bold bg-transparent border-b-2 border-transparent hover:border-white/30 focus:border-white/50 outline-none min-w-[200px] transition-all text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-300 placeholder-white/50"
          spellCheck={false}
        />
      </div>

      <div className="flex gap-4 relative mt-6 md:mt-0">
        <button
          onClick={toggleEditMode}
          className={`w-11 h-11 rounded-full flex items-center justify-center border transition-all duration-300 backdrop-blur-md ${
            isEditMode
              ? 'bg-[#0A84FF] border-[#0A84FF] text-white rotate-0'
              : 'bg-white/15 border-white/30 hover:bg-white/30 rotate-0 hover:rotate-90'
          }`}
        >
          {isEditMode ? <FaCheck /> : <FaCog size={18} />}
        </button>

        <button
          onClick={onTogglePicker}
          className={`w-11 h-11 rounded-full flex items-center justify-center border border-white/30 backdrop-blur-md transition-all duration-300 text-white ${
            showPicker ? 'bg-white/30' : 'bg-white/15 hover:bg-white/30'
          }`}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
    </header>
  );
};

export default Header;
