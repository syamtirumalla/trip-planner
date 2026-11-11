import React, { useState } from 'react';

/**
 * Refinement input form for conversational adjustments to the current itinerary.
 * Supports loading states, keyboard shortcuts, and mobile touch targets.
 */
export function RefineForm({
  onRefine,
  isRefining,
  refineError,
  onDismissError,
  hasPreviousItinerary,
  onUndoRefine,
  lastInstruction,
}) {
  const [instruction, setInstruction] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!instruction.trim() || isRefining) return;
    onRefine(instruction);
    setInstruction('');
  };

  const handleKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <section
      aria-label="Refine trip itinerary"
      style={{
        marginTop: '28px',
        padding: '20px',
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>
          💬 Refine this itinerary
        </h3>

        {/* Undo refinement banner button */}
        {hasPreviousItinerary && (
          <button
            type="button"
            onClick={onUndoRefine}
            disabled={isRefining}
            style={{
              minHeight: '36px',
              padding: '6px 14px',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '12px',
              fontWeight: '600',
              cursor: isRefining ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              touchAction: 'manipulation',
            }}
          >
            <span>↩️</span> Undo refinement
          </button>
        )}
      </div>

      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
        Ask for adjustments like &ldquo;make day 2 more relaxed&rdquo;, &ldquo;swap museum for food market&rdquo;, or &ldquo;budget friendly food&rdquo;.
      </p>

      {lastInstruction && hasPreviousItinerary && (
        <div
          style={{
            fontSize: '12px',
            color: 'var(--text-muted)',
            marginBottom: '12px',
            fontStyle: 'italic',
          }}
        >
          Last refinement applied: &ldquo;{lastInstruction}&rdquo;
        </div>
      )}

      {/* Refine error alert */}
      {refineError && (
        <div
          role="alert"
          aria-live="assertive"
          style={{
            padding: '10px 14px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 'var(--radius-sm)',
            color: '#991b1b',
            fontSize: '13px',
            marginBottom: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
          }}
        >
          <span>{refineError.message || 'Refinement failed. Please try again.'}</span>
          <button
            type="button"
            onClick={onDismissError}
            aria-label="Dismiss refinement error"
            style={{
              background: 'none',
              border: 'none',
              color: '#991b1b',
              cursor: 'pointer',
              fontSize: '16px',
              padding: '2px 6px',
            }}
          >
            &times;
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <input
          type="text"
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isRefining}
          placeholder="e.g. make day 2 more relaxed"
          aria-label="Refinement instruction"
          style={{
            flex: '1 1 240px',
            minHeight: '44px',
            padding: '10px 14px',
            fontSize: '14px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            outline: 'none',
          }}
        />

        <button
          type="submit"
          disabled={isRefining || !instruction.trim()}
          style={{
            minHeight: '44px',
            padding: '10px 20px',
            background: 'var(--primary)',
            color: '#ffffff',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            fontSize: '14px',
            fontWeight: '600',
            cursor: isRefining || !instruction.trim() ? 'not-allowed' : 'pointer',
            opacity: isRefining || !instruction.trim() ? 0.6 : 1,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            touchAction: 'manipulation',
          }}
        >
          {isRefining ? 'Refining...' : 'Refine Trip'}
        </button>
      </form>
    </section>
  );
}

