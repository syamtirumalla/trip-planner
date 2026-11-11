/**
 * Pure functions to detect requested trip duration and verify against model output.
 */

const NUMBER_WORDS = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
};

/**
 * Parses user prompt to detect requested number of days.
 *
 * @param {string} prompt - User free-form trip prompt
 * @returns {number|null} Expected number of days, or null if unspecified
 */
export function detectRequestedDays(prompt) {
  if (!prompt || typeof prompt !== 'string') return null;

  const text = prompt.toLowerCase();

  // Check for "a week" / "1 week" / "2 weeks" / weekends
  if (/\b(?:a|1|one)\s+week\b/.test(text)) return 7;
  if (/\b(?:2|two)\s+weeks\b/.test(text)) return 14;
  if (/\b(?:a\s+)?long\s+weekend\b/.test(text)) return 3;
  if (/\b(?:a\s+)?weekend\b/.test(text)) return 2;

  // Check for numeric days: e.g. "4 days", "4-day", "4 day"
  const digitMatch = text.match(/\b(\d+)\s*-?\s*days?\b/);
  if (digitMatch) {
    const days = parseInt(digitMatch[1], 10);
    if (!isNaN(days) && days > 0 && days <= 60) {
      return days;
    }
  }

  // Check for written number words: e.g. "four days", "three-day"
  const wordPattern = new RegExp(`\\b(${Object.keys(NUMBER_WORDS).join('|')})\\s*-?\\s*days?\\b`);
  const wordMatch = text.match(wordPattern);
  if (wordMatch && NUMBER_WORDS[wordMatch[1]]) {
    return NUMBER_WORDS[wordMatch[1]];
  }

  return null;
}

/**
 * Compares requested days against actual generated days and returns a warning if under-generated.
 *
 * @param {string} prompt - User prompt
 * @param {number} actualDaysCount - Number of days in the generated itinerary
 * @returns {string|null} Warning message or null
 */
export function checkRequestedDaysMatch(prompt, actualDaysCount) {
  const requestedDays = detectRequestedDays(prompt);
  if (!requestedDays) return null;

  if (actualDaysCount < requestedDays) {
    return `You asked for ${requestedDays} days but only ${actualDaysCount} were generated.`;
  }

  return null;
}
