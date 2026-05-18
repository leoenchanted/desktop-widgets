import React from 'react';
import { AVAILABLE_WIDGETS } from '../config/widgetRegistry';

const WidgetPicker = ({ onAdd }) => {
  const categories = AVAILABLE_WIDGETS.reduce((acc, widget) => {
    if (!acc[widget.category]) acc[widget.category] = [];
    acc[widget.category].push(widget);
    return acc;
  }, {});

  return (
    <div className="relative z-[100]">
      <div className="absolute -top-2 right-5 z-10 h-4 w-4 rotate-45 border-l border-t border-white/16 bg-[#17202b]" />

      <div className="glass-panel flex max-h-[520px] w-[360px] origin-top-right flex-col gap-5 overflow-y-auto p-5 text-left shadow-2xl custom-scrollbar animate-bubble">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <div className="panel-kicker">Widgets</div>
            <h3 className="mt-1 text-base font-semibold text-white">组件库</h3>
          </div>
          <span className="rounded-full bg-white/8 px-2.5 py-1 text-[10px] font-semibold text-white/38">
            {AVAILABLE_WIDGETS.length} 个
          </span>
        </div>

        {Object.entries(categories).map(([category, widgets]) => (
          <div key={category}>
            <h4 className="mb-3 ml-1 text-xs font-semibold text-[#b7dcff]">{category}</h4>
            <div className="grid grid-cols-2 gap-3">
              {widgets.map((widget) => {
                const Icon = widget.icon;
                return (
                  <button
                    key={widget.id}
                    onClick={() => onAdd(widget)}
                    className="group rounded-2xl border border-white/9 bg-white/[0.055] p-4 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-white/18 hover:bg-white/10 active:scale-[0.98]"
                  >
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/9 text-white/72 transition-all group-hover:bg-[#80bfff]/18 group-hover:text-white">
                      <Icon size={17} />
                    </div>
                    <div className="text-sm font-semibold text-white/86">{widget.name}</div>
                    <div className="mt-1 text-[11px] text-white/32">
                      {widget.defaultW} x {widget.defaultH}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WidgetPicker;
