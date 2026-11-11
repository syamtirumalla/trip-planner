import React from 'react';

export function WarningsBanner({ warnings, onDismiss }) {
  if (!warnings || warnings.length === 0) return null;

  return (
    <div
      role="status"
      style={{
        padding: '12px 16px',
        background: '#fffbeb',
        border: '1px solid #fef3c7',
        borderRadius: 'var(--radius-md)',
        color: '#92400e',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: '12px',
      }}
    >
      <div style={{ fontSize: '13px' }}>
        <strong style={{ display: 'block', marginBottom: '4px' }}>
          Itinerary Salvaged With Adjustments
        </strong>
        <ul style={{ paddingLeft: '18px', margin: 0 }}>
          {warnings.map((warn, i) => (
            <li key={i}>{warn}</li>
          ))}
        </ul>
      </div>

      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss warnings"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: '#92400e',
          fontSize: '16px',
          fontWeight: 'bold',
          padding: '2px 6px',
        }}
      >
        &times;
      </button>
    </div>
  );
}
