import React, { useState, useRef } from "react";
import { FaPlus, FaImage, FaTrash, FaLink, FaFileUpload } from "react-icons/fa";

const ImageWidget = () => {
  // 每个组件应该有独立的存储 Key (这里为了演示简化，实际最好用 props.id)
  // 为了防止所有图片组件同步，建议父组件传 id 进来，这里暂且用 state 内部管理
  const [imgSrc, setImgSrc] = useState(null);
  const [showInput, setShowInput] = useState(false); // 控制 URL 输入框显示
  const fileInputRef = useRef();

  // 处理本地文件
  const handleFile = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setImgSrc(ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  // 处理 URL 输入
  const handleUrlSubmit = (e) => {
    if (e.key === "Enter") {
      setImgSrc(e.target.value);
      setShowInput(false);
    }
  };

  return (
    <div className="w-full h-full relative flex flex-col items-center justify-center group/img">
      {/* 隐藏的文件输入 */}
      <input
        type="file"
        ref={fileInputRef}
        hidden
        accept="image/*"
        onChange={handleFile}
      />

      {/* --- 状态 1: 已有图片 --- */}
      {imgSrc ? (
        <>
          <div
            className="w-full h-full bg-cover bg-center absolute inset-0 transition-transform duration-700 hover:scale-110"
            style={{ backgroundImage: `url(${imgSrc})` }}
          />
          {/* 控制按钮 */}
          <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover/img:opacity-100 transition-opacity z-10">
            <button
              onClick={() => setImgSrc(null)}
              className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center hover:bg-red-500 transition-colors shadow-lg"
            >
              <FaTrash size={12} />
            </button>
          </div>
        </>
      ) : (
        /* --- 状态 2: 空状态 (选择上传方式) --- */
        <div className="flex flex-col items-center gap-3 w-full px-4">
          {showInput ? (
            // URL 输入模式
            <div className="w-full animate-fade-in">
              <input
                autoFocus
                placeholder="粘贴图片链接并回车..."
                className="w-full bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-xs text-white outline-none focus:bg-white/20"
                onKeyDown={handleUrlSubmit}
                onBlur={() => setShowInput(false)}
              />
            </div>
          ) : (
            // 按钮选择模式
            <>
              <div className="flex gap-4">
                <button
                  onClick={() => fileInputRef.current.click()}
                  className="flex flex-col items-center gap-2 text-white/50 hover:text-white transition-colors"
                  title="本地上传"
                >
                  <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/20 hover:scale-110 transition-all">
                    <FaFileUpload />
                  </div>
                  <span className="text-[10px]">上传</span>
                </button>

                <button
                  onClick={() => setShowInput(true)}
                  className="flex flex-col items-center gap-2 text-white/50 hover:text-white transition-colors"
                  title="网络链接"
                >
                  <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/20 hover:scale-110 transition-all">
                    <FaLink />
                  </div>
                  <span className="text-[10px]">链接</span>
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
