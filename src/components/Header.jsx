import React, { useEffect, useMemo, useState } from 'react';
import { FaCheck, FaCog, FaPlus } from 'react-icons/fa';
import { useSettingsStore } from '../store/useSettingsStore';
import IconButton from './ui/IconButton';
import { formatDate } from '../utils/date';
import AmbientPlayer from './AmbientPlayer';

const pad = (value) => String(value).padStart(2, '0');

const Header = ({ onTogglePicker, showPicker }) => {
  const { username, setUsername, isEditMode, toggleEditMode } = useSettingsStore();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const greeting = useMemo(() => {
    const hour = now.getHours();
    if (hour < 6) return '夜深了';
    if (hour < 12) return '早上好';
    if (hour < 18) return '下午好';
    return '晚上好';
  }, [now]);

  const dateKey = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

  return (
    <header className="mx-auto grid w-full max-w-[1680px] grid-cols-[minmax(0,1fr)_auto] gap-4 px-5 pb-4 pt-[calc(env(safe-area-inset-top)+1.25rem)] md:grid-cols-[minmax(0,1fr)_minmax(260px,340px)_minmax(0,1fr)] md:items-end md:gap-6 md:px-8 md:pb-6 md:pt-7">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-white/58">
          <span className="rounded-full border border-white/10 bg-white/7 px-3 py-1">
            {greeting}
          </span>
          <span>{formatDate(dateKey)}</span>
        </div>
        <div className="mt-3 flex flex-wrap items-end gap-4">
          <div className="display-type text-5xl font-medium leading-[0.9] text-white md:text-7xl">
            {pad(now.getHours())}:{pad(now.getMinutes())}
          </div>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mb-1 min-w-[160px] max-w-full border-b border-transparent bg-transparent text-2xl font-medium tracking-normal text-white/88 outline-none transition-all placeholder-white/30 hover:border-white/18 focus:border-[#9cc9ff]/50 focus:text-white md:text-4xl"
            spellCheck={false}
          />
        </div>
      </div>

      <div className="col-span-2 row-start-2 flex justify-center md:col-span-1 md:col-start-2 md:row-start-1 md:pb-1">
        <AmbientPlayer className="max-w-[340px]" />
      </div>

      <div className="col-start-2 row-start-1 flex items-center justify-end gap-3 md:col-start-3 md:row-start-1 md:pb-1">
        <IconButton
          icon={isEditMode ? FaCheck : FaCog}
          onClick={toggleEditMode}
          active={isEditMode}
          title={isEditMode ? '完成编辑' : '编辑桌面'}
          className={isEditMode ? 'bg-[#9cc9ff]/20 text-white' : ''}
        />
        <IconButton
          icon={FaPlus}
          onClick={onTogglePicker}
          active={showPicker}
          title="添加组件"
        />
      </div>
    </header>
  );
};

export default Header;
