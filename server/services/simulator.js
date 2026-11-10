import { ERROR_CODES } from '../../shared/constants.js';

/**
 * Dev-only simulation helper to test resilience and error handling.
 * MUST be strictly disabled when NODE_ENV === 'production'.
 *
 * Supported header values:
 * - 'malformed': returns unparseable JSON text
 * - 'wrong-shape': returns JSON without required itinerary fields
 * - 'empty': returns itinerary with empty days array
 * - 'slow': simulates timeout (>30s)
 * - 'http500': simulates 500/502 upstream failure
 * - 'rate-limit': simulates 429 rate limit
 * - 'partial': returns valid itinerary with 2 invalid stops to test salvage logic
 *
 * @param {import('express').Request} req
 * @returns {Promise<string|null>} Simulated raw model output or throws simulated error
 */
export async function getSimulatedModelOutput(req) {
  // CRITICAL: Strict production safeguard
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  const simulate = req.headers['x-simulate']?.toString().toLowerCase().trim();
  if (!simulate) {
    return null;
  }

  switch (simulate) {
    case 'malformed': {
      return '{ "title": "Broken Trip", "days": [ { "label": "Day 1", "stops": [ { "name": "Broken Stop", duration: 99 } ';
    }

    case 'wrong-shape': {
      return JSON.stringify({
        unrelatedField: 'This does not match the Itinerary schema',
        count: 100,
        notes: ['Not a day-by-day plan'],
      });
    }

    case 'empty': {
      return JSON.stringify({
        title: 'Empty Itinerary',
        summary: 'No days generated',
        days: [],
      });
    }

    case 'slow': {
      // Simulate timeout
      const error = new Error('AI model request timed out after 30 seconds (simulated).');
      error.code = ERROR_CODES.TIMEOUT;
      error.status = 504;
      throw error;
    }

    case 'http500': {
      const error = new Error('Upstream AI service error (simulated 500).');
      error.code = ERROR_CODES.UPSTREAM;
      error.status = 502;
      throw error;
    }

    case 'rate-limit': {
      const error = new Error('Gemini API rate limit exceeded (simulated 429).');
      error.code = ERROR_CODES.RATE_LIMITED;
      error.status = 429;
      throw error;
    }

    case 'partial': {
      // Returns an itinerary where 2 stops are valid, 1 has invalid duration, and 1 has invalid type
      return JSON.stringify({
        title: 'Tokyo Highlights (Simulated Partial Salvage)',
        summary: 'A 2-day plan with mixed valid and invalid stops to test recovery.',
        days: [
          {
            label: 'Day 1: Historic Asakusa',
            startTime: '09:00',
            stops: [
              {
                name: 'Senso-ji Temple',
                type: 'sight',
                durationMin: 90,
                description: 'Ancient Buddhist temple in Asakusa with five-story pagoda.',
                costEstimate: 'Free',
                tip: 'Visit Nakamise-dori shopping street leading up to the temple.',
              },
              {
                name: 'Bad Stop 1 (Invalid Duration)',
                type: 'sight',
                durationMin: 99999, // Invalid: exceeds max 480
                description: 'Should be dropped by salvage pipeline.',
              },
              {
                name: 'Asakusa Suzukien Matcha Gelato',
                type: 'food',
                durationMin: 45,
                description: 'Famous tea house with 7 levels of rich matcha gelato.',
                costEstimate: '¥600',
                tip: 'Try level 7 for the most intense matcha experience.',
              },
            ],
          },
          {
            label: 'Day 2: Akihabara & Ueno',
            startTime: '10:00',
            stops: [
              {
                name: 'Bad Stop 2 (Invalid Type)',
                type: 'nightclub-nonsense', // Invalid enum
                durationMin: 60,
                description: 'Should be dropped by salvage pipeline.',
              },
              {
                name: 'Ueno Park Stroll',
                type: 'sight',
                durationMin: 120,
                description: 'Spacious public park with museums, shrines, and pond.',
                costEstimate: 'Free',
                tip: 'Rent a swan paddle boat at Shinobazu Pond.',
              },
            ],
          },
        ],
      });
    }

    default:
      return null;
  }
}

