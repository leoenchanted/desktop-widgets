import React, { useState, useEffect } from "react";

const ClockWidget = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const pad = (n) => String(n).padStart(2, "0");
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  return (
    // 使用统一的玻璃卡片类名逻辑 (在 SortableItem 里包裹了容器，这里只需要负责内容)
    // 但为了 1:1 还原内部 padding 等，我们在这里写内容样式
    <div className="flex flex-row items-center justify-between h-full w-full p-5">
      <div className="flex items-baseline">
        <div className="text-7xl font-extralight tracking-tighter leading-none font-[SF Pro Display]">
          {pad(time.getHours())}:{pad(time.getMinutes())}
        </div>
        <div className="text-2xl font-light opacity-70 ml-2 w-8">
          {pad(time.getSeconds())}
        </div>
      </div>
      <div className="text-right">
        <div className="text-2xl font-semibold">{days[time.getDay()]}</div>
        <div className="text-base opacity-80 mt-1">
          {months[time.getMonth()]} {time.getDate()}, {time.getFullYear()}
        </div>
      </div>
    </div>
  );
};
export default ClockWidget;
