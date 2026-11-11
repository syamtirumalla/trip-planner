import { useReducer, useRef, useCallback } from 'react';
import { plannerReducer, initialPlannerState } from '../state/plannerReducer.js';
import {
  startRequest,
  receiveSuccess,
  receiveError,
  cancelRequest,
  dismissWarnings as dismissWarningsAction,
} from '../state/plannerActions.js';
import { PlanResponseSchema } from '../../../shared/schema.js';
import { generateId } from '../utils/id.js';

export function useTripPlanner() {
  const [state, dispatch] = useReducer(plannerReducer, initialPlannerState);
  const requestIdRef = useRef(0);
  const abortControllerRef = useRef(null);

  /**
   * Dispatches planning request to /api/plan with AbortController and stale response guarding.
   */
  const planTrip = useCallback(async (promptText, simulateHeader = null) => {
    if (!promptText || !promptText.trim()) return;

    // 1. Abort previous in-flight request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    // 2. Increment request ID for stale response protection
    requestIdRef.current += 1;
    const currentRequestId = requestIdRef.current;

    dispatch(startRequest(currentRequestId, promptText.trim()));

    try {
      const headers = { 'Content-Type': 'application/json' };

      // Dev-only simulation header: strictly forbidden and omitted in production
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

      // Check if this request was superseded while awaiting network response
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

      // 3. Re-validate server response on the client using shared Zod schema (Never trust the network)
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

      // 4. Assign trusted client-side IDs (crypto.randomUUID) after validation
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
      // If error was triggered by abort controller, don't show an error state
      if (err.name === 'AbortError' || controller.signal.aborted) {
        return;
      }

      // If request is stale, ignore
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

  return {
    state,
    planTrip,
    cancel,
    retry,
    dismissWarnings,
  };
}
