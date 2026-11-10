import { STOP_TYPES, DURATION_LIMITS } from '../../shared/constants.js';

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
          "description": "Engaging 1-2 sentence description",
          "costEstimate": "e.g., Free, $15, ¥2000 (optional)",
          "tip": "Helpful insider tip or advice (optional)"
        }
      ]
    }
  ]
}

CRITICAL RULES:
1. Provide only the JSON object. Do not wrap in markdown or add conversational pleasantries.
2. Ensure realistic stop durations (${DURATION_LIMITS.MIN}-${DURATION_LIMITS.MAX} minutes) and logical geographical sequencing.
3. Every day must have at least one valid stop.
4. "type" must be strictly one of: ${STOP_TYPES.join(', ')}.
5. "startTime" must be in 24-hour "HH:MM" format (e.g. "09:00", "10:30").
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

