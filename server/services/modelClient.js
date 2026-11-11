import { ERROR_CODES } from '../../shared/constants.js';

/**
 * Friendly user-facing messages per error code.
 * Raw upstream Google error messages are never sent to the client.
 */
export const USER_FRIENDLY_ERROR_MESSAGES = {
  [ERROR_CODES.TIMEOUT]: 'The AI model took too long to generate your itinerary. Please try again or simplify your request.',
  [ERROR_CODES.RATE_LIMITED]: 'AI service is currently busy. Please wait a moment and try again.',
  [ERROR_CODES.UPSTREAM]: 'AI service is temporarily unavailable. Please try again in a few moments.',
  [ERROR_CODES.EMPTY]: 'The AI did not generate any itinerary content. Please try again with more details.',
  [ERROR_CODES.MALFORMED]: 'The AI returned an invalid response format. Please try again.',
  [ERROR_CODES.WRONG_SHAPE]: "The AI response didn't match the expected itinerary structure. Please try again.",
};

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
  const timeoutMs =
    options.timeoutMs ||
    parseInt(process.env.MODEL_TIMEOUT_MS, 10) ||
    45000;
  const maxOutputTokens =
    parseInt(process.env.MAX_OUTPUT_TOKENS, 10) || 4096;

  if (!apiKey || !apiKey.trim()) {
    const error = new Error(USER_FRIENDLY_ERROR_MESSAGES[ERROR_CODES.UPSTREAM]);
    error.code = ERROR_CODES.UPSTREAM;
    error.status = 500;
    console.error('[Gemini Client Error]: GEMINI_API_KEY environment variable is not configured.');
    throw error;
  }

  // Never log the API key; only log sanitized endpoint metadata
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const thinkingConfig = { thinkingLevel: 'low' };
  const hasThinkingConfig = true;

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
      maxOutputTokens,
      thinkingConfig,
    },
  };

  const startTime = Date.now();
  const maxAttempts = 2;

  // Enforce a hard outer deadline for this entire callModel invocation
  const overallController = new AbortController();
  const overallTimeoutId = setTimeout(() => {
    overallController.abort();
  }, timeoutMs);

  try {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const attemptStart = Date.now();

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
          },
          body: JSON.stringify(payload),
          signal: overallController.signal,
        });

        const elapsedMs = Date.now() - attemptStart;

        // Log structured diagnostics without sensitive data
        console.log(
          `[Gemini Client] Model call attempt ${attempt} finished in ${elapsedMs}ms | Status: ${response.status} | Thinking config: applied (${thinkingConfig.thinkingLevel}) | Model: ${model}`
        );

        if (!response.ok) {
          const rawErrorData = await response.json().catch(() => ({}));
          console.error(
            `[Gemini Client Error] Upstream HTTP ${response.status} on attempt ${attempt}:`,
            rawErrorData.error?.message || 'No upstream error message provided'
          );

          if (response.status === 429) {
            const error = new Error(USER_FRIENDLY_ERROR_MESSAGES[ERROR_CODES.RATE_LIMITED]);
            error.code = ERROR_CODES.RATE_LIMITED;
            error.status = 429;
            throw error;
          }

          // If 503 high-demand spike and we have remaining attempts, backoff briefly
          if (response.status === 503 && attempt < maxAttempts) {
            console.warn(`[Gemini Client] Model ${model} returned 503 (high demand). Retrying in 1.5s...`);
            await new Promise((resolve) => setTimeout(resolve, 1500));
            continue;
          }

          const error = new Error(USER_FRIENDLY_ERROR_MESSAGES[ERROR_CODES.UPSTREAM]);
          error.code = ERROR_CODES.UPSTREAM;
          error.status = response.status >= 500 ? 502 : 400;
          throw error;
        }

        const data = await response.json();
        const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!candidateText || !candidateText.trim()) {
          console.error('[Gemini Client Error]: Model produced empty candidate output.');
          const error = new Error(USER_FRIENDLY_ERROR_MESSAGES[ERROR_CODES.EMPTY]);
          error.code = ERROR_CODES.EMPTY;
          error.status = 502;
          throw error;
        }

        return candidateText;
      } catch (innerErr) {
        // If aborted due to timeout
        if (overallController.signal.aborted || innerErr.name === 'AbortError' || innerErr.name === 'TimeoutError') {
          const totalElapsed = Date.now() - startTime;
          console.warn(`[Gemini Client] Request exceeded timeout of ${timeoutMs}ms (took ${totalElapsed}ms)`);
          const error = new Error(USER_FRIENDLY_ERROR_MESSAGES[ERROR_CODES.TIMEOUT]);
          error.code = ERROR_CODES.TIMEOUT;
          error.status = 504;
          throw error;
        }

        if (innerErr.code) throw innerErr;

        // If it's a network error and we have an attempt left, retry once
        if (attempt < maxAttempts) {
          console.warn(`[Gemini Client] Network error on attempt ${attempt} (${innerErr.message}). Retrying in 1.5s...`);
          await new Promise((resolve) => setTimeout(resolve, 1500));
          continue;
        }

        console.error('[Gemini Client Error] Network failure:', innerErr.message);
        const error = new Error(USER_FRIENDLY_ERROR_MESSAGES[ERROR_CODES.UPSTREAM]);
        error.code = ERROR_CODES.UPSTREAM;
        error.status = 502;
        throw error;
      }
    }
  } finally {
    clearTimeout(overallTimeoutId);
  }
}
