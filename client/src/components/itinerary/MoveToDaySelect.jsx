import React from 'react';

/**
 * Accessible select dropdown allowing keyboard, screen-reader, and touch users to move a stop across days.
 * Ensures minimum 44px touch target on mobile.
 */
export function MoveToDaySelect({ currentDayId, stopId, days = [], onMoveToDay }) {
  const otherDays = days.filter((d) => d.id !== currentDayId);

  if (otherDays.length === 0) return null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '8px',
        fontSize: '13px',
        marginTop: '12px',
        paddingTop: '10px',
        borderTop: '1px dashed var(--border-color)',
      }}
    >
      <label
        htmlFor={`move-select-${stopId}`}
        style={{ color: 'var(--text-muted)', fontWeight: '500' }}
      >
        Move to day:
      </label>
      <select
        id={`move-select-${stopId}`}
        defaultValue=""
        onChange={(e) => {
          const targetDayId = e.target.value;
          if (targetDayId) {
            onMoveToDay(currentDayId, targetDayId, stopId);
            e.target.value = '';
          }
        }}
        style={{
          minHeight: '44px',
          padding: '6px 12px',
          fontSize: '14px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-color)',
          background: 'var(--bg-primary)',
          color: 'var(--text-primary)',
          cursor: 'pointer',
          maxWidth: '100%',
        }}
      >
        <option value="" disabled>
          Select destination day...
        </option>
        {otherDays.map((d) => (
          <option key={d.id} value={d.id}>
            {d.label}
          </option>
        ))}
      </select>
    </div>
  );
}
