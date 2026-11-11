import React, { useEffect, useState } from 'react';

/**
 * Single Toast with 6-second auto-dismiss and progress bar
 */
export function ToastItem({ toast, onUndo, onDismiss }) {
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
        borderRadius: 'var(--radius-sm)',
        padding: '12px 16px',
        boxShadow: 'var(--shadow-md)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        minWidth: '280px',
        maxWidth: '420px',
        fontSize: '13px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span>🗑️</span>
        <span style={{ fontWeight: '500' }}>
          Removed <strong>{toast.stopName}</strong>
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          type="button"
          onClick={() => onUndo(toast)}
          style={{
            background: '#3b82f6',
            color: '#ffffff',
            border: 'none',
            borderRadius: '4px',
            padding: '4px 10px',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          Undo
        </button>

        <button
          type="button"
          onClick={() => onDismiss(toast.id)}
          aria-label="Dismiss toast"
          style={{
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            fontSize: '16px',
            lineHeight: 1,
            padding: '2px',
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
 * Fixed container for active toasts
 */
export function ToastContainer({ toasts, onUndo, onDismiss }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <aside
      aria-label="Notifications"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onUndo={onUndo}
          onDismiss={onDismiss}
        />
      ))}
    </aside>
  );
}
