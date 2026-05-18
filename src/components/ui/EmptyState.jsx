import React from 'react';

const EmptyState = ({ title, detail, icon: Icon }) => (
  <div className="flex h-full min-h-[140px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/12 bg-white/[0.035] px-5 text-center">
    {Icon && (
      <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/8 text-white/38">
        <Icon size={15} />
      </span>
    )}
    <div className="text-sm font-medium text-white/55">{title}</div>
    {detail && <div className="mt-1 max-w-[220px] text-xs leading-relaxed text-white/30">{detail}</div>}
  </div>
);

export default EmptyState;
