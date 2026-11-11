import React from 'react';

/**
 * Accessible Dark Mode toggle button.
 * Enforces minimum 44x44px touch target on mobile with clear ARIA labels.
 */
export function ThemeToggle({ theme, onToggle }) {
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        minHeight: '44px',
        minWidth: '44px',
        padding: '8px 12px',
        background: 'var(--bg-card)',
        color: 'var(--text-primary)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-sm)',
        fontSize: '13px',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all var(--transition)',
        touchAction: 'manipulation',
      }}
    >
      <span aria-hidden="true" style={{ fontSize: '16px', lineHeight: 1 }}>
        {isDark ? '☀️' : '🌙'}
      </span>
      <span>{isDark ? 'Light' : 'Dark'}</span>
    </button>
  );
}
