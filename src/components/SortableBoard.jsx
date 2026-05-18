import React from 'react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import SortableItem from './SortableItem';
import { WIDGET_REGISTRY } from '../config/widgetRegistry';

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
      onDragEnd={(event) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        setItems((currentItems) => {
          const oldIndex = currentItems.findIndex((item) => item.i === active.id);
          const newIndex = currentItems.findIndex((item) => item.i === over.id);
          return arrayMove(currentItems, oldIndex, newIndex);
        });
      }}
    >
      <SortableContext
        items={items.map((item) => item.i)}
        strategy={rectSortingStrategy}
      >
        <div
          className="grid justify-center"
          style={{
            gridTemplateColumns: `repeat(auto-fill, minmax(${gridSize}px, 1fr))`,
            gridAutoRows: `${gridSize}px`,
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
