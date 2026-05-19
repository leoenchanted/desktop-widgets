import { backupApi } from '../api/backupApi';
import { getAllRecords, getSetting, setSetting } from './localDb';

const MIGRATION_KEY = 'legacyBackendMigrated';
const PRODUCTIVE_STORES = [
  'todos',
  'markdown_entries',
  'daily_reviews',
  'pomodoro_sessions',
];

async function hasProductiveLocalData() {
  const rows = await Promise.all(PRODUCTIVE_STORES.map((store) => getAllRecords(store)));
  return rows.some((storeRows) => storeRows.length > 0);
}

function hasProductiveBackupData(data) {
  return PRODUCTIVE_STORES.some((store) => (data[store] || []).length > 0);
}

export async function migrateLegacyBackendIfNeeded() {
  if (await getSetting(MIGRATION_KEY, false)) return false;

  if (await hasProductiveLocalData()) {
    await setSetting(MIGRATION_KEY, true);
    return false;
  }

  try {
    const response = await fetch('/api/backup/export', { cache: 'no-store' });
    if (!response.ok) return false;

    const backup = await response.json();
    const data = backup.data || backup;
    if (!hasProductiveBackupData(data)) return false;

    await backupApi.import(backup);
    await setSetting(MIGRATION_KEY, true);
    return true;
  } catch {
    return false;
  }
}
