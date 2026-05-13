import React from 'react';

const StatsBar = ({ charCount, wordCount }) => {
  return (
    <div className="flex items-center gap-4 px-1 py-2 text-[10px] text-white/30 font-mono">
      <span className="flex items-center gap-1">
        <span className="font-semibold text-white/50">{charCount}</span>
        <span>字符</span>
      </span>
      <span className="w-px h-3 bg-white/10" />
      <span className="flex items-center gap-1">
        <span className="font-semibold text-white/50">{wordCount}</span>
        <span>单词</span>
      </span>
      <span className="w-px h-3 bg-white/10" />
      <span className="flex items-center gap-1">
        <span className="font-semibold text-white/50">
          {charCount > 0 ? Math.max(1, Math.ceil(charCount / 200)) : 0}
        </span>
        <span>分钟阅读</span>
      </span>
    </div>
  );
};

export default StatsBar;
