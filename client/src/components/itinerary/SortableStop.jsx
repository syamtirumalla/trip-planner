import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { StopCard } from './StopCard.jsx';

export function SortableStop({
  stop,
  currentDayId,
  allDays,
  onRemove,
  onMoveToDay,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stop.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 999 : 'auto',
    position: 'relative',
  };

  return (
    <div ref={setNodeRef} style={style}>
      <StopCard
        stop={stop}
        currentDayId={currentDayId}
        allDays={allDays}
        onRemove={onRemove}
        onMoveToDay={onMoveToDay}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}

