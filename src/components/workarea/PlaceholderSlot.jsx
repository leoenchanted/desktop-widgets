import React from 'react';

const PlaceholderSlot = ({ title = '其他', description = '即将推出...' }) => {
  return (
    <div className="bg-black/60 border-2 border-red-500/70 rounded-lg flex flex-col items-center justify-center p-4 h-full min-h-[100px]">
      <span className="text-xs font-medium text-white/30">{title}</span>
      <span className="text-[9px] text-white/15 mt-1">{description}</span>
    </div>
  );
};

export default PlaceholderSlot;
