import React from "react";
import { AVAILABLE_WIDGETS } from "../config/widgetRegistry";

const WidgetPicker = ({ onAdd }) => {
  const categories = {};
  AVAILABLE_WIDGETS.forEach((w) => {
    if (!categories[w.category]) categories[w.category] = [];
    categories[w.category].push(w);
  });

  return (
    <div className="relative z-[100]">
      {/* 气泡小三角 */}
      <div className="absolute -top-2 right-4 w-4 h-4 bg-[#252525] rotate-45 border-t border-l border-white/20 z-10"></div>

      {/* 
         注意这里的 animate-bubble 
         origin-top-right 确保它是从右上角(按钮位置)放大出来的
      */}
      <div className="bg-[#252525]/95 backdrop-blur-2xl border border-white/20 rounded-2xl w-[340px] shadow-2xl p-5 max-h-[500px] overflow-y-auto custom-scrollbar text-left flex flex-col gap-6 animate-bubble origin-top-right">
        <div className="flex justify-between items-center border-b border-white/10 pb-3">
          <h3 className="text-sm font-bold text-white uppercase tracking-widest">
            组件库
          </h3>
          <span className="text-[10px] bg-white/10 px-2 py-1 rounded text-white/60">
            拖拽或点击添加
          </span>
        </div>

        {Object.keys(categories).map((cat) => (
          <div key={cat}>
            <h4 className="text-xs font-semibold text-[#0A84FF] mb-3 ml-1">
              {cat}
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {categories[cat].map((widget) => (
                <button
                  key={widget.id}
                  onClick={() => onAdd(widget)}
                  // 按钮的点击反馈：active:scale-95
                  className="group flex flex-col items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 hover:border-white/30 border border-white/5 transition-all duration-300 active:scale-95"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center text-white/80 group-hover:text-white group-hover:scale-110 transition-all duration-300 shadow-inner">
                    <widget.icon size={18} />
                  </div>

                  <div className="text-center">
                    <div className="font-medium text-white text-xs mb-0.5">
                      {widget.name}
                    </div>
                    <div className="text-[10px] text-white/40">
                      {widget.defaultW}x{widget.defaultH}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WidgetPicker;
