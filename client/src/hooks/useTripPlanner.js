import { useReducer, useRef, useCallback, useState } from 'react';
import { plannerReducer, initialPlannerState } from '../state/plannerReducer.js';
import {
  startRequest,
  receiveSuccess,
  receiveError,
  cancelRequest,
  dismissWarnings as dismissWarningsAction,
  removeStop as removeStopAction,
  restoreStop as restoreStopAction,
  reorderStops as reorderStopsAction,
  moveStopToDay as moveStopToDayAction,
  updateItinerary as updateItineraryAction,
  resetPlanner,
} from '../state/plannerActions.js';
import { PlanResponseSchema } from '../../../shared/schema.js';
import { generateId } from '../utils/id.js';

export function useTripPlanner() {
  const [state, dispatch] = useReducer(plannerReducer, initialPlannerState);
  const [toasts, setToasts] = useState([]);
  const requestIdRef = useRef(0);
  const abortControllerRef = useRef(null);

  /**
   * Dispatches planning request to /api/plan with AbortController and stale response guarding.
   */
  const planTrip = useCallback(async (promptText, simulateHeader = null) => {
    if (!promptText || !promptText.trim()) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    requestIdRef.current += 1;
    const currentRequestId = requestIdRef.current;

    dispatch(startRequest(currentRequestId, promptText.trim()));

    try {
      const headers = { 'Content-Type': 'application/json' };

      if (!import.meta.env.PROD && simulateHeader) {
        headers['x-simulate'] = simulateHeader;
      }

      const res = await fetch('/api/plan', {
        method: 'POST',
        headers,
        body: JSON.stringify({ prompt: promptText.trim() }),
        signal: controller.signal,
      });

      const json = await res.json().catch(() => ({}));

      if (currentRequestId !== requestIdRef.current) {
        return;
      }

      if (!res.ok) {
        dispatch(
          receiveError(currentRequestId, {
            code: json.error?.code || 'UPSTREAM',
            message: json.error?.message || 'Server error occurred while planning trip.',
          })
        );
        return;
      }

      const clientValidation = PlanResponseSchema.safeParse(json);
      if (!clientValidation.success) {
        console.error('[Client Validation Failed]:', clientValidation.error);
        dispatch(
          receiveError(currentRequestId, {
            code: 'WRONG_SHAPE',
            message: 'Client validation failed: server returned invalid itinerary format.',
          })
        );
        return;
      }

      const { itinerary, warnings } = clientValidation.data;

      const assignedItinerary = {
        ...itinerary,
        id: generateId(),
        days: itinerary.days.map((day) => ({
          ...day,
          id: generateId(),
          stops: day.stops.map((stop) => ({
            ...stop,
            id: generateId(),
          })),
        })),
      };

      dispatch(receiveSuccess(currentRequestId, assignedItinerary, warnings));
    } catch (err) {
      if (err.name === 'AbortError' || controller.signal.aborted) {
        return;
      }

      if (currentRequestId !== requestIdRef.current) {
        return;
      }

      dispatch(
        receiveError(currentRequestId, {
          code: 'UPSTREAM',
          message: err.message || 'Unable to connect to the trip planning server.',
        })
      );
    }
  }, []);

  /**
   * Cancels the current in-flight request.
   */
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    dispatch(cancelRequest(requestIdRef.current));
  }, []);

  /**
   * Retries the last submitted prompt.
   */
  const retry = useCallback(() => {
    if (state.prompt) {
      planTrip(state.prompt);
    }
  }, [planTrip, state.prompt]);

  /**
   * Dismisses warnings notice.
   */
  const dismissWarnings = useCallback(() => {
    dispatch(dismissWarningsAction());
  }, []);

  /**
   * Removes a stop and creates a 6-second undo toast.
   * Defensively accepts either (dayId, stopId) or just (stopId).
   */
  const removeStopWithUndo = useCallback(
    (dayIdOrStopId, maybeStopId) => {
      if (!state.itinerary) return;

      let dayId = dayIdOrStopId;
      let stopId = maybeStopId;

      // If only stopId was provided, automatically find its dayId
      if (!maybeStopId) {
        stopId = dayIdOrStopId;
        const foundDay = state.itinerary.days.find((d) =>
          d.stops.some((s) => s.id === stopId)
        );
        if (!foundDay) return;
        dayId = foundDay.id;
      }

      const day = state.itinerary.days.find((d) => d.id === dayId);
      if (!day) return;

      const stopIndex = day.stops.findIndex((s) => s.id === stopId);
      if (stopIndex === -1) return;

      const removedStop = day.stops[stopIndex];

      dispatch(removeStopAction(dayId, stopId));

      const toastId = generateId();
      const newToast = {
        id: toastId,
        stopName: removedStop.name,
        dayId,
        stop: removedStop,
        index: stopIndex,
      };

      setToasts((prev) => [newToast, ...prev]);
    },
    [state.itinerary]
  );

  /**
   * Undoes a stop removal and dismisses its toast.
   */
  const undoRemoval = useCallback((toast) => {
    dispatch(restoreStopAction(toast.dayId, toast.stop, toast.index));
    setToasts((prev) => prev.filter((t) => t.id !== toast.id));
  }, []);

  /**
   * Dismisses an individual toast.
   */
  const dismissToast = useCallback((toastId) => {
    setToasts((prev) => prev.filter((t) => t.id !== toastId));
  }, []);

  /**
   * Reorders stops within a single day.
   */
  const reorderStops = useCallback((dayId, activeStopId, overStopId) => {
    dispatch(reorderStopsAction(dayId, activeStopId, overStopId));
  }, []);

  /**
   * Moves a stop from one day to another.
   */
  const moveStopToDay = useCallback((fromDayId, toDayId, stopId) => {
    dispatch(moveStopToDayAction(fromDayId, toDayId, stopId));
  }, []);

  /**
   * Updates itinerary.
   */
  const updateItinerary = useCallback((newItinerary) => {
    dispatch(updateItineraryAction(newItinerary));
  }, []);

  /**
   * Resets planner to clean initial state.
   */
  const reset = useCallback(() => {
    dispatch(resetPlanner());
    setToasts([]);
  }, []);

  return {
    state,
    toasts,
    planTrip,
    cancel,
    retry,
    dismissWarnings,
    removeStop: removeStopWithUndo,
    undoRemoval,
    dismissToast,
    reorderStops,
    moveStopToDay,
    updateItinerary,
    reset,
  };
}
