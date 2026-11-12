/**
 * Pure utility functions for time calculations, durations, and deriving sequential stop schedules.
 */

/**
 * Formats duration in minutes to human-readable string.
 * e.g., 45 -> "45m", 90 -> "1h 30m", 120 -> "2h"
 *
 * @param {number} minutes
 * @returns {string}
 */
export function formatDuration(minutes) {
  if (!minutes || minutes <= 0) return '0m';
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) return `${remainingMinutes}m`;
  if (remainingMinutes === 0) return `${hours}h`;
  return `${hours}h ${remainingMinutes}m`;
}

/**
 * Converts a 24-hour "HH:MM" string into minutes since 00:00.
 * Defaults to 09:00 (540 min) if missing or invalid.
 *
 * @param {string} timeStr - "HH:MM"
 * @returns {number} Minutes since 00:00 (0 - 1439)
 */
export function timeToMinutes(timeStr) {
  const [hStr, mStr] = (timeStr || '09:00').split(':');
  let hours = parseInt(hStr, 10);
  let minutes = parseInt(mStr, 10);

  if (isNaN(hours)) hours = 9;
  if (isNaN(minutes)) minutes = 0;

  return hours * 60 + minutes;
}

/**
 * Adds minutes to a 24-hour HH:MM time string with midnight wrap-around.
 *
 * @param {string} timeStr - Time in "HH:MM" format
 * @param {number} minutesToAdd - Minutes to add (integer)
 * @returns {string} New time in "HH:MM" format
 */
export function addMinutesToTime(timeStr, minutesToAdd = 0) {
  const total = timeToMinutes(timeStr);
  const safeMinutesToAdd =
    typeof minutesToAdd === 'number' && !isNaN(minutesToAdd)
      ? Math.round(minutesToAdd)
      : 0;

  let totalMinutes = (total + safeMinutesToAdd) % (24 * 60);
  if (totalMinutes < 0) {
    totalMinutes += 24 * 60;
  }

  const newHours = Math.floor(totalMinutes / 60);
  const newMinutes = totalMinutes % 60;

  return `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
}

/**
 * Pure function: Recomputes derived start times for all stops in a day.
 * - Start time of each stop = previous stop's end + its gapBeforeMin (first stop = day.startTime + its gap).
 * - Total duration for the day remains the total active time (sum of stop durations, excluding gaps).
 * - Handles crossing midnight with standard 24-hour time wrap-around.
 *
 * @param {object} day - Day object containing startTime ("HH:MM") and stops array
 * @returns {object} New day object with updated stops (derived start/end times) and totalDurationMin
 */
export function recomputeTimes(day) {
  if (!day) return null;

  const baseStartTime =
    day.startTime && /^([01]\d|2[0-3]):[0-5]\d$/.test(day.startTime)
      ? day.startTime
      : '09:00';

  const stops = Array.isArray(day.stops) ? day.stops : [];
  let currentTime = baseStartTime;
  let totalActiveMinutes = 0;

  const updatedStops = stops.map((stop) => {
    const stopDuration =
      typeof stop.durationMin === 'number' && stop.durationMin > 0
        ? stop.durationMin
        : 30;

    const gap =
      typeof stop.gapBeforeMin === 'number' && !isNaN(stop.gapBeforeMin)
        ? Math.min(360, Math.max(0, Math.round(stop.gapBeforeMin)))
        : 0;

    const stopStartTime = addMinutesToTime(currentTime, gap);
    const stopEndTime = addMinutesToTime(stopStartTime, stopDuration);
    currentTime = stopEndTime;
    totalActiveMinutes += stopDuration;

    return {
      ...stop,
      gapBeforeMin: gap,
      startTime: stopStartTime,
      endTime: stopEndTime,
    };
  });

  return {
    ...day,
    startTime: baseStartTime,
    stops: updatedStops,
    totalDurationMin: totalActiveMinutes,
  };
}
