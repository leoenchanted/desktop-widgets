import React, { useState, useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { FaCog, FaPlus, FaCheck, FaImage, FaFileUpload } from "react-icons/fa";
import SortableBoard from "./components/SortableBoard";
import WidgetPicker from "./components/WidgetPicker";

const DEFAULT_LAYOUT = [
  { i: "1", w: 2, h: 1, type: "clock" },
  { i: "2", w: 2, h: 2, type: "horoscope" },
  { i: "3", w: 2, h: 1, type: "quote" },
  { i: "4", w: 1, h: 1, type: "calendar" },
  { i: "5", w: 1, h: 1, type: "image" },
];

// --- 这里定义固定的美学参数 ---
const FIXED_GRID_SIZE = 140; // 单元格基准高度
const FIXED_MARGIN = 30; // 还原原来的 30px 间距，最经典

function App() {
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem("glass_items");
    return saved ? JSON.parse(saved) : DEFAULT_LAYOUT;
  });

  // 设置里只保留壁纸了，其他的都固定死
  const [settings, setSettings] = useState({
    bg:
      localStorage.getItem("glass_bg") ||
      "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?ixlib=rb-4.0.3&auto=format&fit=crop&w=2940&q=80",
  });

  const [showPicker, setShowPicker] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [username, setUsername] = useState(
    localStorage.getItem("glass_user") || "Guest",
  );

  const bgInputRef = useRef(null);
  const pickerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setShowPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    localStorage.setItem("glass_items", JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    document.body.style.backgroundImage = `url('${settings.bg}')`;
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundPosition = "center";
    document.body.style.backgroundAttachment = "fixed";
  }, [settings.bg]);

  const handleAddWidget = (widgetConfig) => {
    const newItem = {
      i: uuidv4(),
      w: widgetConfig.defaultW,
      h: widgetConfig.defaultH,
      type: widgetConfig.id,
    };
    setItems([...items, newItem]);
    setShowPicker(false);
  };

  const updateSetting = (key, val) => {
    const newSettings = { ...settings, [key]: val };
    setSettings(newSettings);
    if (key === "bg") localStorage.setItem("glass_bg", val);
  };

  const handleBgUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        updateSetting("bg", ev.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen w-full text-white font-sans pb-20">
      <div className="fixed inset-0 bg-black/15 pointer-events-none -z-10" />

      {/* Header: 宽度铺满，左右保留 px-6 (24px) 的边距，或者 px-8 (32px) */}
      <header className="pt-10 pb-8 px-6 md:px-8 flex flex-col md:flex-row justify-between items-end w-full mx-auto">
        <div>
          <div className="text-lg text-white/80 mb-1">Good Morning,</div>
          <input
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              localStorage.setItem("glass_user", e.target.value);
            }}
            className="text-5xl md:text-6xl font-bold bg-transparent border-b-2 border-transparent hover:border-white/30 focus:border-white/50 outline-none min-w-[200px] transition-all text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-300 placeholder-white/50"
            spellCheck={false}
          />
        </div>

        {/* 按钮组 */}
        <div className="flex gap-4 relative mt-6 md:mt-0" ref={pickerRef}>
          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className={`w-11 h-11 rounded-full flex items-center justify-center border transition-all duration-300 backdrop-blur-md
              ${
                isEditMode
                  ? "bg-[#0A84FF] border-[#0A84FF] text-white rotate-0"
                  : "bg-white/15 border-white/30 hover:bg-white/30 rotate-0 hover:rotate-90"
              }`}
          >
            {isEditMode ? <FaCheck /> : <FaCog size={18} />}
          </button>

          <button
            onClick={() => setShowPicker(!showPicker)}
            className={`w-11 h-11 rounded-full flex items-center justify-center border border-white/30 backdrop-blur-md transition-all duration-300
              ${showPicker ? "bg-white/30" : "bg-white/15 hover:bg-white/30"}`}
          >
            <FaPlus size={16} />
          </button>

          {/* Widget Picker */}
          {showPicker && (
            <div className="absolute top-full right-0 mt-4 z-[999]">
              {" "}
              {/* 确保 Z轴很高 */}
              <WidgetPicker onAdd={handleAddWidget} />
            </div>
          )}
        </div>
      </header>

      {/* --- 设置栏 (Dock) --- */}
      {isEditMode && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-40 bg-black/70 backdrop-blur-2xl border border-white/10 px-8 py-4 rounded-3xl shadow-2xl flex flex-wrap justify-center items-center gap-6 animate-fade-in w-auto">
          {/* 现在只剩下壁纸设置了，非常干净 */}
          <div className="flex flex-col gap-1 w-64">
            <label className="text-[10px] text-white/50 uppercase font-bold flex items-center gap-1">
              <FaImage /> 壁纸设置
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={settings.bg.startsWith("data:") ? "" : settings.bg}
                placeholder="输入图片 URL..."
                onChange={(e) => updateSetting("bg", e.target.value)}
                className="flex-1 bg-white/10 border border-white/10 rounded px-2 py-1 text-xs text-white/80 focus:bg-white/20 outline-none"
              />
              <input
                type="file"
                ref={bgInputRef}
                hidden
                accept="image/*"
                onChange={handleBgUpload}
              />
              <button
                onClick={() => bgInputRef.current.click()}
                className="bg-white/10 hover:bg-white/20 border border-white/10 rounded px-3 flex items-center justify-center text-white/70 transition-colors"
                title="上传本地壁纸"
              >
                <FaFileUpload size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 
         --- 画布区域 ---
         1. w-full: 宽度铺满
         2. px-4 md:px-6: 左右留出一点点好看的间隙 (Mobile: 16px, Desktop: 24px)
      */}
      <div className="w-full px-4 md:px-6 mx-auto">
        <SortableBoard
          items={items}
          setItems={setItems}
          onRemoveItem={(id) => setItems(items.filter((i) => i.i !== id))}
          gridSize={FIXED_GRID_SIZE}
          margin={FIXED_MARGIN}
          isEditMode={isEditMode}
        />
      </div>
    </div>
  );
}

export default App;
