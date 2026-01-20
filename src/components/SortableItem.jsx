import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FaTimes } from "react-icons/fa";

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
    transition,
    isDragging,
  } = useSortable({
    id: id,
    disabled: !isEditMode,
  });

  const style = {
    // 强制 GPU 加速
    transform: CSS.Translate.toString(transform),
    // 拖拽时由 JS 驱动，松手时由 CSS 补间
    transition: isDragging
      ? "none"
      : "transform 0.4s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.3s ease, border-color 0.3s ease",
    gridColumn: `span ${widget.w}`,
    gridRow: `span ${widget.h}`,
    zIndex: isDragging ? 999 : "auto",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        relative group h-full
        animate-pop-in
        ${isDragging ? "scale-[0.98] opacity-90 z-50 cursor-grabbing" : ""}
        ${isEditMode && !isDragging ? "cursor-grab hover:scale-[1.02]" : ""}
      `}
    >
      {/* --- 核心玻璃容器 --- */}
      <div
        className={`
        w-full h-full 
        
        /* 1. 背景色：加强一点，避免太透 */
        bg-[#ffffff25] 
        /* 兼容深色模式 */
        dark:bg-[#00000030]

        /* 2. 强力模糊：这是毛玻璃的核心 */
        backdrop-blur-2xl

        /* 3. 饱和度提升：让玻璃看起来更"厚"，更有质感 (Apple 秘籍) */
        backdrop-saturate-150
        
        /* 4. 边框与阴影 */
        border border-white/30
        shadow-[0_8px_32px_0_rgba(0,0,0,0.15)] 
        
        /* 圆角与布局 */
        rounded-[28px] 
        flex flex-col 
        relative overflow-hidden
        box-border gpu-accelerated
        
        /* 交互反馈 */
        ${
          !isDragging &&
          `
          hover:-translate-y-2 
          hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.3)] 
          hover:border-white/60 
          hover:bg-[#ffffff30]
        `
        }
        transition-all duration-500 ease-apple
      `}
      >
        {/* 组件内容 */}
        <Component />

        {/* 编辑模式遮罩 */}
        {isEditMode && <div className="absolute inset-0 z-30 bg-transparent" />}
      </div>

      {/* 删除按钮 */}
      {isEditMode && (
        <div className="absolute -top-2 -right-2 z-50 animate-bubble">
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onRemove(id);
            }}
            className="bg-red-500 text-white w-7 h-7 rounded-full flex items-center justify-center shadow-lg border-2 border-[#333] hover:scale-110 hover:bg-red-600 active:scale-90 transition-all duration-300"
          >
            <FaTimes size={10} />
          </button>
        </div>
      )}
    </div>
  );
};

export default SortableItem;
