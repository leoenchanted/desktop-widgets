import React from 'react';

const variants = {
  default: 'bg-white/10 text-white/58 border-white/12',
  accent: 'bg-[#80bfff]/15 text-[#b7dcff] border-[#80bfff]/25',
  success: 'bg-[#7ee7ad]/14 text-[#bdf6d3] border-[#7ee7ad]/25',
  warning: 'bg-[#f8d77a]/14 text-[#ffe8a4] border-[#f8d77a]/25',
};

const StatusPill = ({ children, variant = 'default', className = '' }) => (
  <span
    className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${variants[variant]} ${className}`}
  >
    {children}
  </span>
);

export default StatusPill;
