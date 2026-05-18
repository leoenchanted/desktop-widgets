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
    <div className="flex h-full w-full flex-row items-center justify-between p-5">
      <div className="flex items-baseline">
        <div className="display-type text-5xl font-medium leading-none md:text-6xl">
          {pad(time.getHours())}:{pad(time.getMinutes())}
        </div>
        <div className="ml-2 w-8 text-2xl font-light text-white/50">
          {pad(time.getSeconds())}
        </div>
      </div>
      <div className="text-right">
        <div className="text-sm font-semibold text-white/70">现在</div>
        <div className="mt-1 text-sm text-white/48">{formatDate(localDateKey(time))}</div>
      </div>
    </div>
  );
};

export default ClockWidget;
