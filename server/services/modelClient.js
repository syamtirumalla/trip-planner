import { ERROR_CODES } from '../../shared/constants.js';

/**
 * Calls the Gemini REST API directly using plain fetch.
 * No third-party SDKs are used so every step, header, and parameter is explainable.
 *
 * @param {string} prompt - Full text prompt sent to the LLM
 * @param {object} [options] - Optional overrides (timeoutMs, signal)
 * @returns {Promise<string>} The raw text response from the model
 * @throws {{ code: string, message: string, status?: number }}
 */
export async function callModel(prompt, options = {}) {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
  const timeoutMs = options.timeoutMs || 30000;

  if (!apiKey || !apiKey.trim()) {
    const error = new Error('GEMINI_API_KEY is not configured on the server.');
    error.code = ERROR_CODES.UPSTREAM;
    error.status = 500;
    throw error;
  }

  // Target endpoint using REST API
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const payload = {
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.4,
    },
  };

  // Up to 2 attempts for temporary 503 high-demand spikes
  const maxAttempts = 2;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const timeoutSignal = AbortSignal.timeout(timeoutMs);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify(payload),
        signal: timeoutSignal,
      });

      if (!response.ok) {
        if (response.status === 429) {
          const error = new Error('Gemini API rate limit exceeded. Please wait a moment and try again.');
          error.code = ERROR_CODES.RATE_LIMITED;
          error.status = 429;
          throw error;
        }

        // If 503 high-demand spike and we haven't exhausted attempts, wait briefly and retry
        if (response.status === 503 && attempt < maxAttempts) {
          console.warn(`[Gemini Client] Model ${model} returned 503 (high demand). Retrying in 1.5s (attempt ${attempt}/${maxAttempts})...`);
          await new Promise((resolve) => setTimeout(resolve, 1500));
          continue;
        }

        if (response.status >= 500) {
          const errorData = await response.json().catch(() => ({}));
          const serverMsg = errorData.error?.message || `Gemini service error (${response.status})`;
          const error = new Error(`${serverMsg}. Please try again shortly.`);
          error.code = ERROR_CODES.UPSTREAM;
          error.status = 502;
          throw error;
        }

        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.error?.message || `Upstream request failed with status ${response.status}`;
        const error = new Error(`AI service rejected request: ${errorMsg}`);
        error.code = ERROR_CODES.UPSTREAM;
        error.status = 502;
        throw error;
      }

      const data = await response.json();
      const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!candidateText || !candidateText.trim()) {
        const error = new Error('Model produced an empty or blank response.');
        error.code = ERROR_CODES.EMPTY;
        error.status = 502;
        throw error;
      }

      return candidateText;
    } catch (err) {
      if (err.name === 'TimeoutError' || err.name === 'AbortError') {
        const error = new Error(`AI model request timed out after ${timeoutMs / 1000} seconds.`);
        error.code = ERROR_CODES.TIMEOUT;
        error.status = 504;
        throw error;
      }

      if (err.code) throw err;

      const error = new Error(`Failed to communicate with AI provider: ${err.message}`);
      error.code = ERROR_CODES.UPSTREAM;
      error.status = 502;
      throw error;
    }
  }
}
