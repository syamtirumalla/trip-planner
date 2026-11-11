import React, { useState } from 'react';
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

export default function App() {
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
    reset,
  } = useTripPlanner();

  const [activeSimulation, setActiveSimulation] = useState(null);

  const handlePlanSubmit = (promptText) => {
    planTrip(promptText, activeSimulation);
  };

  return (
    <ErrorBoundary>
      <div style={{ maxWidth: '840px', margin: '0 auto', padding: '32px 20px' }}>
        <header style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ fontSize: '28px' }}>✈️</span>
            <h1 style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.5px' }}>
              AI Trip Planner
            </h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
            Transform free-form travel ideas into structured, interactive day-by-day itineraries.
          </p>
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
            onReset={reset}
          />
        )}

        {state.status === 'idle' && <EmptyState type="initial" />}

        {/* Undo Toasts (6-second countdown) */}
        <ToastContainer
          toasts={toasts}
          onUndo={undoRemoval}
          onDismiss={dismissToast}
        />
      </div>
    </ErrorBoundary>
  );
}
