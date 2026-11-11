import React, { useState, useEffect } from 'react';
import { useTripPlanner } from './hooks/useTripPlanner.js';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';
import { PromptForm } from './components/PromptForm.jsx';
import { LoadingSkeleton } from './components/LoadingSkeleton.jsx';
import { ErrorAlert } from './components/ErrorAlert.jsx';
import { WarningsBanner } from './components/WarningsBanner.jsx';
import { EmptyState } from './components/EmptyState.jsx';
import { ItineraryView } from './components/itinerary/ItineraryView.jsx';
import { DevSimulator } from './components/DevSimulator.jsx';
import { ToastContainer } from './components/Toast.jsx';
import { useTheme } from './hooks/useTheme.js';
import { ThemeToggle } from './components/ThemeToggle.jsx';

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const {
    state,
    toasts,
    planTrip,
    cancel,
    retry,
    dismissWarnings,
    removeStop,
    undoRemoval,
    dismissToast,
    reorderStops,
    moveStopToDay,
    clearSavedTrip,
    reset,
  } = useTripPlanner();

  const [activeSimulation, setActiveSimulation] = useState(null);
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

  const handlePlanSubmit = (promptText) => {
    planTrip(promptText, activeSimulation);
  };

  return (
    <ErrorBoundary>
      <div
        style={{
          maxWidth: '840px',
          margin: '0 auto',
          padding: isMobile ? '20px 14px' : '32px 20px',
          paddingBottom: isMobile
            ? toasts.length > 0
              ? 'calc(160px + env(safe-area-inset-bottom, 12px))'
              : '48px'
            : '64px',
          minHeight: '100vh',
        }}
      >
        <header
          style={{
            marginBottom: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ flex: 1, minWidth: '220px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ fontSize: isMobile ? '24px' : '28px' }} aria-hidden="true">
                ✈️
              </span>
              <h1
                style={{
                  fontSize: isMobile ? '22px' : '28px',
                  fontWeight: '800',
                  letterSpacing: '-0.5px',
                  color: 'var(--text-primary)',
                }}
              >
                AI Trip Planner
              </h1>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
              Transform free-form travel ideas into structured, interactive day-by-day itineraries.
            </p>
          </div>

          <ThemeToggle theme={theme} onToggle={toggleTheme} />
        </header>

        {/* Development-only failure simulation panel (strictly hidden in production) */}
        <DevSimulator
          activeSimulation={activeSimulation}
          onSelectSimulation={setActiveSimulation}
        />

        {/* User Prompt Input Form */}
        <PromptForm
          onSubmit={handlePlanSubmit}
          onCancel={cancel}
          status={state.status}
        />

        {/* Dismissible Salvage Warnings */}
        <WarningsBanner
          warnings={state.warnings}
          onDismiss={dismissWarnings}
        />

        {/* State-driven view rendering */}
        {state.status === 'loading' && <LoadingSkeleton />}

        {state.status === 'error' && (
          <ErrorAlert error={state.error} onRetry={retry} />
        )}

        {state.status === 'success' && state.itinerary && (
          <ItineraryView
            itinerary={state.itinerary}
            onRemoveStop={removeStop}
            onReorderStops={reorderStops}
            onMoveToDay={moveStopToDay}
            onClearSavedTrip={clearSavedTrip}
            onReset={reset}
          />
        )}

        {state.status === 'idle' && <EmptyState type="initial" />}

        {/* Undo Toasts (docked to bottom full-width on mobile, max 3 visible) */}
        <ToastContainer
          toasts={toasts}
          onUndo={undoRemoval}
          onDismiss={dismissToast}
        />
      </div>
    </ErrorBoundary>
  );
}
