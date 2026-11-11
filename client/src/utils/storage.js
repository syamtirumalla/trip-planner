import { ItinerarySchema } from '../../../shared/schema.js';

export const STORAGE_KEY = 'trip_planner_v1';

/**
 * Checks if localStorage is accessible in the current browser context.
 * Safely handles private browsing restrictions or blocked cookies/storage.
 */
function isStorageAvailable() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false;
    }
    const testKey = '__storage_test__';
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Auto-saves the current trip itinerary and prompt to localStorage.
 *
 * @param {object} itinerary
 * @param {string} prompt
 * @returns {boolean} Whether the save was successful
 */
export function saveItinerary(itinerary, prompt = '') {
  if (!itinerary) return false;
  if (!isStorageAvailable()) return false;

  try {
    const payload = {
      version: 1,
      savedAt: Date.now(),
      prompt: prompt || '',
      itinerary,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    return true;
  } catch (err) {
    console.warn('[Auto-Save] Failed to save trip to localStorage:', err);
    return false;
  }
}

/**
 * Loads and re-validates the saved itinerary from localStorage.
 * Discards corrupted, incomplete, or schema-invalid data safely.
 *
 * @returns {{ itinerary: object, prompt: string } | null}
 */
export function loadSavedItinerary() {
  if (!isStorageAvailable()) return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    // Verify storage schema version
    if (parsed.version !== 1 || !parsed.itinerary) {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    // Critical: Re-validate with shared Zod schema to prevent loading corrupted data
    const validation = ItinerarySchema.safeParse(parsed.itinerary);
    if (!validation.success) {
      console.warn(
        '[Auto-Save] Stored itinerary failed schema re-validation. Discarding corrupted state:',
        validation.error
      );
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return {
      itinerary: parsed.itinerary,
      prompt: typeof parsed.prompt === 'string' ? parsed.prompt : '',
    };
  } catch (err) {
    console.warn('[Auto-Save] Failed to parse stored itinerary:', err);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore removal failure in restricted environments
    }
    return null;
  }
}

/**
 * Clears the saved trip from localStorage.
 */
export function clearSavedItinerary() {
  if (!isStorageAvailable()) return;

  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn('[Auto-Save] Failed to clear saved itinerary:', err);
  }
}
