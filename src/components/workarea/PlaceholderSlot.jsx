import React from 'react';
import { FaRegLightbulb } from 'react-icons/fa';
import GlassPanel from '../ui/GlassPanel';
import PanelHeader from '../ui/PanelHeader';

const PlaceholderSlot = ({ title = '灵感暂存', description = '待扩展' }) => {
  return (
    <GlassPanel className="flex h-full min-h-[220px] flex-col">
      <PanelHeader eyebrow="Capture" title={title} icon={FaRegLightbulb} />
      <div className="mt-4 flex flex-1 items-center justify-center rounded-3xl border border-dashed border-white/12 bg-white/[0.035]">
        <span className="text-sm font-medium text-white/30">{description}</span>
      </div>
    </GlassPanel>
  );
};

export default PlaceholderSlot;
