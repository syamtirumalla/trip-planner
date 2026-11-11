import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { callGroq, callModel, USER_FRIENDLY_ERROR_MESSAGES } from '../services/modelClient.js';
import { ERROR_CODES } from '../../shared/constants.js';

describe('Groq Client & Provider Switching', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = { ...originalEnv };
    process.env.GROQ_API_KEY = 'gsk_mock_test_key_12345';
    process.env.GROQ_MODEL = 'openai/gpt-oss-20b';
    process.env.MODEL_TIMEOUT_MS = '1000';
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it('successfully extracts text from Groq OpenAI-compatible format', async () => {
    const mockPayload = {
      choices: [
        {
          message: {
            content: '{"title": "Groq Trip", "days": []}',
          },
        },
      ],
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockPayload,
    });

    const result = await callGroq('test prompt');
    expect(result).toBe('{"title": "Groq Trip", "days": []}');
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://api.groq.com/openai/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer gsk_mock_test_key_12345',
          'Content-Type': 'application/json',
        }),
      })
    );
  });

  it('throws EMPTY when Groq choices array or message content is missing/empty', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ choices: [{ message: { content: '   ' } }] }),
    });

    await expect(callGroq('test')).rejects.toMatchObject({
      code: ERROR_CODES.EMPTY,
      message: USER_FRIENDLY_ERROR_MESSAGES[ERROR_CODES.EMPTY],
    });
  });

  it('maps HTTP 429 to RATE_LIMITED with user-friendly error message', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({ error: { message: 'Rate limit exceeded' } }),
    });

    await expect(callGroq('test')).rejects.toMatchObject({
      code: ERROR_CODES.RATE_LIMITED,
      message: USER_FRIENDLY_ERROR_MESSAGES[ERROR_CODES.RATE_LIMITED],
      status: 429,
    });
  });

  it('maps HTTP 500 to UPSTREAM with user-friendly error message', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: { message: 'Internal Server Error' } }),
    });

    await expect(callGroq('test')).rejects.toMatchObject({
      code: ERROR_CODES.UPSTREAM,
      message: USER_FRIENDLY_ERROR_MESSAGES[ERROR_CODES.UPSTREAM],
      status: 502,
    });
  });

  it('maps timeout aborts to TIMEOUT error code', async () => {
    globalThis.fetch = vi.fn().mockImplementation((_url, options) => {
      return new Promise((_resolve, reject) => {
        options.signal.addEventListener('abort', () => {
          const err = new Error('The operation was aborted');
          err.name = 'AbortError';
          reject(err);
        });
      });
    });

    await expect(callGroq('test', { timeoutMs: 50 })).rejects.toMatchObject({
      code: ERROR_CODES.TIMEOUT,
      message: USER_FRIENDLY_ERROR_MESSAGES[ERROR_CODES.TIMEOUT],
      status: 504,
    });
  });

  it('switches provider via PROVIDER environment variable in callModel', async () => {
    process.env.PROVIDER = 'groq';

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        choices: [{ message: { content: '{"provider": "groq"}' } }],
      }),
    });

    const result = await callModel('test');
    expect(result).toBe('{"provider": "groq"}');
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://api.groq.com/openai/v1/chat/completions',
      expect.anything()
    );
  });
});
