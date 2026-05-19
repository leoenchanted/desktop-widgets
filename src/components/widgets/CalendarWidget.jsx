import React from 'react';
import { FaCalendarAlt } from 'react-icons/fa';

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

const CalendarWidget = () => {
  const now = new Date();
  const day = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).getDay();

  return (
    <div className="widget-content calendar-widget flex h-full w-full min-h-0 flex-col p-4">
      <div className="mb-3 flex items-center justify-between text-xs font-bold uppercase tracking-[0.14em] text-white/54">
        <span className="flex items-center gap-2">
          <FaCalendarAlt size={12} />
          月历
        </span>
        <span>{now.getMonth() + 1} 月</span>
      </div>

      <div className="calendar-grid grid min-h-0 flex-1 grid-cols-7 content-start gap-1 text-center text-xs">
        {WEEKDAYS.map((weekday) => (
          <div key={weekday} className="mb-1 font-semibold text-white/36">
            {weekday}
          </div>
        ))}

        {Array(firstDay)
          .fill(null)
          .map((_, i) => (
            <div key={`empty-${i}`} />
          ))}

        {Array(daysInMonth)
          .fill(null)
          .map((_, i) => {
            const date = i + 1;
            const isCurrentDay = date === day;
            return (
              <div
                key={date}
                className={`calendar-day mx-auto flex items-center justify-center rounded-full transition-colors ${
                  isCurrentDay
                    ? 'bg-white text-black font-bold'
                    : 'text-white/64 hover:bg-white/10'
                }`}
              >
                {date}
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default CalendarWidget;
