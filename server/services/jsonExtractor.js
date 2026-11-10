import { ERROR_CODES } from '../../shared/constants.js';

/**
 * Extracts and parses a JSON object from raw model output.
 * Strips markdown code fences (```json ... ```) and surrounding conversational prose.
 * Takes the outermost balanced/bracketed {...} substring.
 *
 * @param {string} text - Raw text from the LLM
 * @returns {object} Parsed JSON object
 * @throws {{ code: string, message: string }}
 */
export function extractJson(text) {
  if (!text || typeof text !== 'string' || !text.trim()) {
    const error = new Error('Model returned an empty response.');
    error.code = ERROR_CODES.EMPTY;
    throw error;
  }

  let cleaned = text.trim();

  // Strip markdown code fences if present (e.g. ```json ... ``` or ``` ... ```)
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '');
  cleaned = cleaned.replace(/\s*```$/i, '');

  // Check if outermost structure is an array rather than an object
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  const firstBracket = cleaned.indexOf('[');
  const lastBracket = cleaned.lastIndexOf(']');

  if (firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace) && lastBracket > lastBrace) {
    const error = new Error('Expected JSON object as root, but received an array.');
    error.code = ERROR_CODES.WRONG_SHAPE;
    throw error;
  }

  if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
    const error = new Error('No valid JSON object structure found in model output.');
    error.code = ERROR_CODES.MALFORMED;
    throw error;
  }

  const jsonSubstring = cleaned.slice(firstBrace, lastBrace + 1);

  try {
    const parsed = JSON.parse(jsonSubstring);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      const error = new Error('Expected JSON object as root, but received an array or primitive.');
      error.code = ERROR_CODES.WRONG_SHAPE;
      throw error;
    }
    return parsed;
  } catch (err) {
    // If it's already a typed error we created above, rethrow
    if (err.code) throw err;

    const error = new Error(`Malformed JSON syntax in model response: ${err.message}`);
    error.code = ERROR_CODES.MALFORMED;
    throw error;
  }
}
