import { backupApi } from '../api/backupApi';

export async function exportBackup() {
  const data = await backupApi.export();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `widgets-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  return data;
}

export async function importBackup(file) {
  const text = await file.text();
  const data = JSON.parse(text);
  if (!data.version || !data.data) {
    throw new Error('Invalid backup file format');
  }
  const result = await backupApi.import(data.data);
  return result;
}
