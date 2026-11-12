import { STOP_TYPES, DURATION_LIMITS, GAP_LIMITS } from '../../shared/constants.js';

const SCHEMA_INSTRUCTION = `
You must respond with a single, strictly valid JSON object matching this specification:
{
  "title": "Clear descriptive trip title",
  "summary": "1-2 sentence overview of the trip theme and highlights",
  "days": [
    {
      "label": "Day 1: Title describing the day",
      "startTime": "09:00",
      "stops": [
        {
          "name": "Location or Activity Name",
          "type": one of [${STOP_TYPES.map((t) => `"${t}"`).join(', ')}],
          "durationMin": integer between ${DURATION_LIMITS.MIN} and ${DURATION_LIMITS.MAX},
          "gapBeforeMin": optional integer between ${GAP_LIMITS.MIN} and ${GAP_LIMITS.MAX} (idle/free-time minutes before this stop starts; defaults to 0),
          "description": "Concise 1-sentence description",
          "costEstimate": "e.g., Free, $15, €20 (optional)",
          "tip": "Short insider tip (optional)"
        }
      ]
    }
  ]
}

CRITICAL SCHEDULING & STRUCTURE RULES:
1. Provide ONLY the raw JSON object. Do not wrap in markdown or add conversational pleasantries.
2. EXACT DAY COUNT: If the user request specifies or implies a number of days (e.g., "4 days", "a week", "3-day"), you MUST return EXACTLY that many day objects in the "days" array. Never omit or combine days.
3. FULL-DAY ITINERARY: Each day must contain at least 3 quality stops covering a realistic full day (about 8 to 10 hours total from morning to evening).
4. MEAL CHRONOLOGY:
   - Schedule morning food/café stops in the morning.
   - Schedule lunch before mid-afternoon (between 12:00 and 14:00).
   - Dinner or evening dining must be the final stop of the day.
5. REALISTIC TIMING & GAPS (gapBeforeMin):
   - You may set "gapBeforeMin" (integer between 0 and 360, default 0) so stops land at realistic times throughout the day.
   - For example, leave a gap after afternoon sightseeing stops (e.g. 60-180 minutes of free time or rest) so dinner lands around 18:30-20:00 and night activities occur in the evening.
   - Breakfast and lunch should need little or no gap (keep gapBeforeMin at 0).
   - Keep gapBeforeMin at 0 when no idle time is needed between consecutive stops.
6. NO FILLER STOPS: Avoid passive filler stops like "Hotel Rest", "Relax at Hotel", "Check-in", or "Free Time". Every stop must be an active, worthwhile destination or culinary experience (use gapBeforeMin for idle breaks instead).
7. TRANSIT RULES: Do NOT make "transit" the first stop of a day unless the user specifically mentions arriving or traveling on that day.
8. Realistic stop durations (${DURATION_LIMITS.MIN}-${DURATION_LIMITS.MAX} minutes) and logical geographical sequencing within each day.
9. Concise descriptions: Keep descriptions and tips concise (1 sentence each) for fast, reliable generation.
10. Every day must have at least one valid stop.
11. "type" must be strictly one of: ${STOP_TYPES.join(', ')}.
12. "startTime" must be in 24-hour "HH:MM" format (e.g. "09:00", "08:30").
`;

export function buildPlanPrompt(userPrompt) {
  return `You are a world-class travel planner.
Create a thoughtful, realistic, day-by-day travel itinerary based on the following user request:

"${userPrompt}"

${SCHEMA_INSTRUCTION}`;
}

export function buildRefinePrompt(currentItinerary, instruction) {
  return `You are a world-class travel planner modifying an existing itinerary.

CURRENT ITINERARY:
${JSON.stringify(currentItinerary, null, 2)}

USER INSTRUCTION FOR MODIFICATION:
"${instruction}"

Please return the COMPLETE updated itinerary reflecting this change, preserving all unchanged days and stops while updating the modified items.
CRITICAL FOR REFINEMENT: Preserve existing "gapBeforeMin" values on unchanged stops unless the user explicitly asks to change the schedule or timing.

${SCHEMA_INSTRUCTION}`;
}

export function buildRepairPrompt(badOutput, errorDetails) {
  return `Your previous response failed validation and could not be parsed or validated against the required JSON schema.

ERROR DETAILS:
${errorDetails}

YOUR PREVIOUS OUTPUT:
${badOutput}

Please fix the errors above and return the complete, corrected itinerary.
${SCHEMA_INSTRUCTION}`;
}
