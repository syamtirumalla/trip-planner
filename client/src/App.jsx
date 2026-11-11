import React, { useState } from 'react';
import { useTripPlanner } from './hooks/useTripPlanner.js';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';
import { PromptForm } from './components/PromptForm.jsx';
import { LoadingSkeleton } from './components/LoadingSkeleton.jsx';
import { ErrorAlert } from './components/ErrorAlert.jsx';
import { WarningsBanner } from './components/WarningsBanner.jsx';
import { EmptyState } from './components/EmptyState.jsx';
import { MinimalSuccessView } from './components/MinimalSuccessView.jsx';
import { DevSimulator } from './components/DevSimulator.jsx';

export default function App() {
  const { state, planTrip, cancel, retry, dismissWarnings } = useTripPlanner();
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
            Transform free-form travel ideas into structured, validated day-by-day itineraries.
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
          <MinimalSuccessView itinerary={state.itinerary} />
        )}

        {state.status === 'idle' && <EmptyState type="initial" />}
      </div>
    </ErrorBoundary>
  );
}
