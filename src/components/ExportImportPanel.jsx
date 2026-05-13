import React, { useState, useRef } from 'react';
import { FaDownload, FaUpload, FaTimes } from 'react-icons/fa';
import { exportBackup, importBackup } from '../utils/backup';

const ExportImportPanel = ({ onClose }) => {
  const [status, setStatus] = useState(null);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef();

  const handleExport = async () => {
    setStatus('exporting');
    try {
      await exportBackup();
      setStatus('exported');
      setTimeout(() => setStatus(null), 2000);
    } catch {
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
      setStatus(`imported: ${result.counts.todos} todos, ${result.counts.markdown} markdown, ${result.counts.pomodoro} pomodoro`);
      setTimeout(() => { setStatus(null); onClose?.(); }, 3000);
    } catch (err) {
      setStatus(`error: ${err.message}`);
    }
    setImporting(false);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-[#1c1c1e]/95 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-2xl p-6 w-80 animate-bubble"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white">数据备份</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <FaTimes size={14} />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={handleExport}
            disabled={status === 'exporting' || importing}
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 disabled:opacity-40 transition-all border border-white/10"
          >
            <FaDownload className="text-[#0A84FF]" />
            <span className="text-sm text-white/80">导出备份 JSON</span>
          </button>

          <button
            onClick={() => fileRef.current?.click()}
            disabled={importing}
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 disabled:opacity-40 transition-all border border-white/10"
          >
            <FaUpload className="text-[#30d158]" />
            <span className="text-sm text-white/80">导入备份 JSON</span>
          </button>
          <input ref={fileRef} type="file" accept=".json" hidden onChange={handleImport} />
        </div>

        {status && (
          <div className={`mt-3 text-xs p-2 rounded-lg text-center ${
            status === 'exporting' || status === 'importing' ? 'text-white/40 bg-white/5' :
            status === 'error' ? 'text-red-400 bg-red-500/10' :
            status.startsWith('imported') ? 'text-[#30d158] bg-[#30d158]/10' :
            'text-[#30d158] bg-[#30d158]/10'
          }`}>
            {status === 'exporting' && '导出中...'}
            {status === 'importing' && '导入中...'}
            {status === 'error' && '操作失败，请重试'}
            {status === 'exported' && '导出成功！'}
            {status.startsWith('imported') && `导入成功！(${status.replace('imported: ', '')})`}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExportImportPanel;
