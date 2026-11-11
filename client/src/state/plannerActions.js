export const PLANNER_ACTIONS = {
  START_REQUEST: 'START_REQUEST',
  RECEIVE_SUCCESS: 'RECEIVE_SUCCESS',
  RECEIVE_ERROR: 'RECEIVE_ERROR',
  CANCEL_REQUEST: 'CANCEL_REQUEST',
  DISMISS_WARNINGS: 'DISMISS_WARNINGS',
  RESET: 'RESET',
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
