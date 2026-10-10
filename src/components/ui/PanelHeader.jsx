import React from 'react';

const PanelHeader = ({ eyebrow, title, meta, icon: Icon, action, className = '' }) => (
  <div className={`os-panel-header flex items-start justify-between gap-3 ${className}`}>
    <div className="min-w-0">
      <div className="flex items-center gap-2.5">
        {Icon && (
          <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/8 text-white/66">
            <Icon size={13} />
          </span>
        )}
        <div className="min-w-0">
          {eyebrow && <span className="panel-kicker block text-[8px]">{eyebrow}</span>}
          {title && <h2 className="mt-1 truncate text-sm font-medium tracking-normal text-white">{title}</h2>}
        </div>
      </div>
      {meta && <p className="mt-1 text-xs leading-relaxed text-white/45">{meta}</p>}
    </div>
    {action}
  </div>
);

export default PanelHeader;
