import React, { useState, useRef, useEffect } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { formatDate, today } from '../../utils/date';

const DatePickerPopover = ({ currentDate, onDateChange, datesWithData }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => currentDate.slice(0, 7));
  const ref = useRef();

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

  const year = parseInt(viewMonth.slice(0, 4));
  const month = parseInt(viewMonth.slice(5, 7)) - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const prevMonth = () => {
    const d = new Date(year, month - 1, 1);
    setViewMonth(d.toISOString().slice(0, 7));
  };
  const nextMonth = () => {
    const d = new Date(year, month + 1, 1);
    setViewMonth(d.toISOString().slice(0, 7));
  };

  const hasData = (day) => {
    const ds = `${viewMonth}-${String(day).padStart(2, '0')}`;
    return datesWithData.includes(ds);
  };

  const isToday = (day) => {
    const ds = `${viewMonth}-${String(day).padStart(2, '0')}`;
    return ds === today();
  };

  const isSelected = (day) => {
    const ds = `${viewMonth}-${String(day).padStart(2, '0')}`;
    return ds === currentDate;
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={openPopover}
        className="flex items-center gap-2 hover:bg-white/10 px-2 py-1 rounded-lg transition-all duration-200 cursor-pointer"
      >
        <span className="text-xs font-semibold text-white/80">{formatDate(currentDate)}</span>
        <svg width="8" height="8" viewBox="0 0 10 10" fill="none" className="text-white/40">
          <path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 z-50 bg-[#1c1c1e] border-2 border-red-500/70 rounded-lg shadow-2xl p-3 w-64 animate-bubble origin-top-left">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={prevMonth}
              className="w-7 h-7 rounded hover:bg-white/10 flex items-center justify-center transition-colors"
            >
              <FaChevronLeft size={10} />
            </button>
            <span className="text-xs font-semibold text-white/80">
              {year}年{month + 1}月
            </span>
            <button
              onClick={nextMonth}
              className="w-7 h-7 rounded hover:bg-white/10 flex items-center justify-center transition-colors"
            >
              <FaChevronRight size={10} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-0.5 text-center mb-1">
            {['日', '一', '二', '三', '四', '五', '六'].map((d) => (
              <div key={d} className="text-[9px] text-white/40 font-medium py-1">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5 text-center">
            {Array(firstDay).fill(null).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array(daysInMonth).fill(null).map((_, i) => {
              const day = i + 1;
              return (
                <button
                  key={day}
                  onClick={() => {
                    const ds = `${viewMonth}-${String(day).padStart(2, '0')}`;
                    onDateChange(ds);
                    setIsOpen(false);
                  }}
                  className={`w-8 h-8 rounded-lg text-xs relative transition-all duration-200
                    ${isSelected(day) ? 'bg-red-500 text-white font-semibold' : ''}
                    ${!isSelected(day) && isToday(day) ? 'border border-red-500/50' : ''}
                    ${!isSelected(day) && !isToday(day) ? 'hover:bg-white/10' : ''}
                  `}
                >
                  {day}
                  {hasData(day) && (
                    <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-red-400" />
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
