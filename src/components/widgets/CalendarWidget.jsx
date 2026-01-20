import React from "react";
import { FaCalendarAlt } from "react-icons/fa";

const CalendarWidget = () => {
  const now = new Date();
  const day = now.getDate();

  // 生成当月数据 (简化版)
  const daysInMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
  ).getDate();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).getDay();

  return (
    <div className="flex flex-col h-full w-full p-6">
      <div className="text-white/60 text-xs font-bold uppercase tracking-widest mb-3 flex items-center justify-between">
        <span className="flex items-center gap-2">
          <FaCalendarAlt /> 本月
        </span>
        <span>{now.getMonth() + 1}月</span>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs flex-1 content-start">
        {["S", "M", "T", "W", "T", "F", "S"].map((h) => (
          <div key={h} className="font-bold opacity-50 mb-1">
            {h}
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
            const d = i + 1;
            const isToday = d === day;
            return (
              <div
                key={d}
                className={`h-8 w-8 flex items-center justify-center rounded-full mx-auto ${isToday ? "bg-white text-black font-bold" : "hover:bg-white/10"}`}
              >
                {d}
              </div>
            );
          })}
      </div>
    </div>
  );
};
export default CalendarWidget;
