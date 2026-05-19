import { backupApi } from '../api/backupApi';
import { setSetting } from '../data/localDb';
import { today } from './date';

const BACKUP_KEY = 'lastBackupAt';

export async function exportBackup() {
  const exportedAt = new Date().toISOString();
  await setSetting(BACKUP_KEY, exportedAt);
  const backup = await backupApi.export();
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `desktop-widgets-backup-${today()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  return backup;
}

export async function importBackup(file) {
  const text = await file.text();
  const backup = JSON.parse(text);
  if (!backup.version && !backup.data) {
    throw new Error('不是有效的桌面工作台备份文件');
  }
  return backupApi.import(backup);
}
