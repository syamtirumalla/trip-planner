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

  it('removes a stop and dynamically recomputes remaining stop start times', () => {
    const initialStateWithStops = {
      ...initialPlannerState,
      status: 'success',
      itinerary: {
        title: 'Rome',
        days: [
          {
            id: 'day-1',
            label: 'Day 1',
            startTime: '09:00',
            stops: [
              { id: 'stop-1', name: 'Colosseum', durationMin: 60, startTime: '09:00' },
              { id: 'stop-2', name: 'Forum', durationMin: 90, startTime: '10:00' },
              { id: 'stop-3', name: 'Pantheon', durationMin: 45, startTime: '11:30' },
            ],
          },
        ],
      },
    };

    // Remove stop-2 (Forum, 90m)
    const state = plannerReducer(
      initialStateWithStops,
      { type: 'REMOVE_STOP', payload: { dayId: 'day-1', stopId: 'stop-2' } }
    );

    const remainingStops = state.itinerary.days[0].stops;
    expect(remainingStops).toHaveLength(2);
    expect(remainingStops[0].name).toBe('Colosseum');
    expect(remainingStops[0].startTime).toBe('09:00');

    // Pantheon was previously 11:30, now starts at 10:00 (09:00 + 60m Colosseum)
    expect(remainingStops[1].name).toBe('Pantheon');
    expect(remainingStops[1].startTime).toBe('10:00');
  });

  it('restores a stop at its original position and recomputes times', () => {
    const stateAfterRemoval = {
      ...initialPlannerState,
      status: 'success',
      itinerary: {
        title: 'Rome',
        days: [
          {
            id: 'day-1',
            label: 'Day 1',
            startTime: '09:00',
            stops: [
              { id: 'stop-1', name: 'Colosseum', durationMin: 60, startTime: '09:00' },
              { id: 'stop-3', name: 'Pantheon', durationMin: 45, startTime: '10:00' },
            ],
          },
        ],
      },
    };

    // Restore stop-2 at index 1
    const restoredStop = { id: 'stop-2', name: 'Forum', durationMin: 90 };
    const state = plannerReducer(
      stateAfterRemoval,
      { type: 'RESTORE_STOP', payload: { dayId: 'day-1', stop: restoredStop, index: 1 } }
    );

    const stops = state.itinerary.days[0].stops;
    expect(stops).toHaveLength(3);
    expect(stops[1].name).toBe('Forum');
    expect(stops[1].startTime).toBe('10:00');
    expect(stops[2].name).toBe('Pantheon');
    expect(stops[2].startTime).toBe('11:30');
  });

  it('reorders stops within a day and updates derived start times', () => {
    const initialState = {
      ...initialPlannerState,
      status: 'success',
      itinerary: {
        title: 'Kyoto',
        days: [
          {
            id: 'day-1',
            label: 'Day 1',
            startTime: '09:00',
            stops: [
              { id: 'stop-a', name: 'Stop A', durationMin: 60, startTime: '09:00' }, // 09:00 - 10:00
              { id: 'stop-b', name: 'Stop B', durationMin: 30, startTime: '10:00' }, // 10:00 - 10:30
              { id: 'stop-c', name: 'Stop C', durationMin: 45, startTime: '10:30' }, // 10:30 - 11:15
            ],
          },
        ],
      },
    };

    // Move Stop C (45m) to the top (over Stop A)
    const state = plannerReducer(initialState, {
      type: 'REORDER_STOPS',
      payload: { dayId: 'day-1', activeStopId: 'stop-c', overStopId: 'stop-a' },
    });

    const stops = state.itinerary.days[0].stops;
    expect(stops).toHaveLength(3);
    expect(stops[0].name).toBe('Stop C');
    expect(stops[0].startTime).toBe('09:00'); // Starts at 09:00
    expect(stops[0].endTime).toBe('09:45');

    expect(stops[1].name).toBe('Stop A');
    expect(stops[1].startTime).toBe('09:45'); // Starts after Stop C
    expect(stops[1].endTime).toBe('10:45');

    expect(stops[2].name).toBe('Stop B');
    expect(stops[2].startTime).toBe('10:45'); // Starts after Stop A
    expect(stops[2].endTime).toBe('11:15');
  });

  it('moves a stop between days and recomputes times for both days', () => {
    const initialState = {
      ...initialPlannerState,
      status: 'success',
      itinerary: {
        title: 'Trip',
        days: [
          {
            id: 'day-1',
            startTime: '09:00',
            stops: [
              { id: 's1', name: 'Stop 1', durationMin: 60 },
              { id: 's2', name: 'Stop 2 (To Move)', durationMin: 90 },
            ],
          },
          {
            id: 'day-2',
            startTime: '10:00',
            stops: [
              { id: 's3', name: 'Stop 3', durationMin: 60 },
            ],
          },
        ],
      },
    };

    const state = plannerReducer(initialState, {
      type: 'MOVE_STOP_TO_DAY',
      payload: { fromDayId: 'day-1', toDayId: 'day-2', stopId: 's2' },
    });

    const day1 = state.itinerary.days[0];
    const day2 = state.itinerary.days[1];

    // Day 1 has only s1 left
    expect(day1.stops).toHaveLength(1);
    expect(day1.stops[0].id).toBe('s1');
    expect(day1.totalDurationMin).toBe(60);

    // Day 2 has s3 and s2
    expect(day2.stops).toHaveLength(2);
    expect(day2.stops[0].id).toBe('s3');
    expect(day2.stops[0].startTime).toBe('10:00');
    expect(day2.stops[1].id).toBe('s2');
    expect(day2.stops[1].startTime).toBe('11:00'); // 10:00 + 60m of s3
    expect(day2.totalDurationMin).toBe(150); // 60 + 90
  });

  it('REGRESSION: correctly removes and restores a stop after REORDER_STOPS with accurate index and recomputed times', () => {
    const initialState = {
      ...initialPlannerState,
      status: 'success',
      itinerary: {
        title: 'Trip',
        days: [
          {
            id: 'day-1',
            startTime: '09:00',
            stops: [
              { id: 's1', name: 'Stop 1', durationMin: 60, startTime: '09:00' },
              { id: 's2', name: 'Stop 2', durationMin: 30, startTime: '10:00' },
              { id: 's3', name: 'Stop 3', durationMin: 45, startTime: '10:30' },
            ],
          },
        ],
      },
    };

    // Step 1: Reorder s3 to the top (over s1) -> [s3, s1, s2]
    const stateAfterReorder = plannerReducer(initialState, {
      type: 'REORDER_STOPS',
      payload: { dayId: 'day-1', activeStopId: 's3', overStopId: 's1' },
    });

    const dayAfterReorder = stateAfterReorder.itinerary.days[0];
    expect(dayAfterReorder.stops.map((s) => s.id)).toEqual(['s3', 's1', 's2']);

    // Step 2: Remove s1 (which is at index 1 after reorder)
    const removedIndex = dayAfterReorder.stops.findIndex((s) => s.id === 's1');
    expect(removedIndex).toBe(1);
    const removedStop = dayAfterReorder.stops[removedIndex];

    const stateAfterRemove = plannerReducer(stateAfterReorder, {
      type: 'REMOVE_STOP',
      payload: { dayId: 'day-1', stopId: 's1' },
    });

    const dayAfterRemove = stateAfterRemove.itinerary.days[0];
    expect(dayAfterRemove.stops.map((s) => s.id)).toEqual(['s3', 's2']);
    expect(dayAfterRemove.stops[0].startTime).toBe('09:00');
    expect(dayAfterRemove.stops[1].startTime).toBe('09:45'); // 09:00 + 45m of s3

    // Step 3: Undo removal restoring s1 at its previous index (1)
    const stateAfterUndo = plannerReducer(stateAfterRemove, {
      type: 'RESTORE_STOP',
      payload: { dayId: 'day-1', stop: removedStop, index: removedIndex },
    });

    const dayAfterUndo = stateAfterUndo.itinerary.days[0];
    expect(dayAfterUndo.stops.map((s) => s.id)).toEqual(['s3', 's1', 's2']);
    expect(dayAfterUndo.stops[0].startTime).toBe('09:00');
    expect(dayAfterUndo.stops[1].startTime).toBe('09:45'); // 09:00 + 45m
    expect(dayAfterUndo.stops[2].startTime).toBe('10:45'); // 09:45 + 60m
  });

  it('REGRESSION: correctly removes and restores a stop after MOVE_STOP_TO_DAY with accurate index and recomputed times', () => {
    const initialState = {
      ...initialPlannerState,
      status: 'success',
      itinerary: {
        title: 'Trip',
        days: [
          {
            id: 'day-1',
            startTime: '09:00',
            stops: [
              { id: 's1', name: 'Stop 1', durationMin: 60 },
              { id: 's2', name: 'Stop 2 (To Move)', durationMin: 45 },
            ],
          },
          {
            id: 'day-2',
            startTime: '10:00',
            stops: [
              { id: 's3', name: 'Stop 3', durationMin: 30 },
            ],
          },
        ],
      },
    };

    // Step 1: Move s2 from day-1 to day-2 -> day-2 has [s3, s2]
    const stateAfterMove = plannerReducer(initialState, {
      type: 'MOVE_STOP_TO_DAY',
      payload: { fromDayId: 'day-1', toDayId: 'day-2', stopId: 's2' },
    });

    const day2AfterMove = stateAfterMove.itinerary.days[1];
    expect(day2AfterMove.stops.map((s) => s.id)).toEqual(['s3', 's2']);
    expect(day2AfterMove.stops[1].startTime).toBe('10:30');

    // Step 2: Remove s2 from day-2
    const targetIndex = day2AfterMove.stops.findIndex((s) => s.id === 's2');
    expect(targetIndex).toBe(1);
    const removedStop = day2AfterMove.stops[targetIndex];

    const stateAfterRemove = plannerReducer(stateAfterMove, {
      type: 'REMOVE_STOP',
      payload: { dayId: 'day-2', stopId: 's2' },
    });

    const day2AfterRemove = stateAfterRemove.itinerary.days[1];
    expect(day2AfterRemove.stops.map((s) => s.id)).toEqual(['s3']);

    // Step 3: Undo removal restoring s2 into day-2 at index 1
    const stateAfterUndo = plannerReducer(stateAfterRemove, {
      type: 'RESTORE_STOP',
      payload: { dayId: 'day-2', stop: removedStop, index: targetIndex },
    });

    const day2AfterUndo = stateAfterUndo.itinerary.days[1];
    expect(day2AfterUndo.stops.map((s) => s.id)).toEqual(['s3', 's2']);
    expect(day2AfterUndo.stops[0].startTime).toBe('10:00');
    expect(day2AfterUndo.stops[1].startTime).toBe('10:30');
    expect(day2AfterUndo.totalDurationMin).toBe(75);
  });

  describe('Refinement State Transitions & Stale Guarding', () => {
    const baseItinerary = {
      title: 'Rome Trip',
      days: [
        {
          id: 'day-1',
          startTime: '09:00',
          stops: [{ id: 's1', name: 'Colosseum', durationMin: 60, startTime: '09:00' }],
        },
      ],
    };

    it('sets isRefining to true and tracks instruction on START_REFINE', () => {
      const state = plannerReducer(
        { ...initialPlannerState, status: 'success', itinerary: baseItinerary, activeRequestId: 1 },
        { type: 'START_REFINE', payload: { requestId: 2, instruction: 'make day 1 lighter' } }
      );

      expect(state.isRefining).toBe(true);
      expect(state.activeRequestId).toBe(2);
      expect(state.lastRefinementInstruction).toBe('make day 1 lighter');
      expect(state.refineError).toBeNull();
    });

    it('stores previousItinerary for undo and applies refined itinerary on RECEIVE_REFINE_SUCCESS', () => {
      const refiningState = {
        ...initialPlannerState,
        status: 'success',
        itinerary: baseItinerary,
        activeRequestId: 2,
        isRefining: true,
        lastRefinementInstruction: 'make day 1 lighter',
      };

      const refinedItinerary = {
        title: 'Rome Trip (Light)',
        days: [
          {
            id: 'day-1',
            startTime: '10:00',
            stops: [{ id: 's1', name: 'Colosseum', durationMin: 45 }],
          },
        ],
      };

      const nextState = plannerReducer(refiningState, {
        type: 'RECEIVE_REFINE_SUCCESS',
        payload: { requestId: 2, itinerary: refinedItinerary, warnings: [] },
      });

      expect(nextState.isRefining).toBe(false);
      expect(nextState.previousItinerary).toEqual(baseItinerary);
      expect(nextState.itinerary.title).toBe('Rome Trip (Light)');
      expect(nextState.itinerary.days[0].stops[0].startTime).toBe('10:00');
    });

    it('CRITICAL: ignores stale refinement response when requestId does not match', () => {
      const state = {
        ...initialPlannerState,
        status: 'success',
        itinerary: baseItinerary,
        activeRequestId: 5,
        isRefining: true,
      };

      const staleResponse = plannerReducer(state, {
        type: 'RECEIVE_REFINE_SUCCESS',
        payload: { requestId: 4, itinerary: { title: 'Old Refined' } },
      });

      expect(staleResponse.itinerary).toEqual(baseItinerary);
      expect(staleResponse.previousItinerary).toBeNull();
    });

    it('restores previousItinerary on UNDO_REFINEMENT', () => {
      const refinedState = {
        ...initialPlannerState,
        status: 'success',
        itinerary: { title: 'Refined Trip' },
        previousItinerary: baseItinerary,
        lastRefinementInstruction: 'make day 1 lighter',
      };

      const stateAfterUndo = plannerReducer(refinedState, { type: 'UNDO_REFINEMENT' });
      expect(stateAfterUndo.itinerary).toEqual(baseItinerary);
      expect(stateAfterUndo.previousItinerary).toBeNull();
      expect(stateAfterUndo.lastRefinementInstruction).toBe('');
    });
  });
});
