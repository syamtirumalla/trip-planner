import React from 'react';
import { DaySection } from './DaySection.jsx';
import { EmptyState } from '../EmptyState.jsx';

export function ItineraryView({ itinerary, onRemoveStop, onReset }) {
  if (!itinerary) return null;

  // Calculate total stops across all days
  const totalStops = itinerary.days.reduce(
    (acc, day) => acc + (day.stops ? day.stops.length : 0),
    0
  );

  // If user removed every stop across all days, render all-stops-removed empty state
  if (totalStops === 0) {
    return <EmptyState type="no-stops" onReset={onReset} />;
  }

  return (
    <div style={{ marginBottom: '32px' }}>
      {/* Itinerary Header */}
      <div
        style={{
          background: 'var(--bg-card)',
          padding: '24px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-sm)',
          marginBottom: '20px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '10px',
          }}
        >
          <div style={{ flex: 1, minWidth: '240px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '6px' }}>
              {itinerary.title}
            </h1>
            {itinerary.summary && (
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.5' }}>
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
              padding: '4px 10px',
              borderRadius: '12px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontWeight: '500',
              whiteSpace: 'nowrap',
            }}
          >
            <span>✨</span> AI-generated &bull; verify details
          </span>
        </div>

        {/* Global Trip Meta: total days and total stops */}
        <div style={{ display: 'flex', gap: '16px', marginTop: '12px', fontSize: '13px', color: 'var(--text-muted)' }}>
          <span>📅 {itinerary.days.length} {itinerary.days.length === 1 ? 'day' : 'days'}</span>
          <span>📍 {totalStops} total stops</span>
        </div>
      </div>

      {/* Days Stack */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {itinerary.days.map((day) => (
          <DaySection
            key={day.id}
            day={day}
            onRemoveStop={onRemoveStop}
          />
        ))}
      </div>
    </div>
  );
}
