import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { StopCard } from './StopCard.jsx';
import { formatDuration } from '../../utils/time.js';

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

  const hasSignificantGap =
    typeof stop.gapBeforeMin === 'number' && stop.gapBeforeMin >= 60;

  return (
    <div ref={setNodeRef} style={style}>
      {hasSignificantGap && (
        <div
          role="note"
          aria-label={`${formatDuration(stop.gapBeforeMin)} free time before ${stop.name}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            margin: '4px 0 8px 0',
            color: 'var(--text-muted)',
            fontSize: '11px',
            fontWeight: '500',
          }}
        >
          <div
            style={{
              flex: 1,
              borderTop: '1px dashed var(--border-color)',
              height: '0',
            }}
            aria-hidden="true"
          />
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 8px',
              background: 'var(--bg-secondary)',
              borderRadius: '10px',
              border: '1px solid var(--border-color)',
            }}
          >
            <span aria-hidden="true">☕</span>
            <span>{formatDuration(stop.gapBeforeMin)} free time</span>
          </span>
          <div
            style={{
              flex: 1,
              borderTop: '1px dashed var(--border-color)',
              height: '0',
            }}
            aria-hidden="true"
          />
        </div>
      )}
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
