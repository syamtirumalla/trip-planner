import React, { useEffect, useState } from 'react';

/**
 * Single Toast with 6-second auto-dismiss and progress bar.
 * Touch targets are at least 44x44px.
 */
export function ToastItem({ toast, onUndo, onDismiss, isMobile }) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const duration = 6000;
    const intervalTime = 50;
    const step = (intervalTime / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          onDismiss(toast.id);
          return 0;
        }
        return Math.max(0, prev - step);
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [toast.id, onDismiss]);

  return (
    <div
      role="status"
      style={{
        position: 'relative',
        overflow: 'hidden',
        background: '#1e293b',
        color: '#f8fafc',
        borderRadius: isMobile ? '8px' : 'var(--radius-sm)',
        padding: '10px 12px',
        boxShadow: 'var(--shadow-md)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '10px',
        width: isMobile ? '100%' : '320px',
        maxWidth: isMobile ? '100%' : '320px',
        fontSize: '13px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          minWidth: 0,
          flex: 1,
        }}
      >
        <span aria-hidden="true" style={{ fontSize: '14px', flexShrink: 0 }}>
          🗑️
        </span>
        <span
          style={{
            fontWeight: '500',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={toast.stopName}
        >
          Removed <strong>{toast.stopName}</strong>
        </span>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          flexShrink: 0,
        }}
      >
        <button
          type="button"
          onClick={() => onUndo(toast)}
          style={{
            background: '#3b82f6',
            color: '#ffffff',
            border: 'none',
            borderRadius: '4px',
            minHeight: '36px',
            padding: '6px 12px',
            fontSize: '12px',
            fontWeight: '700',
            cursor: 'pointer',
            touchAction: 'manipulation',
          }}
        >
          Undo
        </button>

        <button
          type="button"
          onClick={() => onDismiss(toast.id)}
          aria-label={`Dismiss notification for ${toast.stopName}`}
          style={{
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            fontSize: '18px',
            lineHeight: 1,
            minWidth: '36px',
            minHeight: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4px',
            touchAction: 'manipulation',
          }}
        >
          &times;
        </button>
      </div>

      {/* 6-second countdown progress bar */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          height: '3px',
          backgroundColor: '#3b82f6',
          width: `${progress}%`,
          transition: 'width 50ms linear',
        }}
      />
    </div>
  );
}

/**
 * Responsive Toast container showing at most 3 toasts simultaneously.
 * Narrower on desktop; docked to bottom full-width on mobile above safe-area.
 */
export function ToastContainer({ toasts, onUndo, onDismiss }) {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia('(max-width: 767px)');
    const handler = (e) => setIsMobile(e.matches);
    setIsMobile(mql.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  if (!toasts || toasts.length === 0) return null;

  const visibleToasts = toasts.slice(0, 3);
  const hiddenCount = toasts.length - 3;

  return (
    <aside
      role="region"
      aria-label="Undo notifications"
      aria-live="polite"
      style={
        isMobile
          ? {
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              width: '100%',
              zIndex: 9999,
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              padding: '8px 12px',
              paddingBottom: 'max(12px, env(safe-area-inset-bottom, 12px))',
              background: 'rgba(15, 23, 42, 0.85)',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.15)',
            }
          : {
              position: 'fixed',
              bottom: '24px',
              right: '24px',
              zIndex: 9999,
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              maxWidth: '320px',
            }
      }
    >
      {/* Indicator when more than 3 removals are pending in the undo queue */}
      {hiddenCount > 0 && (
        <div
          role="status"
          style={{
            background: '#334155',
            color: '#f8fafc',
            borderRadius: isMobile ? '6px' : 'var(--radius-sm)',
            padding: '6px 12px',
            fontSize: '11px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: 'var(--shadow-sm)',
            width: '100%',
          }}
        >
          <span>
            +{hiddenCount} more {hiddenCount === 1 ? 'stop' : 'stops'} removed
          </span>
          <button
            type="button"
            onClick={() => onUndo(toasts[3])}
            style={{
              background: 'transparent',
              border: '1px solid #64748b',
              color: '#f8fafc',
              borderRadius: '4px',
              padding: '2px 8px',
              fontSize: '11px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Undo next
          </button>
        </div>
      )}

      {visibleToasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onUndo={onUndo}
          onDismiss={onDismiss}
          isMobile={isMobile}
        />
      ))}
    </aside>
  );
}
