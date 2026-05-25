import { backupApi } from './backupApi';
import {
  clearStore,
  deleteRecord,
  getAllRecords,
  getRecord,
  getSetting,
  putRecord,
  setSetting,
} from '../data/localDb';
import { today } from '../utils/date';

export const AUTO_BACKUP_DEFAULTS = {
  enabled: true,
  intervalMinutes: 60,
  fileBackupEnabled: false,
};

export const AUTO_BACKUP_INTERVAL_OPTIONS = [
  { value: 30, label: '30 分钟' },
  { value: 60, label: '1 小时' },
  { value: 360, label: '6 小时' },
];

export const AUTO_BACKUP_FILE_INTERVAL_OPTIONS = [
  { value: 30, label: '30 分钟' },
  { value: 60, label: '1 小时' },
  { value: 360, label: '6 小时' },
];

const SNAPSHOT_STORE = 'backup_snapshots';
const MINUTE_MS = 60 * 1000;

function nowIso() {
  return new Date().toISOString();
}

function weekKey(date) {
  const firstDay = new Date(date.getFullYear(), 0, 1);
  const dayMs = 24 * 60 * 60 * 1000;
  return `${date.getFullYear()}-${Math.ceil(((date - firstDay) / dayMs + firstDay.getDay() + 1) / 7)}`;
}

function snapshotSize(backup) {
  try {
    return new Blob([JSON.stringify(backup)]).size;
  } catch {
    return 0;
  }
}

function shouldRun(lastRunAt, intervalMinutes) {
  if (!lastRunAt) return true;
  const lastTime = new Date(lastRunAt).getTime();
  if (Number.isNaN(lastTime)) return true;
  return Date.now() - lastTime >= intervalMinutes * MINUTE_MS;
}

function backupFileName(createdAt = new Date()) {
  const safeTime = createdAt.toISOString().replaceAll(':', '-').replaceAll('.', '-');
  return `desktop-widgets-auto-backup-${safeTime}.json`;
}

async function verifyPermission(handle, mode = 'readwrite') {
  if (!handle?.queryPermission || !handle?.requestPermission) return false;
  const options = { mode };
  if ((await handle.queryPermission(options)) === 'granted') return true;
  return (await handle.requestPermission(options)) === 'granted';
}

async function writeBackupToDirectory(directoryHandle, backup, createdAt = new Date()) {
  const permitted = await verifyPermission(directoryHandle, 'readwrite');
  if (!permitted) {
    throw new Error('浏览器还没有备份文件夹写入权限，请在设置里重新选择文件夹');
  }

  const fileHandle = await directoryHandle.getFileHandle(backupFileName(createdAt), { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(JSON.stringify(backup, null, 2));
  await writable.close();
}

export function supportsDirectoryBackup() {
  return typeof window !== 'undefined' && typeof window.showDirectoryPicker === 'function';
}

export async function getAutoBackupSettings() {
  const [
    enabled,
    intervalMinutes,
    fileBackupEnabled,
    fileBackupIntervalMinutes,
    directoryHandle,
    lastSnapshotAt,
    lastFileBackupAt,
    lastError,
    directoryName,
  ] = await Promise.all([
    getSetting('autoBackupEnabled', AUTO_BACKUP_DEFAULTS.enabled),
    getSetting('autoBackupIntervalMinutes', AUTO_BACKUP_DEFAULTS.intervalMinutes),
    getSetting('autoBackupFileEnabled', AUTO_BACKUP_DEFAULTS.fileBackupEnabled),
    getSetting('autoBackupFileIntervalMinutes', AUTO_BACKUP_DEFAULTS.intervalMinutes),
    getSetting('autoBackupDirectoryHandle'),
    getSetting('autoBackupLastSnapshotAt'),
    getSetting('autoBackupLastFileAt'),
    getSetting('autoBackupLastError'),
    getSetting('autoBackupDirectoryName', ''),
  ]);

  return {
    enabled,
    intervalMinutes,
    fileBackupEnabled,
    fileBackupIntervalMinutes,
    hasDirectoryHandle: Boolean(directoryHandle),
    directoryName: directoryHandle?.name || directoryName || '',
    lastSnapshotAt,
    lastFileBackupAt,
    lastError,
  };
}

export async function updateAutoBackupSetting(key, value) {
  await setSetting(key, value);
  return getAutoBackupSettings();
}

export async function chooseBackupDirectory() {
  if (!supportsDirectoryBackup()) {
    throw new Error('当前浏览器不支持选择电脑文件夹');
  }

  const handle = await window.showDirectoryPicker({
    id: 'desktop-widgets-backups',
    mode: 'readwrite',
  });
  await verifyPermission(handle, 'readwrite');
  await setSetting('autoBackupDirectoryHandle', handle);
  await setSetting('autoBackupDirectoryName', handle.name);
  await setSetting('autoBackupFileEnabled', true);
  await setSetting('autoBackupLastError', '');
  return getAutoBackupSettings();
}

export async function createBackupSnapshot(reason = 'auto') {
  const createdAt = nowIso();
  const backup = await backupApi.export();
  const row = {
    id: createdAt,
    created_at: createdAt,
    reason,
    size: snapshotSize(backup),
    backup,
  };

  await putRecord(SNAPSHOT_STORE, row);
  await setSetting('autoBackupLastSnapshotAt', createdAt);
  await setSetting('autoBackupLastError', '');
  await pruneBackupSnapshots();
  return row;
}

export async function createFileBackup(backup = null) {
  const directoryHandle = await getSetting('autoBackupDirectoryHandle');
  if (!directoryHandle) {
    throw new Error('还没有选择电脑备份文件夹');
  }

  const createdAt = new Date();
  const payload = backup || await backupApi.export();
  await writeBackupToDirectory(directoryHandle, payload, createdAt);
  await setSetting('autoBackupLastFileAt', createdAt.toISOString());
  await setSetting('autoBackupLastError', '');
  return createdAt.toISOString();
}

export async function runAutoBackupIfDue({ force = false } = {}) {
  const settings = await getAutoBackupSettings();
  if (!settings.enabled && !force) return { skipped: true, reason: 'disabled', settings };
  if (!force && !shouldRun(settings.lastSnapshotAt, settings.intervalMinutes)) {
    if (settings.hasDirectoryHandle && settings.fileBackupEnabled
      && shouldRun(settings.lastFileBackupAt, settings.fileBackupIntervalMinutes)) {
      try {
        await createFileBackup();
        return {
          skipped: false, snapshot: null, fileBackedUp: true,
          settings: await getAutoBackupSettings(),
        };
      } catch (error) {
        await setSetting('autoBackupLastError', error.message);
        return { skipped: true, reason: 'file-backup-error', settings: await getAutoBackupSettings() };
      }
    }
    return { skipped: true, reason: 'not-due', settings };
  }

  try {
    const snapshot = await createBackupSnapshot(force ? 'manual' : 'auto');
    let fileBackedUp = false;

    if (settings.hasDirectoryHandle && (settings.fileBackupEnabled || force)) {
      if (force || shouldRun(settings.lastFileBackupAt, settings.fileBackupIntervalMinutes)) {
        try {
          await createFileBackup(snapshot.backup);
          fileBackedUp = true;
        } catch (error) {
          await setSetting('autoBackupLastError', error.message);
        }
      }
    }

    return { skipped: false, snapshot, fileBackedUp, settings: await getAutoBackupSettings() };
  } catch (error) {
    await setSetting('autoBackupLastError', error.message);
    throw error;
  }
}

export async function listBackupSnapshots() {
  const rows = await getAllRecords(SNAPSHOT_STORE);
  return rows
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .map(({ backup, ...row }) => {
      void backup;
      return row;
    });
}

export async function restoreBackupSnapshot(id) {
  const row = await getRecord(SNAPSHOT_STORE, id);
  if (!row?.backup) throw new Error('找不到这份自动快照');
  return backupApi.import(row.backup);
}

export async function pruneBackupSnapshots() {
  const rows = await getAllRecords(SNAPSHOT_STORE);
  if (rows.length <= 32) return;

  const sorted = rows.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const keep = new Set();
  const daily = new Set();
  const weekly = new Set();

  sorted.forEach((row, index) => {
    const date = new Date(row.created_at);
    if (index < 24) {
      keep.add(row.id);
      return;
    }

    const day = row.created_at.slice(0, 10);
    if (daily.size < 7 && !daily.has(day)) {
      daily.add(day);
      keep.add(row.id);
      return;
    }

    const week = weekKey(date);
    if (weekly.size < 4 && !weekly.has(week)) {
      weekly.add(week);
      keep.add(row.id);
    }
  });

  await Promise.all(
    sorted
      .filter((row) => !keep.has(row.id))
      .map((row) => deleteRecord(SNAPSHOT_STORE, row.id)),
  );
}

export async function clearAllSnapshots() {
  await clearStore(SNAPSHOT_STORE);
  await setSetting('autoBackupLastSnapshotAt', '');
  await setSetting('autoBackupLastFileAt', '');
}

export function formatBackupTime(value) {
  if (!value) return '从未';
  try {
    return new Date(value).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return value;
  }
}

export function backupTodayFileName() {
  return `desktop-widgets-backup-${today()}.json`;
}
