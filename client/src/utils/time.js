/**
 * Utility functions for computing start times and formatting durations.
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
 * Adds minutes to a 24-hour HH:MM time string.
 *
 * @param {string} timeStr - Time in "HH:MM" format
 * @param {number} minutesToAdd - Minutes to add (positive integer)
 * @returns {string} New time in "HH:MM" format
 */
export function addMinutesToTime(timeStr, minutesToAdd) {
  const [hStr, mStr] = (timeStr || '09:00').split(':');
  let hours = parseInt(hStr, 10);
  let minutes = parseInt(mStr, 10);

  if (isNaN(hours)) hours = 9;
  if (isNaN(minutes)) minutes = 0;

  const totalMinutes = (hours * 60 + minutes + minutesToAdd) % (24 * 60);
  const newHours = Math.floor(totalMinutes / 60);
  const newMinutes = totalMinutes % 60;

  return `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
}

/**
 * Pure function: Recomputes derived start times for all stops in a day.
 * Stop start times are derived from day.startTime plus cumulative duration of preceding stops.
 * Also computes total duration for the day.
 *
 * @param {object} day - Day object containing startTime ("HH:MM") and stops array
 * @returns {object} New day object with updated stops (including calculated startTime) and totalDurationMin
 */
export function recomputeTimes(day) {
  if (!day) return null;

  const baseStartTime = day.startTime && /^([01]\d|2[0-3]):[0-5]\d$/.test(day.startTime)
    ? day.startTime
    : '09:00';

  const stops = Array.isArray(day.stops) ? day.stops : [];
  let cumulativeMinutes = 0;

  const updatedStops = stops.map((stop) => {
    const stopDuration = typeof stop.durationMin === 'number' && stop.durationMin > 0
      ? stop.durationMin
      : 30;

    const stopStartTime = addMinutesToTime(baseStartTime, cumulativeMinutes);
    cumulativeMinutes += stopDuration;
    const stopEndTime = addMinutesToTime(baseStartTime, cumulativeMinutes);

    return {
      ...stop,
      startTime: stopStartTime,
      endTime: stopEndTime,
    };
  });

  return {
    ...day,
    startTime: baseStartTime,
    stops: updatedStops,
    totalDurationMin: cumulativeMinutes,
  };
}
