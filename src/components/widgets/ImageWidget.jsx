import React, { useEffect, useRef, useState } from 'react';
import { FaFileUpload, FaLink, FaSpinner, FaTrash } from 'react-icons/fa';
import { deleteRecord, getRecord, putRecord } from '../../data/localDb';
import { wallpaperApi } from '../../api/wallpaperApi';

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve(event.target.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

const ImageWidget = ({ widgetId = 'default' }) => {
  const [imgSrc, setImgSrc] = useState(null);
  const [showInput, setShowInput] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);
  const configKey = `image:${widgetId}`;

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const config = await getRecord('widgets', configKey);
      const value = config?.value;
      if (!value || cancelled) return;

      if (value.kind === 'asset' && value.assetId) {
        const objectUrl = await wallpaperApi.getObjectUrl(value.assetId);
        if (!cancelled) setImgSrc(objectUrl);
      } else if (value.kind === 'url' || value.kind === 'dataUrl') {
        setImgSrc(value.url);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [configKey]);

  const saveConfig = async (value) => {
    await putRecord('widgets', {
      key: configKey,
      value,
      updated_at: new Date().toISOString(),
    });
  };

  const handleFile = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setSaving(true);
    try {
      const result = await wallpaperApi.upload({ file, type: 'image-widget' });
      setImgSrc(result.url);
      await saveConfig({ kind: 'asset', assetId: result.assetId, name: file.name });
    } catch (error) {
      console.error('Failed to save image widget asset', error);
      const dataUrl = await readAsDataUrl(file);
      setImgSrc(dataUrl);
      await saveConfig({ kind: 'dataUrl', url: dataUrl, name: file.name });
    } finally {
      setSaving(false);
      event.target.value = '';
    }
  };

  const handleUrlSubmit = async (event) => {
    if (event.key === 'Enter' && event.target.value.trim()) {
      const url = event.target.value.trim();
      setImgSrc(url);
      setShowInput(false);
      await saveConfig({ kind: 'url', url });
    }
  };

  const handleRemove = async () => {
    setImgSrc(null);
    await deleteRecord('widgets', configKey);
  };

  return (
    <div className="group/img relative flex h-full w-full flex-col items-center justify-center overflow-hidden">
      <input
        type="file"
        ref={fileInputRef}
        hidden
        accept="image/*"
        onChange={handleFile}
      />

      {imgSrc ? (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover/img:scale-105"
            style={{ backgroundImage: `url(${imgSrc})` }}
          />
          <div className="absolute inset-0 bg-black/8" />
          <div className="absolute bottom-3 right-3 z-10 flex gap-2 opacity-0 transition-opacity group-hover/img:opacity-100">
            <button
              onClick={handleRemove}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/42 text-white/74 backdrop-blur-xl transition-colors hover:bg-[#ff8d8d]/80 hover:text-white"
              title="移除图片"
            >
              <FaTrash size={12} />
            </button>
          </div>
        </>
      ) : (
        <div className="flex w-full flex-col items-center gap-4 px-5 text-center">
          {saving ? (
            <div className="flex items-center gap-2 text-sm font-medium text-white/42">
              <FaSpinner className="animate-spin" />
              保存中
            </div>
          ) : showInput ? (
            <input
              autoFocus
              placeholder="粘贴图片链接"
              className="w-full rounded-2xl border border-white/12 bg-white/8 px-3 py-2 text-sm text-white outline-none placeholder-white/28 focus:border-[#80bfff]/40"
              onKeyDown={handleUrlSubmit}
              onBlur={() => setShowInput(false)}
            />
          ) : (
            <>
              <div className="text-sm font-semibold text-white/56">相框</div>
              <div className="flex gap-4">
                <button
                  onClick={() => fileInputRef.current.click()}
                  className="flex flex-col items-center gap-2 text-white/42 transition-colors hover:text-white"
                  title="本地上传"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/7">
                    <FaFileUpload />
                  </span>
                  <span className="text-[10px] font-medium">上传</span>
                </button>

                <button
                  onClick={() => setShowInput(true)}
                  className="flex flex-col items-center gap-2 text-white/42 transition-colors hover:text-white"
                  title="图片链接"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/7">
                    <FaLink />
                  </span>
                  <span className="text-[10px] font-medium">链接</span>
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageWidget;
