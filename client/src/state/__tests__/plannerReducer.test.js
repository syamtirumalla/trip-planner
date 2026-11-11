import { describe, it, expect } from 'vitest';
import { plannerReducer, initialPlannerState } from '../plannerReducer.js';
import {
  startRequest,
  receiveSuccess,
  receiveError,
  cancelRequest,
  dismissWarnings,
  resetPlanner,
} from '../plannerActions.js';

describe('plannerReducer (Pure State Machine & Stale Response Protection)', () => {
  it('starts in idle status with initial state', () => {
    const state = plannerReducer(undefined, { type: '@@INIT' });
    expect(state.status).toBe('idle');
    expect(state.itinerary).toBeNull();
    expect(state.activeRequestId).toBe(0);
  });

  it('transitions to loading and stores prompt and activeRequestId on START_REQUEST', () => {
    const nextState = plannerReducer(
      initialPlannerState,
      startRequest(1, '3 days in Rome')
    );
    expect(nextState.status).toBe('loading');
    expect(nextState.activeRequestId).toBe(1);
    expect(nextState.prompt).toBe('3 days in Rome');
    expect(nextState.error).toBeNull();
  });

  it('accepts response when requestId matches activeRequestId', () => {
    const loadingState = {
      ...initialPlannerState,
      status: 'loading',
      activeRequestId: 1,
      prompt: '3 days in Rome',
    };

    const mockItinerary = { title: 'Rome Trip', days: [] };
    const successState = plannerReducer(
      loadingState,
      receiveSuccess(1, mockItinerary, ['1 stop omitted'])
    );

    expect(successState.status).toBe('success');
    expect(successState.itinerary).toEqual(mockItinerary);
    expect(successState.warnings).toEqual(['1 stop omitted']);
    expect(successState.error).toBeNull();
  });

  it('CRITICAL: ignores success response when requestId is stale', () => {
    // User triggered request 1, then immediately typed and started request 2
    const stateAfterRequest2 = {
      ...initialPlannerState,
      status: 'loading',
      activeRequestId: 2,
      prompt: '4 days in Kyoto',
    };

    // Stale response from request 1 arrives late
    const state = plannerReducer(
      stateAfterRequest2,
      receiveSuccess(1, { title: 'Old Rome Trip', days: [] }, [])
    );

    // State should remain unchanged in loading for request 2
    expect(state.status).toBe('loading');
    expect(state.activeRequestId).toBe(2);
    expect(state.prompt).toBe('4 days in Kyoto');
    expect(state.itinerary).toBeNull();
  });

  it('CRITICAL: ignores error response when requestId is stale', () => {
    const stateAfterRequest2 = {
      ...initialPlannerState,
      status: 'loading',
      activeRequestId: 2,
      prompt: 'Kyoto',
    };

    // Stale timeout error from request 1 arrives
    const state = plannerReducer(
      stateAfterRequest2,
      receiveError(1, { code: 'TIMEOUT', message: 'Old request timed out' })
    );

    // State should NOT transition to error
    expect(state.status).toBe('loading');
    expect(state.activeRequestId).toBe(2);
    expect(state.error).toBeNull();
  });

  it('cancels an active request and reverts to idle or previous itinerary', () => {
    const loadingState = {
      ...initialPlannerState,
      status: 'loading',
      activeRequestId: 1,
    };

    const cancelledState = plannerReducer(loadingState, cancelRequest(1));
    expect(cancelledState.status).toBe('idle');

    // If an itinerary was previously loaded, reverting retains success
    const loadingWithPrevData = {
      ...initialPlannerState,
      status: 'loading',
      activeRequestId: 2,
      itinerary: { title: 'Existing Trip', days: [] },
    };

    const cancelledWithPrev = plannerReducer(
      loadingWithPrevData,
      cancelRequest(2)
    );
    expect(cancelledWithPrev.status).toBe('success');
    expect(cancelledWithPrev.itinerary.title).toBe('Existing Trip');
  });

  it('dismisses warnings without altering other state', () => {
    const stateWithWarnings = {
      ...initialPlannerState,
      status: 'success',
      warnings: ['Warning 1', 'Warning 2'],
    };

    const clearedState = plannerReducer(stateWithWarnings, dismissWarnings());
    expect(clearedState.warnings).toHaveLength(0);
    expect(clearedState.status).toBe('success');
  });

  it('resets to clean initial state on RESET', () => {
    const modifiedState = {
      status: 'error',
      activeRequestId: 5,
      prompt: 'test',
      itinerary: { title: 'Trip' },
      warnings: ['warn'],
      error: { code: 'TIMEOUT', message: 'err' },
    };

    const resetState = plannerReducer(modifiedState, resetPlanner());
    expect(resetState).toEqual(initialPlannerState);
  });
});
