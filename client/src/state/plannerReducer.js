import { PLANNER_ACTIONS } from './plannerActions.js';

export const initialPlannerState = {
  status: 'idle', // 'idle' | 'loading' | 'error' | 'success'
  activeRequestId: 0,
  prompt: '',
  itinerary: null,
  warnings: [],
  error: null, // { code: string, message: string }
};

/**
 * Pure state machine reducer for the trip planner.
 * Enforces strict requestId matching to discard stale network responses.
 *
 * @param {typeof initialPlannerState} state
 * @param {{ type: string, payload?: any }} action
 * @returns {typeof initialPlannerState}
 */
export function plannerReducer(state = initialPlannerState, action) {
  switch (action.type) {
    case PLANNER_ACTIONS.START_REQUEST: {
      return {
        ...state,
        status: 'loading',
        activeRequestId: action.payload.requestId,
        prompt: action.payload.prompt,
        error: null,
        warnings: [],
      };
    }

    case PLANNER_ACTIONS.RECEIVE_SUCCESS: {
      // Stale-response protection: ignore any response that doesn't match active request
      if (action.payload.requestId !== state.activeRequestId) {
        return state;
      }
      return {
        ...state,
        status: 'success',
        itinerary: action.payload.itinerary,
        warnings: action.payload.warnings || [],
        error: null,
      };
    }

    case PLANNER_ACTIONS.RECEIVE_ERROR: {
      // Stale-response protection: ignore errors from older/cancelled requests
      if (action.payload.requestId !== state.activeRequestId) {
        return state;
      }
      return {
        ...state,
        status: 'error',
        error: action.payload.error,
      };
    }

    case PLANNER_ACTIONS.CANCEL_REQUEST: {
      if (action.payload.requestId !== state.activeRequestId) {
        return state;
      }
      return {
        ...state,
        // Revert to existing itinerary if one was already loaded, else idle
        status: state.itinerary ? 'success' : 'idle',
        error: null,
      };
    }

    case PLANNER_ACTIONS.DISMISS_WARNINGS: {
      return {
        ...state,
        warnings: [],
      };
    }

    case PLANNER_ACTIONS.RESET: {
      return {
        ...initialPlannerState,
      };
    }

    default:
      return state;
  }
}
