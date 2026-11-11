import React from 'react';

export function EmptyState({ type = 'initial', onReset }) {
  if (type === 'no-stops') {
    return (
      <div
        role="status"
        aria-live="polite"
        style={{
          textAlign: 'center',
          padding: '40px 20px',
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-md)',
          border: '1px dashed var(--border-color)',
          color: 'var(--text-secondary)',
        }}
      >
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px', color: 'var(--text-primary)' }}>
          All stops have been removed
        </h3>
        <p style={{ fontSize: '13px', marginBottom: '16px', color: 'var(--text-secondary)' }}>
          You removed every stop from this trip. You can plan another trip above or restore an itinerary.
        </p>
        {onReset && (
          <button
            type="button"
            onClick={onReset}
            style={{
              minHeight: '44px',
              padding: '10px 18px',
              background: 'var(--primary)',
              color: '#ffffff',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              touchAction: 'manipulation',
            }}
          >
            Start New Plan
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        textAlign: 'center',
        padding: '48px 20px',
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-color)',
        color: 'var(--text-secondary)',
      }}
    >
      <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: 'var(--text-primary)' }}>
        Your personal itinerary will appear here
      </h3>
      <p style={{ fontSize: '14px', maxWidth: '460px', margin: '0 auto 12px auto' }}>
        Type a free-form trip description above (duration, destination, preferences, budget) to generate a day-by-day plan.
      </p>
    </div>
  );
}
