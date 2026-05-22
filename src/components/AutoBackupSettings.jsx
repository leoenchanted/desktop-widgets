import React, { useEffect, useMemo, useState } from 'react';
import {
  FaArchive,
  FaCheck,
  FaClock,
  FaExclamationCircle,
  FaFolderOpen,
  FaHistory,
  FaPlay,
  FaRedo,
  FaSave,
} from 'react-icons/fa';
import {
  AUTO_BACKUP_INTERVAL_OPTIONS,
  chooseBackupDirectory,
  createFileBackup,
  formatBackupTime,
  getAutoBackupSettings,
  listBackupSnapshots,
  restoreBackupSnapshot,
  runAutoBackupIfDue,
  supportsDirectoryBackup,
  updateAutoBackupSetting,
} from '../api/autoBackupApi';

function formatSize(size = 0) {
  if (!size) return '未知大小';
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

const Toggle = ({ checked, onChange, disabled }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    disabled={disabled}
    className={`relative h-7 w-12 rounded-full border transition disabled:opacity-45 ${
      checked
        ? 'border-[#9ae9bd]/35 bg-[#9ae9bd]/24'
        : 'border-white/12 bg-white/8'
    }`}
    aria-pressed={checked}
  >
    <span
      className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${
        checked ? 'left-6' : 'left-1'
      }`}
    />
  </button>
);

const SettingRow = ({ icon: Icon, title, description, children }) => (
  <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-4">
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/8 text-[#cfe7ff]">
        <Icon size={13} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-white/86">{title}</div>
            <p className="mt-1 text-xs leading-5 text-white/42">{description}</p>
          </div>
          <div className="flex flex-shrink-0 items-center gap-2">{children}</div>
        </div>
      </div>
    </div>
  </div>
);

const AutoBackupSettings = () => {
  const [settings, setSettings] = useState(null);
  const [snapshots, setSnapshots] = useState([]);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const directorySupported = useMemo(() => supportsDirectoryBackup(), []);

  const refresh = async () => {
    const [nextSettings, nextSnapshots] = await Promise.all([
      getAutoBackupSettings(),
      listBackupSnapshots(),
    ]);
    setSettings(nextSettings);
    setSnapshots(nextSnapshots);
  };

  useEffect(() => {
    refresh().catch((error) => {
      console.error('Failed to load auto backup settings', error);
      setStatus('自动备份设置读取失败');
    });
  }, []);

  const updateSetting = async (key, value) => {
    setBusy(true);
    setStatus('');
    try {
      const nextSettings = await updateAutoBackupSetting(key, value);
      setSettings(nextSettings);
    } catch (error) {
      setStatus(error.message);
    } finally {
      setBusy(false);
    }
  };

  const handleChooseDirectory = async () => {
    setBusy(true);
    setStatus('');
    try {
      const nextSettings = await chooseBackupDirectory();
      setSettings(nextSettings);
      setStatus('电脑备份文件夹已授权。之后到达自动备份时间时会写入 JSON 文件。');
    } catch (error) {
      setStatus(error.message || '选择文件夹失败');
    } finally {
      setBusy(false);
    }
  };

  const handleManualSnapshot = async () => {
    setBusy(true);
    setStatus('正在生成自动快照...');
    try {
      await runAutoBackupIfDue({ force: true });
      await refresh();
      setStatus('已生成一份新的自动快照。');
    } catch (error) {
      setStatus(error.message || '生成快照失败');
    } finally {
      setBusy(false);
    }
  };

  const handleManualFileBackup = async () => {
    setBusy(true);
    setStatus('正在写入电脑备份文件夹...');
    try {
      await createFileBackup();
      await refresh();
      setStatus('已写入一份 JSON 到电脑备份文件夹。');
    } catch (error) {
      setStatus(error.message || '写入电脑文件夹失败');
    } finally {
      setBusy(false);
    }
  };

  const handleRestore = async (snapshot) => {
    const ok = window.confirm(`确定恢复到 ${formatBackupTime(snapshot.created_at)} 的自动快照吗？当前浏览器数据会被覆盖。`);
    if (!ok) return;

    setBusy(true);
    setStatus('正在恢复快照...');
    try {
      await restoreBackupSnapshot(snapshot.id);
      setStatus('恢复成功，页面即将刷新。');
      setTimeout(() => window.location.reload(), 900);
    } catch (error) {
      setStatus(error.message || '恢复快照失败');
      setBusy(false);
    }
  };

  if (!settings) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-4 text-sm text-white/45">
        正在读取自动备份设置...
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="panel-kicker flex items-center gap-2">
            <FaArchive size={11} />
            Auto Backup
          </div>
          <h4 className="mt-1 text-base font-semibold text-white/88">数据安全设置</h4>
        </div>
        <button
          type="button"
          onClick={refresh}
          disabled={busy}
          className="glass-control flex h-9 items-center gap-2 px-3 text-xs font-semibold text-white/55 hover:text-white disabled:opacity-45"
        >
          <FaRedo size={11} />
          刷新
        </button>
      </div>

      <SettingRow
        icon={FaClock}
        title="自动快照"
        description="默认开启。每隔一段时间把完整数据保存到当前浏览器 IndexedDB 的内部快照库，可用于误删后恢复。"
      >
        <Toggle
          checked={settings.enabled}
          disabled={busy}
          onChange={(value) => updateSetting('autoBackupEnabled', value)}
        />
      </SettingRow>

      <SettingRow
        icon={FaHistory}
        title="快照频率"
        description="推荐 1 小时。频率越高越安全，但会占用更多浏览器本地空间；系统会自动清理旧快照。"
      >
        <select
          value={settings.intervalMinutes}
          disabled={busy || !settings.enabled}
          onChange={(event) => updateSetting('autoBackupIntervalMinutes', Number(event.target.value))}
          className="glass-control h-9 bg-transparent px-3 text-xs font-semibold text-white/72 outline-none disabled:opacity-45"
        >
          {AUTO_BACKUP_INTERVAL_OPTIONS.map((option) => (
            <option key={option.value} value={option.value} className="bg-[#10151d] text-white">
              {option.label}
            </option>
          ))}
        </select>
      </SettingRow>

      <SettingRow
        icon={FaFolderOpen}
        title="电脑文件夹备份"
        description={
          directorySupported
            ? '仅 Chrome / Edge 等支持 File System Access API 的桌面浏览器可用。选择文件夹后，会在自动备份时额外写入 JSON 文件；手机、Safari、Firefox 通常不支持。'
            : '当前设备或浏览器不支持网页选择电脑文件夹。请继续使用手动导出 JSON 和浏览器内部自动快照。'
        }
      >
        <Toggle
          checked={settings.fileBackupEnabled && settings.hasDirectoryHandle}
          disabled={busy || !directorySupported || !settings.hasDirectoryHandle}
          onChange={(value) => updateSetting('autoBackupFileEnabled', value)}
        />
      </SettingRow>

      <div className="grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={handleChooseDirectory}
          disabled={busy || !directorySupported}
          className="glass-control flex h-11 items-center justify-center gap-2 text-sm font-semibold text-white/70 hover:text-white disabled:opacity-40"
        >
          <FaFolderOpen size={13} />
          选择备份文件夹
        </button>
        <button
          type="button"
          onClick={handleManualFileBackup}
          disabled={busy || !settings.hasDirectoryHandle}
          className="glass-control flex h-11 items-center justify-center gap-2 text-sm font-semibold text-white/70 hover:text-white disabled:opacity-40"
        >
          <FaSave size={13} />
          立即写入文件夹
        </button>
      </div>

      <div className="grid gap-2 rounded-2xl border border-white/10 bg-white/[0.045] p-4 text-xs leading-5 text-white/46 sm:grid-cols-2">
        <div>
          <span className="text-white/66">上次内部快照：</span>
          {formatBackupTime(settings.lastSnapshotAt)}
        </div>
        <div>
          <span className="text-white/66">上次文件夹备份：</span>
          {formatBackupTime(settings.lastFileBackupAt)}
        </div>
        {settings.lastError && (
          <div className="flex gap-2 text-[#ffd0d0] sm:col-span-2">
            <FaExclamationCircle className="mt-1 flex-shrink-0" size={11} />
            {settings.lastError}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-semibold text-white/86">自动快照恢复</div>
            <p className="mt-1 text-xs leading-5 text-white/42">
              这里列出最近的内部快照。恢复会覆盖当前浏览器数据，适合误删草稿、Todo 或布局后回滚。
            </p>
          </div>
          <button
            type="button"
            onClick={handleManualSnapshot}
            disabled={busy}
            className="glass-control flex h-10 flex-shrink-0 items-center justify-center gap-2 px-3 text-xs font-semibold text-white/62 hover:text-white disabled:opacity-45"
          >
            <FaPlay size={10} />
            立即快照
          </button>
        </div>

        <div className="mt-3 grid max-h-48 gap-2 overflow-y-auto pr-1 glass-scrollbar">
          {snapshots.length === 0 ? (
            <div className="rounded-xl border border-white/8 bg-black/10 px-3 py-3 text-xs text-white/34">
              暂时还没有自动快照。开启后会自动生成，也可以点“立即快照”。
            </div>
          ) : (
            snapshots.slice(0, 12).map((snapshot) => (
              <div
                key={snapshot.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-white/8 bg-black/10 px-3 py-2"
              >
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-white/74">
                    {formatBackupTime(snapshot.created_at)}
                    {snapshot.reason === 'manual' && <span className="ml-2 text-[#bdf6d3]">手动</span>}
                  </div>
                  <div className="mt-0.5 text-[11px] text-white/34">{formatSize(snapshot.size)}</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRestore(snapshot)}
                  disabled={busy}
                  className="glass-control flex h-8 flex-shrink-0 items-center gap-1.5 px-2 text-[11px] font-semibold text-white/55 hover:text-white disabled:opacity-45"
                >
                  <FaCheck size={10} />
                  恢复
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {status && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.055] px-4 py-3 text-center text-xs leading-5 text-white/62">
          {status}
        </div>
      )}
    </div>
  );
};

export default AutoBackupSettings;
