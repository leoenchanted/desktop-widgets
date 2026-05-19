import React, { useEffect, useState } from 'react';
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
  const [isCompact, setIsCompact] = useState(() => window.innerWidth <= 720);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const actualGridSize = isCompact ? 112 : gridSize;
  const actualMargin = isCompact ? 14 : margin;

  useEffect(() => {
    const handleResize = () => setIsCompact(window.innerWidth <= 720);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleResizeItem = (id, size) => {
    setItems((currentItems) => currentItems.map((item) => (
      item.i === id ? { ...item, ...size } : item
    )));
  };

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
            gridTemplateColumns: `repeat(auto-fill, minmax(${actualGridSize}px, 1fr))`,
            gridAutoRows: `${actualGridSize}px`,
            gap: `${actualMargin}px`,
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
                config={config}
                component={config.component}
                isEditMode={isEditMode}
                isCompact={isCompact}
                gridSize={actualGridSize}
                margin={actualMargin}
                onRemove={onRemoveItem}
                onResize={handleResizeItem}
              />
            );
          })}
        </div>
      </SortableContext>
    </DndContext>
  );
};

export default SortableBoard;
