import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getSimulatedModelOutput } from '../services/simulator.js';
import { extractJson } from '../services/jsonExtractor.js';
import { validateAndSalvage } from '../services/validator.js';
import { ERROR_CODES } from '../../shared/constants.js';

describe('Dev Failure Simulator', () => {
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    process.env.NODE_ENV = 'development';
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('is completely disabled when NODE_ENV is production', async () => {
    process.env.NODE_ENV = 'production';
    const req = { headers: { 'x-simulate': 'malformed' } };
    const output = await getSimulatedModelOutput(req);
    expect(output).toBeNull();
  });

  it('simulates malformed output', async () => {
    const req = { headers: { 'x-simulate': 'malformed' } };
    const raw = await getSimulatedModelOutput(req);
    expect(raw).toBeDefined();
    expect(() => extractJson(raw)).toThrowError();
  });

  it('simulates wrong-shape output', async () => {
    const req = { headers: { 'x-simulate': 'wrong-shape' } };
    const raw = await getSimulatedModelOutput(req);
    const parsed = extractJson(raw);
    expect(() => validateAndSalvage(parsed)).toThrowError();
  });

  it('simulates empty output', async () => {
    const req = { headers: { 'x-simulate': 'empty' } };
    const raw = await getSimulatedModelOutput(req);
    const parsed = extractJson(raw);
    try {
      validateAndSalvage(parsed);
      expect.unreachable();
    } catch (err) {
      expect(err.code).toBe(ERROR_CODES.EMPTY);
    }
  });

  it('simulates timeout (slow)', async () => {
    const req = { headers: { 'x-simulate': 'slow' } };
    await expect(getSimulatedModelOutput(req)).rejects.toMatchObject({
      code: ERROR_CODES.TIMEOUT,
      status: 504,
    });
  });

  it('simulates upstream 500 error', async () => {
    const req = { headers: { 'x-simulate': 'http500' } };
    await expect(getSimulatedModelOutput(req)).rejects.toMatchObject({
      code: ERROR_CODES.UPSTREAM,
      status: 502,
    });
  });

  it('simulates rate limit (429)', async () => {
    const req = { headers: { 'x-simulate': 'rate-limit' } };
    await expect(getSimulatedModelOutput(req)).rejects.toMatchObject({
      code: ERROR_CODES.RATE_LIMITED,
      status: 429,
    });
  });

  it('simulates partial failure and verifies salvage logic drops bad stops', async () => {
    const req = { headers: { 'x-simulate': 'partial' } };
    const raw = await getSimulatedModelOutput(req);
    const parsed = extractJson(raw);
    const result = validateAndSalvage(parsed);

    // Both days should survive
    expect(result.itinerary.days).toHaveLength(2);
    // Day 1 had 3 stops, 1 bad -> 2 remain
    expect(result.itinerary.days[0].stops).toHaveLength(2);
    // Day 2 had 2 stops, 1 bad -> 1 remains
    expect(result.itinerary.days[1].stops).toHaveLength(1);
    // Warnings recorded for the 2 dropped stops
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toMatch(/2 stops couldn't be loaded/i);
  });
});

