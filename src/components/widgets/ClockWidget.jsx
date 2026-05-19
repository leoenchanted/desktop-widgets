import React, { useEffect, useState } from 'react';
import { formatDate, localDateKey } from '../../utils/date';

const pad = (n) => String(n).padStart(2, '0');

const ClockWidget = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="widget-content clock-widget flex h-full w-full flex-row items-center justify-between gap-3 p-4">
      <div className="flex min-w-0 items-baseline">
        <div className="display-type clock-time truncate font-medium leading-none">
          {pad(time.getHours())}:{pad(time.getMinutes())}
        </div>
        <div className="clock-seconds ml-2 flex-shrink-0 font-light text-white/50">
          {pad(time.getSeconds())}
        </div>
      </div>
      <div className="clock-meta min-w-[72px] flex-shrink-0 text-right">
        <div className="text-sm font-semibold text-white/70">现在</div>
        <div className="mt-1 text-xs text-white/48">{formatDate(localDateKey(time))}</div>
      </div>
    </div>
  );
};

export default ClockWidget;
