import { StopSchema, ItinerarySchema } from '../../shared/schema.js';
import { ERROR_CODES } from '../../shared/constants.js';

/**
 * Validates raw itinerary object stop-by-stop and salvages valid content.
 * - Drops invalid stops and records actionable warnings.
 * - Drops days that end up with zero valid stops.
 * - If no valid stops/days remain, throws a typed error.
 *
 * @param {object} rawObj - Raw parsed JSON object from model
 * @returns {{ itinerary: object, warnings: string[] }}
 * @throws {{ code: string, message: string }}
 */
export function validateAndSalvage(rawObj) {
  if (!rawObj || typeof rawObj !== 'object') {
    const error = new Error('Model output is not a valid JSON object.');
    error.code = ERROR_CODES.WRONG_SHAPE;
    throw error;
  }

  // Days array check
  if (!Array.isArray(rawObj.days) || rawObj.days.length === 0) {
    const error = new Error('Itinerary must contain a non-empty "days" array.');
    error.code = ERROR_CODES.EMPTY;
    throw error;
  }

  const warnings = [];
  const detailedWarnings = [];
  let totalDroppedStops = 0;
  const salvagedDays = [];

  rawObj.days.forEach((day, dayIndex) => {
    const dayLabel =
      typeof day?.label === 'string' && day.label.trim()
        ? day.label.trim()
        : `Day ${dayIndex + 1}`;

    // Validate start time or default to 09:00
    let startTime = '09:00';
    if (typeof day?.startTime === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(day.startTime.trim())) {
      startTime = day.startTime.trim();
    }

    if (!Array.isArray(day?.stops) || day.stops.length === 0) {
      detailedWarnings.push(`Day "${dayLabel}" had no stops and was omitted.`);
      return;
    }

    const validStops = [];

    day.stops.forEach((stop, stopIndex) => {
      const parsedStop = StopSchema.safeParse(stop);
      if (parsedStop.success) {
        validStops.push(parsedStop.data);
      } else {
        totalDroppedStops++;
        const stopName =
          typeof stop?.name === 'string' && stop.name.trim()
            ? `"${stop.name.trim()}"`
            : `Stop ${stopIndex + 1}`;
        const issueMsg = parsedStop.error?.issues?.[0]?.message || 'Invalid stop format';
        detailedWarnings.push(`${stopName} in ${dayLabel} couldn't be loaded (${issueMsg}).`);
      }
    });

    if (validStops.length > 0) {
      salvagedDays.push({
        label: dayLabel,
        startTime,
        stops: validStops,
      });
    } else {
      detailedWarnings.push(`Day "${dayLabel}" was omitted because it had no valid stops.`);
    }
  });

  if (salvagedDays.length === 0) {
    const error = new Error('No valid itinerary days or stops could be salvaged from the AI response.');
    error.code = totalDroppedStops > 0 ? ERROR_CODES.WRONG_SHAPE : ERROR_CODES.EMPTY;
    throw error;
  }

  if (totalDroppedStops > 0) {
    warnings.push(
      `${totalDroppedStops} stop${totalDroppedStops > 1 ? 's' : ''} couldn't be loaded and ${totalDroppedStops > 1 ? 'were' : 'was'} omitted.`
    );
  }

  // Include detailed warnings after summary
  warnings.push(...detailedWarnings);

  const rawTitle =
    typeof rawObj.title === 'string' && rawObj.title.trim()
      ? rawObj.title.trim()
      : 'Custom Trip Itinerary';

  const rawSummary =
    typeof rawObj.summary === 'string' && rawObj.summary.trim()
      ? rawObj.summary.trim()
      : undefined;

  const candidateItinerary = {
    title: rawTitle,
    summary: rawSummary,
    days: salvagedDays,
  };

  // Final verification with Zod
  const finalVerification = ItinerarySchema.safeParse(candidateItinerary);
  if (!finalVerification.success) {
    const error = new Error(`Salvaged itinerary failed schema verification: ${finalVerification.error.message}`);
    error.code = ERROR_CODES.WRONG_SHAPE;
    throw error;
  }

  return {
    itinerary: finalVerification.data,
    warnings,
  };
}

