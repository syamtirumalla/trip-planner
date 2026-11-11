import React from 'react';

const TYPE_COLORS = {
  food: '#ea580c',
  sight: '#2563eb',
  activity: '#16a34a',
  transit: '#6b7280',
  rest: '#7c3aed',
};

export function MinimalSuccessView({ itinerary }) {
  if (!itinerary) return null;

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        padding: '24px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-sm)',
        marginBottom: '24px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '6px' }}>
            {itinerary.title}
          </h2>
          {itinerary.summary && (
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
              {itinerary.summary}
            </p>
          )}
        </div>

        {/* AI verification disclaimer pill */}
        <span
          style={{
            fontSize: '11px',
            color: '#64748b',
            background: '#f1f5f9',
            border: '1px solid #e2e8f0',
            padding: '4px 8px',
            borderRadius: '12px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontWeight: '500',
          }}
        >
          <span style={{ fontSize: '12px' }}>✨</span> AI-generated &bull; verify details
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {itinerary.days.map((day, dIdx) => (
          <div
            key={day.id || dIdx}
            style={{
              padding: '16px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600' }}>{day.label}</h3>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Starts: {day.startTime}</span>
            </div>

            <ol style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {day.stops.map((stop, sIdx) => {
                const badgeColor = TYPE_COLORS[stop.type] || '#475569';
                return (
                  <li key={stop.id || sIdx} style={{ fontSize: '14px', lineHeight: '1.4' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <strong>{stop.name}</strong>
                      <span
                        style={{
                          fontSize: '11px',
                          textTransform: 'uppercase',
                          fontWeight: '700',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          backgroundColor: `${badgeColor}15`,
                          color: badgeColor,
                        }}
                      >
                        {stop.type}
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {stop.durationMin} mins
                      </span>
                      {stop.costEstimate && (
                        <span style={{ fontSize: '12px', color: '#15803d', fontWeight: '500' }}>
                          {stop.costEstimate}
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {stop.description}
                    </p>
                    {stop.tip && (
                      <p style={{ fontSize: '12px', color: '#b45309', marginTop: '2px' }}>
                        💡 Tip: {stop.tip}
                      </p>
                    )}
                  </li>
                );
              })}
            </ol>
          </div>
        ))}
      </div>
    </div>
  );
}
