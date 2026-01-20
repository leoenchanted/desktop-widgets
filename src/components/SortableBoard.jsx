import React from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import SortableItem from "./SortableItem";
import { WIDGET_REGISTRY } from "../config/widgetRegistry";

const SortableBoard = ({
  items,
  setItems,
  onRemoveItem,
  margin,
  gridSize,
  isEditMode,
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={(e) => {
        const { active, over } = e;
        if (active.id !== over?.id) {
          setItems((items) => {
            const oldIndex = items.findIndex((i) => i.i === active.id);
            const newIndex = items.findIndex((i) => i.i === over.id);
            return arrayMove(items, oldIndex, newIndex);
          });
        }
      }}
    >
      <SortableContext
        items={items.map((i) => i.i)}
        strategy={rectSortingStrategy}
      >
        <div
          className="grid justify-center"
          style={{
            // 响应式网格：自适应列数，最小宽度 140px (可以根据需要调小，比如 120)
            gridTemplateColumns: `repeat(auto-fill, minmax(${gridSize}px, 1fr))`,
            // 自动行高
            gridAutoRows: `${gridSize}px`,
            // 间距：直接绑定到 margin
            gap: `${margin}px`,
          }}
        >
          {items.map((item) => {
            const config = WIDGET_REGISTRY[item.type];
            if (!config) return null;
            return (
              <SortableItem
                key={item.i}
                id={item.i}
                widget={item}
                component={config.component}
                isEditMode={isEditMode}
                onRemove={onRemoveItem}
              />
            );
          })}
        </div>
      </SortableContext>
    </DndContext>
  );
};
export default SortableBoard;
