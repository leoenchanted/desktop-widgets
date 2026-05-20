import React, { useEffect, useRef, useState } from 'react';
import {
  FaDownload,
  FaExclamationTriangle,
  FaExternalLinkAlt,
  FaTimes,
} from 'react-icons/fa';
import { exportBackup } from '../utils/backup';

const TARGET_URL = 'https://desktop.leoenchanted.top';
const TARGET_HOST = 'desktop.leoenchanted.top';
const REOPEN_INTERVAL_MS = 30 * 60 * 1000;
const CHECK_INTERVAL_MS = 60 * 1000;

function shouldShowDomainWarning() {
  if (typeof window === 'undefined') return false;

  const { hostname, search } = window.location;
  if (search.includes('forceMigrationWarning=1')) return true;
  if (hostname === TARGET_HOST) return false;
  if (hostname === 'localhost' || hostname === '127.0.0.1') return false;

  return true;
}

const DomainMigrationWarning = () => {
  const [visible, setVisible] = useState(() => shouldShowDomainWarning());
  const [exporting, setExporting] = useState(false);
  const [status, setStatus] = useState('');
  const lastOpenedAtRef = useRef(Date.now());
  const visibleRef = useRef(visible);

  useEffect(() => {
    if (!shouldShowDomainWarning()) return undefined;

    const openIfOverdue = () => {
      if (
        !visibleRef.current
        && Date.now() - lastOpenedAtRef.current >= REOPEN_INTERVAL_MS
      ) {
        lastOpenedAtRef.current = Date.now();
        setStatus('');
        setVisible(true);
      }
    };

    const timer = window.setInterval(() => {
      openIfOverdue();
    }, CHECK_INTERVAL_MS);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') openIfOverdue();
    };

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  useEffect(() => {
    visibleRef.current = visible;
  }, [visible]);

  if (!visible) return null;

  const handleClose = () => {
    lastOpenedAtRef.current = Date.now();
    setVisible(false);
  };

  const handleExport = async () => {
    setExporting(true);
    setStatus('');
    try {
      await exportBackup();
      setStatus('JSON 备份已导出。请立刻打开新域名并导入这个备份文件。');
    } catch (error) {
      console.error('Failed to export migration backup', error);
      setStatus('导出失败，请先不要关闭当前页面，稍后再试一次。');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center px-4 py-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="domain-migration-title"
    >
      <div className="absolute inset-0 bg-[#030507]/72 backdrop-blur-md" />
      <div className="migration-warning-panel relative w-full max-w-[560px] overflow-hidden rounded-[22px] border border-[#ff6b6b]/35 bg-[#160607]/88 shadow-[0_32px_90px_rgba(0,0,0,0.58)]">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#ff4646] via-[#ffd166] to-[#ff4646]" />

        <div className="relative p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border border-[#ffb0b0]/24 bg-[#ff4646]/18 text-[#ffd0d0] shadow-[0_0_30px_rgba(255,70,70,0.28)]">
              <FaExclamationTriangle size={20} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-black uppercase tracking-[0.22em] text-[#ffd166]">
                Emergency Data Migration
              </div>
              <h2
                id="domain-migration-title"
                className="mt-2 text-xl font-semibold leading-tight text-white sm:text-2xl"
              >
                此域名即将失效，请立即导出 JSON 备份
              </h2>
              <p className="mt-3 text-sm leading-6 text-white/72">
                你的 Todo、日记草稿、组件布局、壁纸等数据都保存在当前域名对应的浏览器本地空间。
                域名失效后，新域名无法自动读取旧域名的 IndexedDB 数据。
              </p>
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="glass-control flex h-9 w-9 flex-shrink-0 items-center justify-center text-white/50 hover:text-white"
              title="关闭，30 分钟后再次提醒"
              aria-label="关闭，30 分钟后再次提醒"
            >
              <FaTimes size={12} />
            </button>
          </div>

          <div className="mt-5 rounded-2xl border border-[#ffd166]/20 bg-[#ffd166]/10 px-4 py-3">
            <div className="text-xs font-bold text-[#ffe29a]">必须现在处理</div>
            <div className="mt-1 text-sm leading-6 text-white/76">
              请先导出完整 JSON，再打开新域名：
              <a
                className="ml-1 break-all font-semibold text-[#b9dcff] underline decoration-[#b9dcff]/40 underline-offset-4"
                href={TARGET_URL}
                target="_blank"
                rel="noreferrer"
              >
                {TARGET_URL}
              </a>
            </div>
          </div>

          {status && (
            <div className="mt-4 rounded-2xl border border-white/12 bg-white/8 px-4 py-3 text-sm leading-5 text-white/76">
              {status}
            </div>
          )}

          <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
            <button
              type="button"
              onClick={handleExport}
              disabled={exporting}
              className="flex h-12 items-center justify-center gap-3 rounded-2xl border border-[#ffd166]/34 bg-[#ffd166]/18 px-5 text-sm font-bold text-white shadow-[0_14px_36px_rgba(255,70,70,0.2)] transition hover:border-[#ffd166]/55 hover:bg-[#ffd166]/24 disabled:opacity-55"
            >
              <FaDownload size={14} />
              {exporting ? '正在导出 JSON' : '立即导出完整 JSON'}
            </button>

            <a
              href={TARGET_URL}
              target="_blank"
              rel="noreferrer"
              className="flex h-12 items-center justify-center gap-3 rounded-2xl border border-[#9cc9ff]/28 bg-[#9cc9ff]/14 px-5 text-sm font-bold text-[#d7ecff] transition hover:border-[#9cc9ff]/48 hover:bg-[#9cc9ff]/20"
            >
              打开新域名
              <FaExternalLinkAlt size={12} />
            </a>
          </div>

          <p className="mt-4 text-center text-xs leading-5 text-white/42">
            关闭后每 30 分钟会再次提醒。迁移完成前，请不要清理浏览器数据或卸载 PWA。
          </p>
        </div>
      </div>
    </div>
  );
};

export default DomainMigrationWarning;
