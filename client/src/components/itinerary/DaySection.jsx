import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableStop } from './SortableStop.jsx';
import { formatDuration } from '../../utils/time.js';

export function DaySection({
  day,
  allDays = [],
  onRemoveStop,
  onReorderStops,
  onMoveToDay,
}) {
  const stopCount = day.stops ? day.stops.length : 0;
  const totalDuration = formatDuration(day.totalDurationMin || 0);

  // Configure pointer, touch, and keyboard sensors
  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: {
      distance: 6, // Prevents accidental drag when clicking
    },
  });

  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 200,
      tolerance: 5,
    },
  });

  const keyboardSensor = useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates,
  });

  const sensors = useSensors(pointerSensor, touchSensor, keyboardSensor);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      onReorderStops(day.id, active.id, over.id);
    }
  };

  return (
    <section
      style={{
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-sm)',
        marginBottom: '24px',
        overflow: 'hidden',
      }}
    >
      {/* Day Section Header */}
      <div
        style={{
          padding: '16px 20px',
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <h2 style={{ fontSize: '17px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
            {day.label}
          </h2>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Starts at {day.startTime || '09:00'}
          </span>
        </div>

        {/* Per-day summary stats */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span
            style={{
              fontSize: '12px',
              padding: '4px 10px',
              borderRadius: '12px',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-secondary)',
              fontWeight: '500',
            }}
          >
            {stopCount} {stopCount === 1 ? 'stop' : 'stops'}
          </span>

          <span
            style={{
              fontSize: '12px',
              padding: '4px 10px',
              borderRadius: '12px',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-secondary)',
              fontWeight: '500',
            }}
          >
            ⏱️ {totalDuration}
          </span>
        </div>
      </div>

      {/* Stop Cards List with dnd-kit Sortable Context */}
      <div style={{ padding: '16px' }}>
        {stopCount === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '24px',
              color: 'var(--text-muted)',
              fontSize: '13px',
              border: '1px dashed var(--border-color)',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            No stops in this day.
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            accessibility={{
              screenReaderInstructions: {
                draggable: 'To pick up a draggable item, press space or enter. While dragging, use arrow keys to move. Press space or enter again to drop, or escape to cancel.',
              },
            }}
          >
            <SortableContext
              items={day.stops.map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
              {day.stops.map((stop) => (
                <SortableStop
                  key={stop.id}
                  stop={stop}
                  currentDayId={day.id}
                  allDays={allDays}
                  onRemove={onRemoveStop}
                  onMoveToDay={onMoveToDay}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>
    </section>
  );
}
