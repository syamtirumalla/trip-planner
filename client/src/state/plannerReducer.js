import { PLANNER_ACTIONS } from './plannerActions.js';
import { recomputeTimes } from '../utils/time.js';

export const initialPlannerState = {
  status: 'idle', // 'idle' | 'loading' | 'error' | 'success'
  activeRequestId: 0,
  prompt: '',
  itinerary: null,
  previousItinerary: null, // For Undo refinement
  lastRefinementInstruction: '',
  isRefining: false,
  refineError: null,
  warnings: [],
  error: null, // { code: string, message: string }
};

/**
 * Pure array move helper.
 */
function arrayMove(array, from, to) {
  const next = [...array];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

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

      // Note on timing model: gapBeforeMin stays attached to the stop object itself.
      // Restoring a removed stop restores its original gapBeforeMin, and recomputeTimes
      // recalculates downstream start/end times sequentially.
      const { dayId, stop, index } = action.payload;
      const updatedDays = state.itinerary.days.map((day) => {
        if (day.id !== dayId) return day;

        const newStops = [...day.stops];
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

    case PLANNER_ACTIONS.REORDER_STOPS: {
      if (!state.itinerary) return state;

      // Design decision: gapBeforeMin stays attached to the stop (moves with it),
      // rather than anchoring to the index slot. A gap typically represents free time
      // or preparation preceding that specific event (e.g. relaxing before dinner).
      const { dayId, activeStopId, overStopId } = action.payload;
      if (activeStopId === overStopId) return state;

      const updatedDays = state.itinerary.days.map((day) => {
        if (day.id !== dayId) return day;

        const oldIndex = day.stops.findIndex((s) => s.id === activeStopId);
        const newIndex = day.stops.findIndex((s) => s.id === overStopId);

        if (oldIndex === -1 || newIndex === -1) return day;

        const reorderedStops = arrayMove(day.stops, oldIndex, newIndex);
        return recomputeTimes({
          ...day,
          stops: reorderedStops,
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

    case PLANNER_ACTIONS.MOVE_STOP_TO_DAY: {
      if (!state.itinerary) return state;

      // Design decision: moving a stop to another day retains the stop's gapBeforeMin,
      // and recomputeTimes recalculates start times in both origin and destination days.
      const { fromDayId, toDayId, stopId } = action.payload;
      if (fromDayId === toDayId) return state;

      const fromDay = state.itinerary.days.find((d) => d.id === fromDayId);
      const toDay = state.itinerary.days.find((d) => d.id === toDayId);

      if (!fromDay || !toDay) return state;

      const stopToMove = fromDay.stops.find((s) => s.id === stopId);
      if (!stopToMove) return state;

      const updatedDays = state.itinerary.days.map((day) => {
        if (day.id === fromDayId) {
          return recomputeTimes({
            ...day,
            stops: day.stops.filter((s) => s.id !== stopId),
          });
        }
        if (day.id === toDayId) {
          return recomputeTimes({
            ...day,
            stops: [...day.stops, stopToMove],
          });
        }
        return day;
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

    case PLANNER_ACTIONS.RESTORE_SAVED_TRIP: {
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
        prompt: action.payload.prompt || '',
        warnings: [],
        error: null,
      };
    }

    case PLANNER_ACTIONS.START_REFINE: {
      return {
        ...state,
        isRefining: true,
        refineError: null,
        activeRequestId: action.payload.requestId,
        lastRefinementInstruction: action.payload.instruction,
      };
    }

    case PLANNER_ACTIONS.RECEIVE_REFINE_SUCCESS: {
      if (action.payload.requestId !== state.activeRequestId) {
        return state;
      }

      const rawItinerary = action.payload.itinerary;
      const itineraryWithDerivedTimes = rawItinerary
        ? {
            ...rawItinerary,
            days: (rawItinerary.days || []).map((day) => recomputeTimes(day)),
          }
        : null;

      return {
        ...state,
        isRefining: false,
        refineError: null,
        previousItinerary: state.itinerary,
        itinerary: itineraryWithDerivedTimes,
        warnings: action.payload.warnings || [],
      };
    }

    case PLANNER_ACTIONS.RECEIVE_REFINE_ERROR: {
      if (action.payload.requestId !== state.activeRequestId) {
        return state;
      }
      return {
        ...state,
        isRefining: false,
        refineError: action.payload.error,
      };
    }

    case PLANNER_ACTIONS.UNDO_REFINEMENT: {
      if (!state.previousItinerary) return state;
      return {
        ...state,
        itinerary: state.previousItinerary,
        previousItinerary: null,
        lastRefinementInstruction: '',
        refineError: null,
      };
    }

    case PLANNER_ACTIONS.DISMISS_REFINE_ERROR: {
      return {
        ...state,
        refineError: null,
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
