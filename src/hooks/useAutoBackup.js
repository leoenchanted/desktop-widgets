import { useEffect } from 'react';
import { runAutoBackupIfDue } from '../api/autoBackupApi';

const CHECK_INTERVAL_MS = 60 * 1000;

export function useAutoBackup(enabled = true) {
  useEffect(() => {
    if (!enabled) return undefined;

    let cancelled = false;

    const run = () => {
      runAutoBackupIfDue().catch((error) => {
        if (!cancelled) {
          console.error('Auto backup failed', error);
        }
      });
    };

    const startTimer = window.setTimeout(run, 3000);
    const interval = window.setInterval(run, CHECK_INTERVAL_MS);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') run();
    };

    window.addEventListener('focus', run);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      cancelled = true;
      window.clearTimeout(startTimer);
      window.clearInterval(interval);
      window.removeEventListener('focus', run);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [enabled]);
}
