import { recomputeTimes, timeToMinutes } from '../../shared/time.js';
import { GAP_LIMITS } from '../../shared/constants.js';

const EARLIEST_DINNER_MINUTES = timeToMinutes('17:30'); // 1050
const TARGET_DINNER_MINUTES = timeToMinutes('18:30');   // 1110
const MAX_GAP = GAP_LIMITS.MAX ?? 360;

/**
 * Pure function: Post-processes an itinerary to ensure that if the last stop of a day
 * is food (dinner), it does not start unreasonably early (e.g. mid-afternoon).
 *
 * Rules:
 * 1. For each day, if the last stop is type "food" and its computed start time
 *    (using existing sequential time logic) is earlier than 17:30, increase that stop's
 *    gapBeforeMin so it starts at 18:30.
 * 2. Capped at the schema limit of 360 minutes (if it cannot reach 18:30, apply as much as allowed).
 * 3. Never reduce an existing gap.
 * 4. Never touch days where the last stop isn't food.
 * 5. Handles empty days or 1-stop days gracefully without crashing.
 *
 * @param {object} itinerary
 * @returns {object} New itinerary with adjusted dinner gaps
 */
export function adjustDinnerSchedule(itinerary) {
  if (!itinerary || !Array.isArray(itinerary.days)) {
    return itinerary;
  }

  const updatedDays = itinerary.days.map((day) => {
    if (!day || !Array.isArray(day.stops) || day.stops.length === 0) {
      return day;
    }

    const lastStop = day.stops[day.stops.length - 1];
    if (!lastStop || lastStop.type !== 'food') {
      return day;
    }

    // Compute sequential times to determine the current derived start time of the last stop
    const dayWithTimes = recomputeTimes(day);
    if (!dayWithTimes || !dayWithTimes.stops || dayWithTimes.stops.length === 0) {
      return day;
    }

    const computedLastStop = dayWithTimes.stops[dayWithTimes.stops.length - 1];
    const currentStartMinutes = timeToMinutes(computedLastStop.startTime);

    // If dinner already starts at or after 17:30, leave untouched
    if (currentStartMinutes >= EARLIEST_DINNER_MINUTES) {
      return day;
    }

    // Minutes needed to advance the start time to target dinner time (18:30)
    const neededIncrease = TARGET_DINNER_MINUTES - currentStartMinutes;
    if (neededIncrease <= 0) {
      return day;
    }

    const currentGap =
      typeof lastStop.gapBeforeMin === 'number' && !isNaN(lastStop.gapBeforeMin)
        ? lastStop.gapBeforeMin
        : 0;

    // Never reduce an existing gap, and cap at schema limit (360)
    const newGap = Math.min(MAX_GAP, Math.max(currentGap, currentGap + neededIncrease));

    if (newGap === currentGap) {
      return day;
    }

    const newStops = [...day.stops];
    newStops[newStops.length - 1] = {
      ...lastStop,
      gapBeforeMin: newGap,
    };

    return {
      ...day,
      stops: newStops,
    };
  });

  return {
    ...itinerary,
    days: updatedDays,
  };
}
