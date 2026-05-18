import React, { useRef, useState } from 'react';
import { FaDownload, FaTimes, FaUpload } from 'react-icons/fa';
import { exportBackup, importBackup } from '../utils/backup';
import IconButton from './ui/IconButton';

const ExportImportPanel = ({ onClose }) => {
  const [status, setStatus] = useState(null);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef(null);

  const handleExport = async () => {
    setStatus('exporting');
    try {
      await exportBackup();
      setStatus('exported');
      setTimeout(() => setStatus(null), 2000);
    } catch (error) {
      console.error('Failed to export backup', error);
      setStatus('error');
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImporting(true);
    setStatus('importing');
    try {
      const result = await importBackup(file);
      setStatus(`导入成功：${result.counts.todos} 个任务，${result.counts.markdown} 篇记录，${result.counts.pomodoro} 次番茄钟`);
      setTimeout(() => {
        setStatus(null);
        onClose?.();
      }, 3000);
    } catch (error) {
      setStatus(`导入失败：${error.message}`);
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  const statusClass = status?.startsWith('导入成功') || status === 'exported'
    ? 'bg-[#7ee7ad]/12 text-[#bdf6d3] border-[#7ee7ad]/20'
    : status === 'error' || status?.startsWith('导入失败')
      ? 'bg-[#ff8d8d]/12 text-[#ffd0d0] border-[#ff8d8d]/22'
      : 'bg-white/7 text-white/45 border-white/10';

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/42 backdrop-blur-sm" />
      <div
        className="glass-panel relative w-full max-w-md p-5 shadow-2xl animate-bubble"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <div className="panel-kicker">Backup</div>
            <h3 className="mt-2 text-xl font-semibold text-white">数据备份</h3>
          </div>
          <IconButton icon={FaTimes} onClick={onClose} title="关闭" className="h-9 w-9" />
        </div>

        <div className="grid gap-3">
          <button
            onClick={handleExport}
            disabled={status === 'exporting' || importing}
            className="glass-control flex items-center gap-3 px-4 py-4 text-left disabled:opacity-40"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#80bfff]/16 text-[#b7dcff]">
              <FaDownload size={15} />
            </span>
            <span>
              <span className="block text-sm font-semibold text-white/84">导出 JSON</span>
              <span className="mt-0.5 block text-xs text-white/34">todos / markdown / review / pomodoro</span>
            </span>
          </button>

          <button
            onClick={() => fileRef.current?.click()}
            disabled={importing}
            className="glass-control flex items-center gap-3 px-4 py-4 text-left disabled:opacity-40"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#7ee7ad]/14 text-[#bdf6d3]">
              <FaUpload size={15} />
            </span>
            <span>
              <span className="block text-sm font-semibold text-white/84">导入 JSON</span>
              <span className="mt-0.5 block text-xs text-white/34">覆盖当前本地数据库内容</span>
            </span>
          </button>
          <input ref={fileRef} type="file" accept=".json" hidden onChange={handleImport} />
        </div>

        {status && (
          <div className={`mt-4 rounded-2xl border px-3 py-2 text-center text-xs font-medium ${statusClass}`}>
            {status === 'exporting' && '正在导出...'}
            {status === 'importing' && '正在导入...'}
            {status === 'error' && '操作失败，请重试'}
            {status === 'exported' && '导出成功'}
            {status.startsWith('导入') && status}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExportImportPanel;
