import React from 'react';

export const EXAMPLE_PROMPTS = [
  '4 days in Kyoto in April, love food and temples, mid budget',
  '3 days in Rome, ancient ruins and local cuisine, walk-heavy',
  '5 days in Iceland, waterfalls and ring road, moderate budget',
];

export function ExamplePrompts({ onSelectPrompt, disabled }) {
  return (
    <div style={{ marginTop: '16px' }}>
      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
        Try an example:
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {EXAMPLE_PROMPTS.map((ex, index) => (
          <button
            key={index}
            type="button"
            disabled={disabled}
            onClick={() => onSelectPrompt(ex)}
            style={{
              minHeight: '44px',
              padding: '8px 14px',
              fontSize: '13px',
              background: 'var(--bg-primary)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              cursor: disabled ? 'not-allowed' : 'pointer',
              textAlign: 'left',
              transition: 'all var(--transition)',
              display: 'inline-flex',
              alignItems: 'center',
              touchAction: 'manipulation',
            }}
          >
            &ldquo;{ex}&rdquo;
          </button>
        ))}
      </div>
    </div>
  );
}
