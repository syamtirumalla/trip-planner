import React, { useState, useEffect } from 'react';
import { DaySection } from './DaySection.jsx';
import { DayTabs } from './DayTabs.jsx';
import { EmptyState } from '../EmptyState.jsx';

export function ItineraryView({
  itinerary,
  onRemoveStop,
  onReorderStops,
  onMoveToDay,
  onClearSavedTrip,
  onReset,
}) {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  const [activeDayId, setActiveDayId] = useState(
    itinerary?.days?.[0]?.id || null
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia('(max-width: 767px)');
    const handler = (e) => setIsMobile(e.matches);
    setIsMobile(mql.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  // Sync activeDayId if itinerary days update
  useEffect(() => {
    if (itinerary?.days && itinerary.days.length > 0) {
      const exists = itinerary.days.some((d) => d.id === activeDayId);
      if (!exists) {
        setActiveDayId(itinerary.days[0].id);
      }
    }
  }, [itinerary?.days, activeDayId]);

  if (!itinerary) return null;

  const totalStops = itinerary.days.reduce(
    (acc, day) => acc + (day.stops ? day.stops.length : 0),
    0
  );

  if (totalStops === 0) {
    return <EmptyState type="no-stops" onReset={onReset} />;
  }

  const activeDay =
    itinerary.days.find((d) => d.id === activeDayId) || itinerary.days[0];

  return (
    <div style={{ marginBottom: '32px' }}>
      {/* Itinerary Header */}
      <div
        style={{
          background: 'var(--bg-card)',
          padding: isMobile ? '16px' : '24px',
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
          <div style={{ flex: 1, minWidth: '220px' }}>
            <h1
              style={{
                fontSize: isMobile ? '20px' : '24px',
                fontWeight: '800',
                color: 'var(--text-primary)',
                marginBottom: '6px',
                letterSpacing: '-0.3px',
              }}
            >
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
              color: 'var(--text-secondary)',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
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

        {/* Global Trip Meta: total days, total stops, auto-save status & clear action */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            marginTop: '14px',
            paddingTop: '12px',
            borderTop: '1px solid var(--border-color)',
            fontSize: '13px',
            color: 'var(--text-muted)',
          }}
        >
          <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span>📅 {itinerary.days.length} {itinerary.days.length === 1 ? 'day' : 'days'}</span>
            <span>📍 {totalStops} total stops</span>
            <span
              style={{
                fontSize: '12px',
                color: '#16a34a',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontWeight: '500',
              }}
            >
              ✓ Saved locally
            </span>
          </div>

          {onClearSavedTrip && (
            <button
              type="button"
              onClick={onClearSavedTrip}
              title="Clear saved trip and start over"
              style={{
                minHeight: '36px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: '500',
                background: 'transparent',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                touchAction: 'manipulation',
              }}
            >
              <span>🗑️</span> Clear saved trip
            </button>
          )}
        </div>
      </div>

      {/* Content Rendering: Mobile Tabs (<768px) vs Desktop Stack (>=768px) */}
      {isMobile ? (
        <div>
          <DayTabs
            days={itinerary.days}
            activeDayId={activeDay?.id}
            onSelectDay={setActiveDayId}
          />
          {activeDay && (
            <div
              role="tabpanel"
              id={`tabpanel-${activeDay.id}`}
              aria-labelledby={`tab-${activeDay.id}`}
              tabIndex={0}
              style={{ outline: 'none' }}
            >
              <DaySection
                day={activeDay}
                allDays={itinerary.days}
                onRemoveStop={onRemoveStop}
                onReorderStops={onReorderStops}
                onMoveToDay={onMoveToDay}
              />
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {itinerary.days.map((day) => (
            <DaySection
              key={day.id}
              day={day}
              allDays={itinerary.days}
              onRemoveStop={onRemoveStop}
              onReorderStops={onReorderStops}
              onMoveToDay={onMoveToDay}
            />
          ))}
        </div>
      )}
    </div>
  );
}
