import React from 'react';
import { StopCard } from './StopCard.jsx';
import { formatDuration } from '../../utils/time.js';

export function DaySection({ day, onRemoveStop }) {
  const stopCount = day.stops ? day.stops.length : 0;
  const totalDuration = formatDuration(day.totalDurationMin || 0);

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

      {/* Stop Cards List */}
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
          day.stops.map((stop) => (
            <StopCard
              key={stop.id}
              stop={stop}
              onRemove={(stopId) => onRemoveStop(day.id, stopId)}
            />
          ))
        )}
      </div>
    </section>
  );
}
