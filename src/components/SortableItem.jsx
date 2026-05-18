import React from 'react';
import { FaTimes } from 'react-icons/fa';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const SortableItem = ({
  id,
  widget,
  component: Component,
  isEditMode,
  onRemove,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useSortable({
    id,
    disabled: !isEditMode,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition: isDragging
      ? 'none'
      : 'transform 0.36s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.24s ease, border-color 0.24s ease',
    gridColumn: `span ${widget.w}`,
    gridRow: `span ${widget.h}`,
    zIndex: isDragging ? 999 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`group relative h-full animate-pop-in ${
        isDragging ? 'z-50 scale-[0.985] cursor-grabbing opacity-90' : ''
      } ${isEditMode && !isDragging ? 'cursor-grab hover:scale-[1.01]' : ''}`}
    >
      <div
        className={`glass-panel relative flex h-full w-full flex-col overflow-hidden rounded-[28px] p-0 transition-all duration-300 ease-apple ${
          !isDragging ? 'hover:-translate-y-1 hover:border-white/30 hover:bg-white/12' : ''
        }`}
      >
        <Component />
        {isEditMode && <div className="absolute inset-0 z-30 bg-transparent" />}
      </div>

      {isEditMode && (
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
      )}
    </div>
  );
};

export default SortableItem;
