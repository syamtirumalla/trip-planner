import { generateId } from './id.js';

/**
 * Reconciles client-side IDs between a newly refined itinerary and the previous itinerary.
 * Preserves existing client-side IDs for unchanged stops and days based on matching names.
 *
 * @param {object} newItinerary
 * @param {object} oldItinerary
 * @returns {object} Reconciled itinerary
 */
export function reconcileItinerary(newItinerary, oldItinerary) {
  if (!newItinerary) return newItinerary;

  const existingStopIdsByName = new Map();
  const existingDayIdsByLabel = new Map();

  if (oldItinerary && Array.isArray(oldItinerary.days)) {
    oldItinerary.days.forEach((day, dayIndex) => {
      if (day.id) {
        existingDayIdsByLabel.set(day.label.toLowerCase().trim(), day.id);
        existingDayIdsByLabel.set(`day_index_${dayIndex}`, day.id);
      }

      if (Array.isArray(day.stops)) {
        day.stops.forEach((stop) => {
          if (stop.id) {
            existingStopIdsByName.set(stop.name.toLowerCase().trim(), stop.id);
          }
        });
      }
    });
  }

  return {
    ...newItinerary,
    id: oldItinerary?.id || newItinerary.id || generateId(),
    days: (newItinerary.days || []).map((day, dayIdx) => {
      const cleanLabel = (day.label || '').toLowerCase().trim();
      const dayId =
        existingDayIdsByLabel.get(cleanLabel) ||
        existingDayIdsByLabel.get(`day_index_${dayIdx}`) ||
        generateId();

      return {
        ...day,
        id: dayId,
        stops: (day.stops || []).map((stop) => {
          const cleanStopName = (stop.name || '').toLowerCase().trim();
          const stopId =
            existingStopIdsByName.get(cleanStopName) || generateId();

          return {
            ...stop,
            id: stopId,
          };
        }),
      };
    }),
  };
}
