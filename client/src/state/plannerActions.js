export const PLANNER_ACTIONS = {
  START_REQUEST: 'START_REQUEST',
  RECEIVE_SUCCESS: 'RECEIVE_SUCCESS',
  RECEIVE_ERROR: 'RECEIVE_ERROR',
  CANCEL_REQUEST: 'CANCEL_REQUEST',
  DISMISS_WARNINGS: 'DISMISS_WARNINGS',
  RESET: 'RESET',
  REMOVE_STOP: 'REMOVE_STOP',
  RESTORE_STOP: 'RESTORE_STOP',
  REORDER_STOPS: 'REORDER_STOPS',
  MOVE_STOP_TO_DAY: 'MOVE_STOP_TO_DAY',
  UPDATE_ITINERARY: 'UPDATE_ITINERARY',
};

export function startRequest(requestId, prompt) {
  return {
    type: PLANNER_ACTIONS.START_REQUEST,
    payload: { requestId, prompt },
  };
}

export function receiveSuccess(requestId, itinerary, warnings = []) {
  return {
    type: PLANNER_ACTIONS.RECEIVE_SUCCESS,
    payload: { requestId, itinerary, warnings },
  };
}

export function receiveError(requestId, error) {
  return {
    type: PLANNER_ACTIONS.RECEIVE_ERROR,
    payload: { requestId, error },
  };
}

export function cancelRequest(requestId) {
  return {
    type: PLANNER_ACTIONS.CANCEL_REQUEST,
    payload: { requestId },
  };
}

export function dismissWarnings() {
  return {
    type: PLANNER_ACTIONS.DISMISS_WARNINGS,
  };
}

export function resetPlanner() {
  return {
    type: PLANNER_ACTIONS.RESET,
  };
}

export function removeStop(dayId, stopId) {
  return {
    type: PLANNER_ACTIONS.REMOVE_STOP,
    payload: { dayId, stopId },
  };
}

export function restoreStop(dayId, stop, index) {
  return {
    type: PLANNER_ACTIONS.RESTORE_STOP,
    payload: { dayId, stop, index },
  };
}

export function reorderStops(dayId, activeStopId, overStopId) {
  return {
    type: PLANNER_ACTIONS.REORDER_STOPS,
    payload: { dayId, activeStopId, overStopId },
  };
}

export function moveStopToDay(fromDayId, toDayId, stopId) {
  return {
    type: PLANNER_ACTIONS.MOVE_STOP_TO_DAY,
    payload: { fromDayId, toDayId, stopId },
  };
}

export function updateItinerary(itinerary) {
  return {
    type: PLANNER_ACTIONS.UPDATE_ITINERARY,
    payload: { itinerary },
  };
}
