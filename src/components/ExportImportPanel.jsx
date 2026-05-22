import React, { useRef, useState } from 'react';
import { FaDatabase, FaDownload, FaTimes, FaUpload } from 'react-icons/fa';
import { exportBackup, importBackup } from '../utils/backup';
import IconButton from './ui/IconButton';
import AutoBackupSettings from './AutoBackupSettings';

const ExportImportPanel = ({ onClose }) => {
  const [status, setStatus] = useState(null);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef(null);

  const handleExport = async () => {
    setStatus('exporting');
    try {
      await exportBackup();
      setStatus('exported');
      setTimeout(() => setStatus(null), 2200);
    } catch (error) {
      console.error('Failed to export backup', error);
      setStatus('error');
    }
  };

  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setImporting(true);
    setStatus('importing');
    try {
      const result = await importBackup(file);
      setStatus(
        `导入成功：${result.counts.todos} 个任务，${result.counts.markdown} 篇草稿，${result.counts.assets} 个本地资源`,
      );
      setTimeout(() => window.location.reload(), 1200);
    } catch (error) {
      setStatus(`导入失败：${error.message}`);
    } finally {
      setImporting(false);
      event.target.value = '';
    }
  };

  const isSuccess = status?.startsWith('导入成功') || status === 'exported';
  const isError = status === 'error' || status?.startsWith('导入失败');
  const statusClass = isSuccess
    ? 'bg-[#7ee7ad]/12 text-[#bdf6d3] border-[#7ee7ad]/20'
    : isError
      ? 'bg-[#ff8d8d]/12 text-[#ffd0d0] border-[#ff8d8d]/22'
      : 'bg-white/7 text-white/45 border-white/10';

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/42 backdrop-blur-sm" />
      <div
        className="glass-panel relative max-h-[min(88vh,820px)] w-full max-w-2xl overflow-hidden p-0 shadow-2xl animate-bubble"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-5">
          <div>
            <div className="panel-kicker flex items-center gap-2">
              <FaDatabase size={11} />
              Local Backup
            </div>
            <h3 className="mt-2 text-lg font-semibold text-white">本地数据备份</h3>
            <p className="mt-1 text-xs leading-5 text-white/42">
              导出完整 JSON：设置、组件布局、Todo、草稿、回顾、番茄钟和本地图片资源。
            </p>
          </div>
          <IconButton icon={FaTimes} onClick={onClose} title="关闭" className="h-9 w-9" />
        </div>

        <div className="max-h-[calc(min(88vh,820px)-112px)] overflow-y-auto glass-scrollbar">
          <div className="grid gap-3 p-5">
            <button
              onClick={handleExport}
              disabled={status === 'exporting' || importing}
              className="glass-control flex items-center gap-3 px-4 py-4 text-left disabled:opacity-40"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#80bfff]/16 text-[#b7dcff]">
                <FaDownload size={15} />
              </span>
              <span>
                <span className="block text-sm font-semibold text-white/84">导出完整 JSON</span>
                <span className="mt-0.5 block text-xs text-white/34">最稳的跨域名、换电脑、清浏览器前兜底备份</span>
              </span>
            </button>

            <button
              onClick={() => fileRef.current?.click()}
              disabled={importing}
              className="glass-control flex items-center gap-3 px-4 py-4 text-left disabled:opacity-40"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#7ee7ad]/14 text-[#bdf6d3]">
                <FaUpload size={15} />
              </span>
              <span>
                <span className="block text-sm font-semibold text-white/84">导入 JSON</span>
                <span className="mt-0.5 block text-xs text-white/34">会覆盖当前浏览器里的本地数据，请确认文件来源</span>
              </span>
            </button>
            <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={handleImport} />
          </div>

          {status && (
            <div className={`mx-5 mb-5 rounded-2xl border px-3 py-2 text-center text-xs font-medium ${statusClass}`}>
              {status === 'exporting' && '正在导出...'}
              {status === 'importing' && '正在导入...'}
              {status === 'error' && '操作失败，请重试'}
              {status === 'exported' && '导出成功'}
              {status.startsWith('导入') && status}
            </div>
          )}

          <div className="soft-divider" />
          <div className="p-5">
            <AutoBackupSettings />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportImportPanel;
