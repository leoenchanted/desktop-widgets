import { useEffect, useState } from 'react';
import { millisecondsUntilNextDay, today } from '../utils/date';

export function useTodayKey() {
  const [dateKey, setDateKey] = useState(() => today());

  useEffect(() => {
    let timeoutId;

    const syncDate = () => {
      const nextDate = today();
      setDateKey((currentDate) => (currentDate === nextDate ? currentDate : nextDate));
    };

    const scheduleNextTick = () => {
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        syncDate();
        scheduleNextTick();
      }, millisecondsUntilNextDay());
    };

    const handleResume = () => {
      syncDate();
      scheduleNextTick();
    };

    scheduleNextTick();
    window.addEventListener('focus', handleResume);
    document.addEventListener('visibilitychange', handleResume);

    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener('focus', handleResume);
      document.removeEventListener('visibilitychange', handleResume);
    };
  }, []);

  return dateKey;
}
