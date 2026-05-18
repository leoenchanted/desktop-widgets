import React, { useEffect, useRef, useState } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { formatDate, localDateKey, today } from '../../utils/date';

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

const DatePickerPopover = ({ currentDate, onDateChange, datesWithData = [] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => currentDate.slice(0, 7));
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const openPopover = () => {
    setViewMonth(currentDate.slice(0, 7));
    setIsOpen(true);
  };

  const year = Number(viewMonth.slice(0, 4));
  const month = Number(viewMonth.slice(5, 7)) - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const moveMonth = (offset) => {
    const date = new Date(year, month + offset, 1);
    setViewMonth(localDateKey(date).slice(0, 7));
  };

  const dateForDay = (day) => `${viewMonth}-${String(day).padStart(2, '0')}`;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={openPopover}
        className="glass-control flex w-full items-center justify-between gap-3 px-3 py-2 text-left"
      >
        <span className="truncate text-sm font-semibold text-white/78">{formatDate(currentDate)}</span>
        <svg width="9" height="9" viewBox="0 0 10 10" fill="none" className="flex-shrink-0 text-white/40">
          <path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-2 w-72 origin-top-left rounded-3xl border border-white/16 bg-[#121923]/95 p-3 shadow-2xl backdrop-blur-2xl animate-bubble">
          <div className="mb-3 flex items-center justify-between">
            <button
              onClick={() => moveMonth(-1)}
              className="flex h-8 w-8 items-center justify-center rounded-xl text-white/48 transition-colors hover:bg-white/10 hover:text-white"
            >
              <FaChevronLeft size={10} />
            </button>
            <span className="text-sm font-semibold text-white/80">
              {year}年{month + 1}月
            </span>
            <button
              onClick={() => moveMonth(1)}
              className="flex h-8 w-8 items-center justify-center rounded-xl text-white/48 transition-colors hover:bg-white/10 hover:text-white"
            >
              <FaChevronRight size={10} />
            </button>
          </div>

          <div className="mb-1 grid grid-cols-7 gap-1 text-center">
            {WEEKDAYS.map((day) => (
              <div key={day} className="py-1 text-[10px] font-semibold text-white/36">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {Array(firstDay)
              .fill(null)
              .map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
            {Array(daysInMonth)
              .fill(null)
              .map((_, i) => {
                const day = i + 1;
                const date = dateForDay(day);
                const selected = date === currentDate;
                const dayIsToday = date === today();
                const hasData = datesWithData.includes(date);

                return (
                  <button
                    key={day}
                    onClick={() => {
                      onDateChange(date);
                      setIsOpen(false);
                    }}
                    className={`relative flex h-9 items-center justify-center rounded-xl text-xs transition-all duration-200 ${
                      selected
                        ? 'bg-[#80bfff]/24 text-white ring-1 ring-[#80bfff]/35'
                        : dayIsToday
                          ? 'bg-white/8 text-white'
                          : 'text-white/56 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {day}
                    {hasData && (
                      <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[#7ee7ad]" />
                    )}
                  </button>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
};

export default DatePickerPopover;
