import React from 'react';

const SIMULATION_OPTIONS = [
  { value: '', label: 'Normal (Live AI call)' },
  { value: 'malformed', label: 'Simulate: Malformed JSON' },
  { value: 'wrong-shape', label: 'Simulate: Wrong Shape (bad schema)' },
  { value: 'empty', label: 'Simulate: Empty Days' },
  { value: 'slow', label: 'Simulate: Upstream Timeout (504)' },
  { value: 'http500', label: 'Simulate: Upstream 500 Failure' },
  { value: 'rate-limit', label: 'Simulate: 429 Rate Limited' },
  { value: 'partial', label: 'Simulate: Partial Salvage (2 good, 2 bad stops)' },
];

export function DevSimulator({ activeSimulation, onSelectSimulation }) {
  // CRITICAL: Strictly never render in production
  if (import.meta.env.PROD) {
    return null;
  }

  return (
    <div
      style={{
        padding: '10px 14px',
        background: '#f8fafc',
        border: '1px dashed #94a3b8',
        borderRadius: 'var(--radius-sm)',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px',
        fontSize: '12px',
        color: '#475569',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span
          style={{
            background: '#e2e8f0',
            padding: '2px 6px',
            borderRadius: '4px',
            fontWeight: '600',
            fontSize: '10px',
            letterSpacing: '0.5px',
          }}
        >
          DEV ONLY
        </span>
        <span>Failure Simulator:</span>
      </div>

      <select
        value={activeSimulation || ''}
        onChange={(e) => onSelectSimulation(e.target.value || null)}
        aria-label="Select failure simulation"
        style={{
          padding: '6px 8px',
          fontSize: '12px',
          minHeight: '44px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid #cbd5e1',
          background: '#ffffff',
          color: '#1e293b',
          cursor: 'pointer',
          maxWidth: '100%',
        }}
      >
        {SIMULATION_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
