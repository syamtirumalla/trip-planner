export const STOP_TYPES = ['food', 'sight', 'activity', 'transit', 'rest'];

export const DEFAULT_START_TIME = '09:00';

export const DURATION_LIMITS = {
  MIN: 15,
  MAX: 480,
};

export const PROMPT_LIMITS = {
  MIN_LENGTH: 3,
  MAX_LENGTH: 1000,
};

export const ERROR_CODES = {
  MALFORMED: 'MALFORMED',
  WRONG_SHAPE: 'WRONG_SHAPE',
  EMPTY: 'EMPTY',
  TIMEOUT: 'TIMEOUT',
  UPSTREAM: 'UPSTREAM',
  RATE_LIMITED: 'RATE_LIMITED',
};

