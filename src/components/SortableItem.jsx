import React, { useRef, useState } from 'react';
import { FaExpandAlt, FaTimes } from 'react-icons/fa';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const SortableItem = ({
  id,
  widget,
  config,
  component: Component,
  isEditMode,
  isCompact,
  gridSize,
  margin,
  onRemove,
  onResize,
}) => {
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartRef = useRef(null);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useSortable({
    id,
    disabled: !isEditMode || isResizing,
  });

  const minW = config.minW || 1;
  const minH = config.minH || 1;
  const maxW = config.maxW || 6;
  const maxH = config.maxH || 5;
  const effectiveW = isCompact ? Math.min(widget.w, 2) : widget.w;
  const effectiveH = isCompact ? Math.min(widget.h, 2) : widget.h;

  const style = {
    transform: CSS.Translate.toString(transform),
    transition: isDragging
      ? 'none'
      : 'transform 0.36s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.24s ease, border-color 0.24s ease',
    gridColumn: `span ${effectiveW}`,
    gridRow: `span ${effectiveH}`,
    zIndex: isDragging ? 999 : 'auto',
  };

  const startResize = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsResizing(true);
    resizeStartRef.current = {
      x: event.clientX,
      y: event.clientY,
      w: widget.w,
      h: widget.h,
    };

    const step = gridSize + margin;
    const handlePointerMove = (moveEvent) => {
      const start = resizeStartRef.current;
      if (!start) return;
      const deltaW = Math.round((moveEvent.clientX - start.x) / step);
      const deltaH = Math.round((moveEvent.clientY - start.y) / step);
      const nextW = Math.max(minW, Math.min(maxW, start.w + deltaW));
      const nextH = Math.max(minH, Math.min(maxH, start.h + deltaH));
      onResize(id, { w: nextW, h: nextH });
    };

    const handlePointerUp = () => {
      resizeStartRef.current = null;
      setIsResizing(false);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`group relative h-full animate-pop-in ${
        isDragging ? 'z-50 scale-[0.985] cursor-grabbing opacity-90' : ''
      } ${isEditMode && !isDragging && !isResizing ? 'cursor-grab hover:scale-[1.01]' : ''} ${
        isResizing ? 'select-none' : ''
      }`}
    >
      <div
        className={`glass-panel relative flex h-full w-full flex-col overflow-hidden rounded-[28px] p-0 transition-all duration-300 ease-apple ${
          !isDragging ? 'hover:-translate-y-1 hover:border-white/30 hover:bg-white/12' : ''
        } widget-card`}
      >
        <Component widget={widget} widgetId={id} />
        {isEditMode && <div className="absolute inset-0 z-30 bg-transparent" />}
      </div>

      {isEditMode && (
        <>
          <div className="absolute -right-2 -top-2 z-50 animate-bubble">
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onRemove(id);
              }}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-white/20 bg-[#ff8d8d] text-white shadow-lg transition-all duration-200 hover:scale-110"
              title="删除组件"
            >
              <FaTimes size={10} />
            </button>
          </div>

          {!isCompact && (
            <button
              onPointerDown={startResize}
              className="absolute -bottom-2 -right-2 z-50 flex h-8 w-8 cursor-nwse-resize items-center justify-center rounded-full border border-white/18 bg-[#9cc9ff]/80 text-white shadow-lg backdrop-blur-xl transition-all hover:scale-110"
              title={`拖拽调整大小，最小 ${minW}x${minH}`}
            >
              <FaExpandAlt size={11} />
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default SortableItem;
