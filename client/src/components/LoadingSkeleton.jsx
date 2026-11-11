import React from 'react';

export function LoadingSkeleton() {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        background: 'var(--bg-card)',
        padding: '24px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-sm)',
        marginBottom: '24px',
      }}
    >
      <span className="sr-only" style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden' }}>
        Creating your tailored itinerary with AI, please wait...
      </span>

      {/* Header skeleton */}
      <div style={{ marginBottom: '20px' }}>
        <div
          style={{
            height: '24px',
            width: '60%',
            backgroundColor: '#e2e8f0',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '10px',
            animation: 'pulse 1.5s infinite ease-in-out',
          }}
        />
        <div
          style={{
            height: '14px',
            width: '85%',
            backgroundColor: '#e2e8f0',
            borderRadius: 'var(--radius-sm)',
            animation: 'pulse 1.5s infinite ease-in-out',
          }}
        />
      </div>

      {/* Days skeleton */}
      {[1, 2].map((dayIdx) => (
        <div
          key={dayIdx}
          style={{
            marginBottom: '16px',
            padding: '16px',
            borderRadius: 'var(--radius-sm)',
            border: '1px dashed var(--border-color)',
          }}
        >
          <div
            style={{
              height: '18px',
              width: '40%',
              backgroundColor: '#e2e8f0',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '12px',
              animation: 'pulse 1.5s infinite ease-in-out',
            }}
          />

          {[1, 2].map((stopIdx) => (
            <div
              key={stopIdx}
              style={{
                height: '52px',
                width: '100%',
                backgroundColor: '#f1f5f9',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '8px',
                animation: 'pulse 1.5s infinite ease-in-out',
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
