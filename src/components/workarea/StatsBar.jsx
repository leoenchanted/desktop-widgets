import React from 'react';

const Stat = ({ value, label }) => (
  <span className="flex items-center gap-1.5">
    <span className="font-semibold text-white/72">{value}</span>
    <span>{label}</span>
  </span>
);

const StatsBar = ({ charCount, wordCount, extra }) => {
  const readingMinutes = charCount > 0 ? Math.max(1, Math.ceil(charCount / 260)) : 0;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] font-medium text-white/38">
      <div className="flex flex-wrap items-center gap-3">
        <Stat value={charCount} label="字符" />
        <span className="h-3 w-px bg-white/12" />
        <Stat value={wordCount} label="词" />
        <span className="h-3 w-px bg-white/12" />
        <Stat value={readingMinutes} label="分钟阅读" />
      </div>
      {extra && <div className="text-white/32">{extra}</div>}
    </div>
  );
};

export default StatsBar;
