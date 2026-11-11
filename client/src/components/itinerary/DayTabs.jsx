import React, { useRef } from 'react';
import { getNextTabIndex } from '../../utils/tabs.js';

/**
 * Accessible mobile Day Tabs adhering to WAI-ARIA Tabs pattern.
 * Supports Arrow Left/Right, Home, and End key navigation with roving tabindex.
 */
export function DayTabs({ days = [], activeDayId, onSelectDay }) {
  const tabRefs = useRef(new Map());

  if (!days || days.length <= 1) return null;

  const handleKeyDown = (e, index) => {
    const targetIndex = getNextTabIndex(index, days.length, e.key);

    if (targetIndex !== null) {
      e.preventDefault();
      const targetDay = days[targetIndex];
      onSelectDay(targetDay.id);
      const targetEl = tabRefs.current.get(targetDay.id);
      if (targetEl) {
        targetEl.focus();
      }
    }
  };

  return (
    <div
      style={{
        marginBottom: '16px',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}
    >
      <div
        role="tablist"
        aria-label="Itinerary days"
        style={{
          display: 'flex',
          gap: '8px',
          paddingBottom: '4px',
          minWidth: 'max-content',
        }}
      >
        {days.map((day, idx) => {
          const isSelected = day.id === activeDayId;
          const stopCount = day.stops ? day.stops.length : 0;

          return (
            <button
              key={day.id}
              ref={(el) => {
                if (el) tabRefs.current.set(day.id, el);
                else tabRefs.current.delete(day.id);
              }}
              role="tab"
              id={`tab-${day.id}`}
              aria-selected={isSelected}
              aria-controls={`tabpanel-${day.id}`}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => onSelectDay(day.id)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                minHeight: '44px',
                padding: '8px 16px',
                borderRadius: 'var(--radius-sm)',
                border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                background: isSelected ? 'var(--primary)' : 'var(--bg-card)',
                color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                fontWeight: isSelected ? '700' : '500',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all var(--transition)',
                whiteSpace: 'nowrap',
                touchAction: 'manipulation',
              }}
            >
              <span>{day.label}</span>
              <span
                style={{
                  fontSize: '11px',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  background: isSelected ? 'rgba(255, 255, 255, 0.25)' : 'var(--bg-secondary)',
                  color: isSelected ? '#ffffff' : 'var(--text-muted)',
                  fontWeight: '600',
                }}
              >
                {stopCount} {stopCount === 1 ? 'stop' : 'stops'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
