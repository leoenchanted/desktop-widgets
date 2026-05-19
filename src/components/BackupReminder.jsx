import React, { useEffect, useState } from 'react';
import { FaDownload, FaRegClock, FaTimes } from 'react-icons/fa';
import { getSetting, setSetting } from '../data/localDb';
import { exportBackup } from '../utils/backup';
import { today } from '../utils/date';

const DAY_MS = 24 * 60 * 60 * 1000;
const REMINDER_DAYS = 7;

function isOverdue(lastBackupAt) {
  if (!lastBackupAt) return true;
  return Date.now() - new Date(lastBackupAt).getTime() >= REMINDER_DAYS * DAY_MS;
}

const BackupReminder = ({ onOpenBackup }) => {
  const [visible, setVisible] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const [lastBackupAt, snoozedAt] = await Promise.all([
        getSetting('lastBackupAt'),
        getSetting('backupReminderSnoozedAt'),
      ]);
      if (!cancelled && snoozedAt !== today()) {
        setVisible(isOverdue(lastBackupAt));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!visible) return null;

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportBackup();
      setVisible(false);
    } finally {
      setExporting(false);
    }
  };

  const handleSnooze = async () => {
    await setSetting('backupReminderSnoozedAt', today());
    setVisible(false);
  };

  return (
    <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+6rem)] left-4 z-40 w-[min(92vw,360px)] animate-bubble md:bottom-6 md:left-6">
      <div className="glass-panel overflow-hidden p-4 shadow-2xl">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-[#9ae9bd]/20 bg-[#9ae9bd]/12 text-[#c8f7db]">
            <FaRegClock size={14} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-white/88">建议导出一次备份</div>
            <p className="mt-1 text-xs leading-5 text-white/46">
              本地数据只保存在当前浏览器里。建议每 7 天导出完整 JSON，换设备或清浏览器前也先备份。
            </p>
          </div>
          <button
            onClick={handleSnooze}
            className="glass-control flex h-8 w-8 flex-shrink-0 items-center justify-center text-white/42 hover:text-white"
            title="今天稍后提醒"
          >
            <FaTimes size={11} />
          </button>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="glass-control flex h-10 flex-1 items-center justify-center gap-2 text-sm font-semibold text-white/72 hover:text-white disabled:opacity-45"
          >
            <FaDownload size={12} />
            {exporting ? '导出中' : '导出 JSON'}
          </button>
          <button
            onClick={onOpenBackup}
            className="glass-control h-10 px-3 text-xs font-semibold text-white/52 hover:text-white"
          >
            更多
          </button>
        </div>
      </div>
    </div>
  );
};

export default BackupReminder;
