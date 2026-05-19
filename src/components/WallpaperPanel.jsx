import React, { useRef, useState } from 'react';
import { FaImage, FaLink, FaTimes, FaUpload } from 'react-icons/fa';
import { wallpaperApi } from '../api/wallpaperApi';
import { useSettingsStore } from '../store/useSettingsStore';
import IconButton from './ui/IconButton';

function normalizeWallpaperUrl(value) {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('//')) return `https:${trimmed}`;
  if (/^(https?:|data:image\/)/i.test(trimmed)) return trimmed;
  if (/^[\w.-]+\.[a-z]{2,}(\/.*)?$/i.test(trimmed)) return `https://${trimmed}`;
  return trimmed;
}

function canUseWallpaperValue(value) {
  return /^(https?:|data:image\/)/i.test(value);
}

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve(event.target.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

const WallpaperPanel = ({ onClose }) => {
  const { bg, setBg, setWallpaperAsset } = useSettingsStore();
  const [urlInput, setUrlInput] = useState(() => (/^https?:/i.test(bg || '') ? bg : ''));
  const [status, setStatus] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileRef = useRef(null);

  const applyWallpaperUrl = () => {
    const nextBg = normalizeWallpaperUrl(urlInput);
    if (!canUseWallpaperValue(nextBg)) {
      setStatus('请输入 http(s) 图片链接，或上传本地图片');
      return;
    }
    setBg(nextBg);
    setUrlInput(nextBg);
    setStatus('壁纸 URL 已保存到本地设置');
  };

  const handleUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setStatus('请选择图片文件');
      event.target.value = '';
      return;
    }

    setIsUploading(true);
    setStatus('正在压缩并保存到浏览器本地...');
    try {
      const result = await wallpaperApi.upload({ file });
      setWallpaperAsset(result.assetId, result.url);
      setUrlInput('');
      setStatus(
        result.compressed
          ? '本地壁纸已高质量压缩并保存'
          : '本地壁纸已原画质保存',
      );
    } catch (error) {
      console.error('Failed to save wallpaper in IndexedDB, falling back to data URL', error);
      const dataUrl = await readAsDataUrl(file);
      setBg(dataUrl);
      setUrlInput('');
      setStatus('已回退为浏览器 data URL 保存');
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4 py-6" onClick={onClose}>
      <div className="absolute inset-0 bg-black/44 backdrop-blur-sm" />
      <div
        className="glass-panel relative w-full max-w-lg overflow-hidden p-0 shadow-2xl animate-bubble"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-5">
          <div>
            <div className="panel-kicker flex items-center gap-2">
              <FaImage size={11} />
              Wallpaper
            </div>
            <h3 className="mt-2 text-lg font-semibold text-white">壁纸设置</h3>
            <p className="mt-1 text-xs leading-5 text-white/42">
              支持图片 URL 和本地图片，本地图片会保存到当前浏览器 IndexedDB。
            </p>
          </div>
          <IconButton icon={FaTimes} onClick={onClose} title="关闭" className="h-9 w-9" />
        </div>

        <div className="grid gap-4 p-5">
          <div
            className="relative h-32 overflow-hidden rounded-2xl border border-white/10 bg-white/8"
            style={bg ? { backgroundImage: `url("${bg.replaceAll('"', '\\"')}")`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/48 via-black/8 to-transparent" />
            <div className="absolute bottom-3 left-3 rounded-full border border-white/12 bg-black/24 px-3 py-1 text-[11px] font-semibold text-white/70 backdrop-blur-md">
              当前壁纸预览
            </div>
          </div>

          <div className="grid gap-2">
            <label className="panel-kicker flex items-center gap-2">
              <FaLink size={10} />
              Image URL
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={urlInput}
                placeholder="https://..."
                onChange={(event) => setUrlInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && urlInput.trim()) {
                    applyWallpaperUrl();
                  }
                }}
                className="min-w-0 flex-1 rounded-xl border border-white/12 bg-white/8 px-3 py-2.5 text-sm text-white/84 outline-none placeholder-white/28 transition-all focus:border-[#80bfff]/40 focus:bg-white/12"
              />
              <button
                onClick={applyWallpaperUrl}
                disabled={!urlInput.trim()}
                className="glass-control flex h-11 items-center justify-center px-4 text-xs font-semibold text-white/66 hover:text-white disabled:opacity-35"
                title="应用 URL 壁纸"
              >
                应用
              </button>
            </div>
            {bg && /^https?:/i.test(bg) && (
              <button
                onClick={() => setUrlInput(bg)}
                className="w-fit text-xs font-semibold text-white/40 transition-colors hover:text-white/72"
              >
                填入当前 URL
              </button>
            )}
          </div>

          <button
            onClick={() => fileRef.current?.click()}
            disabled={isUploading}
            className="glass-control flex items-center gap-3 px-4 py-4 text-left disabled:opacity-40"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#9ae9bd]/14 text-[#c7f7db]">
              <FaUpload size={14} />
            </span>
            <span>
              <span className="block text-sm font-semibold text-white/84">上传本地图片</span>
              <span className="mt-0.5 block text-xs text-white/34">
                过大的图片会做高质量压缩，避免本地存储被快速占满
              </span>
            </span>
          </button>
          <input ref={fileRef} type="file" hidden accept="image/*" onChange={handleUpload} />
        </div>

        {status && (
          <div className="mx-5 mb-5 rounded-2xl border border-white/10 bg-white/7 px-3 py-2 text-center text-xs font-medium text-white/52">
            {status}
          </div>
        )}
      </div>
    </div>
  );
};

export default WallpaperPanel;
