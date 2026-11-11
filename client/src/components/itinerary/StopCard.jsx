import React, { useState } from 'react';
import { MoveToDaySelect } from './MoveToDaySelect.jsx';

const TYPE_CONFIG = {
  food: { color: '#ea580c', bg: '#fff7ed', border: '#fdba74', icon: '🍽️' },
  sight: { color: '#2563eb', bg: '#eff6ff', border: '#93c5fd', icon: '🏛️' },
  activity: { color: '#16a34a', bg: '#f0fdf4', border: '#86efac', icon: '🚶' },
  transit: { color: '#475569', bg: '#f8fafc', border: '#cbd5e1', icon: '🚇' },
  rest: { color: '#7c3aed', bg: '#faf5ff', border: '#d8b4fe', icon: '☕' },
};

export function StopCard({
  stop,
  currentDayId,
  allDays = [],
  onRemove,
  onMoveToDay,
  dragHandleProps,
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const typeStyle = TYPE_CONFIG[stop.type] || TYPE_CONFIG.sight;

  return (
    <article
      style={{
        background: 'var(--bg-primary)',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-sm)',
        marginBottom: '10px',
        overflow: 'hidden',
        transition: 'border-color var(--transition), box-shadow var(--transition)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '8px 12px',
          gap: '8px',
        }}
      >
        {/* Dedicated Drag Handle Button (Keyboard & Touch Accessible) */}
        {dragHandleProps && (
          <button
            type="button"
            aria-label={`Drag to reorder ${stop.name}`}
            title="Drag to reorder"
            {...dragHandleProps}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'grab',
              padding: '4px',
              minWidth: '44px',
              minHeight: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              lineHeight: 1,
              touchAction: 'none',
              userSelect: 'none',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            ⋮⋮
          </button>
        )}

        {/* Real button header with aria-expanded */}
        <button
          type="button"
          aria-expanded={isExpanded}
          onClick={() => setIsExpanded((prev) => !prev)}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'none',
            border: 'none',
            color: 'inherit',
            cursor: 'pointer',
            textAlign: 'left',
            padding: '4px 0',
            minHeight: '44px',
            gap: '8px',
            minWidth: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0, flexWrap: 'wrap' }}>
            {/* Start Time Pill */}
            <span
              style={{
                fontSize: '12px',
                fontWeight: '700',
                fontVariantNumeric: 'tabular-nums',
                color: 'var(--primary)',
                background: 'var(--primary-light)',
                padding: '3px 8px',
                borderRadius: 'var(--radius-sm)',
                whiteSpace: 'nowrap',
              }}
            >
              {stop.startTime || '09:00'}
            </span>

            {/* Name & Type Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-primary)' }}>
                {stop.name}
              </span>

              <span
                style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.4px',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  backgroundColor: typeStyle.bg,
                  color: typeStyle.color,
                  border: `1px solid ${typeStyle.border}`,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span>{typeStyle.icon}</span>
                {stop.type}
              </span>
            </div>
          </div>

          {/* Right side: Duration & Expand Chevron */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
              {stop.durationMin}m
            </span>

            <span
              style={{
                fontSize: '11px',
                color: 'var(--text-muted)',
                display: 'inline-block',
                transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform var(--transition)',
              }}
            >
              ▼
            </span>
          </div>
        </button>

        {/* Remove Button (outside the toggle button to avoid nested triggers) */}
        <button
          type="button"
          aria-label={`Remove ${stop.name}`}
          title="Remove stop"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(stop.id);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.stopPropagation();
            }
          }}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '4px',
            minWidth: '44px',
            minHeight: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 'var(--radius-sm)',
            fontSize: '16px',
            lineHeight: 1,
            transition: 'color var(--transition)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--danger)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
        >
          ✕
        </button>
      </div>

      {/* Expanded Details Section */}
      {isExpanded && (
        <div
          style={{
            padding: '12px 16px 16px 16px',
            borderTop: '1px solid var(--border-color)',
            background: 'var(--bg-secondary)',
            fontSize: '13px',
            lineHeight: 1.5,
          }}
        >
          <p style={{ color: 'var(--text-secondary)', marginBottom: '10px' }}>
            {stop.description}
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '12px' }}>
            {stop.costEstimate && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#16a34a' }}>
                <span style={{ fontWeight: '600' }}>Cost:</span>
                <span>{stop.costEstimate}</span>
              </div>
            )}

            {stop.tip && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '4px', color: '#b45309' }}>
                <span style={{ fontWeight: '600' }}>Tip:</span>
                <span>{stop.tip}</span>
              </div>
            )}
          </div>

          {/* Accessible "Move to day" select */}
          {allDays.length > 1 && onMoveToDay && (
            <MoveToDaySelect
              currentDayId={currentDayId}
              stopId={stop.id}
              days={allDays}
              onMoveToDay={onMoveToDay}
            />
          )}
        </div>
      )}
    </article>
  );
}
