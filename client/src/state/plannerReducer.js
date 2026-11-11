import { PLANNER_ACTIONS } from './plannerActions.js';
import { recomputeTimes } from '../utils/time.js';

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
      if (action.payload.requestId !== state.activeRequestId) {
        return state;
      }

      // Recompute derived start times for all days upon loading
      const rawItinerary = action.payload.itinerary;
      const itineraryWithDerivedTimes = rawItinerary
        ? {
            ...rawItinerary,
            days: (rawItinerary.days || []).map((day) => recomputeTimes(day)),
          }
        : null;

      return {
        ...state,
        status: 'success',
        itinerary: itineraryWithDerivedTimes,
        warnings: action.payload.warnings || [],
        error: null,
      };
    }

    case PLANNER_ACTIONS.RECEIVE_ERROR: {
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

    case PLANNER_ACTIONS.REMOVE_STOP: {
      if (!state.itinerary) return state;

      const { dayId, stopId } = action.payload;
      const updatedDays = state.itinerary.days.map((day) => {
        if (day.id !== dayId) return day;

        const filteredStops = day.stops.filter((s) => s.id !== stopId);
        return recomputeTimes({
          ...day,
          stops: filteredStops,
        });
      });

      return {
        ...state,
        itinerary: {
          ...state.itinerary,
          days: updatedDays,
        },
      };
    }

    case PLANNER_ACTIONS.RESTORE_STOP: {
      if (!state.itinerary) return state;

      const { dayId, stop, index } = action.payload;
      const updatedDays = state.itinerary.days.map((day) => {
        if (day.id !== dayId) return day;

        const newStops = [...day.stops];
        // Insert back at original index (or end if out of bounds)
        const targetIndex =
          typeof index === 'number' && index >= 0 && index <= newStops.length
            ? index
            : newStops.length;
        newStops.splice(targetIndex, 0, stop);

        return recomputeTimes({
          ...day,
          stops: newStops,
        });
      });

      return {
        ...state,
        itinerary: {
          ...state.itinerary,
          days: updatedDays,
        },
      };
    }

    case PLANNER_ACTIONS.UPDATE_ITINERARY: {
      return {
        ...state,
        itinerary: action.payload.itinerary,
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
