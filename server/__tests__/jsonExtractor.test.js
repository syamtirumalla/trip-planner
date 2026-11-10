import { describe, it, expect } from 'vitest';
import { extractJson } from '../services/jsonExtractor.js';
import { ERROR_CODES } from '../../shared/constants.js';

describe('extractJson', () => {
  it('parses clean raw JSON objects correctly', () => {
    const raw = '{"title": "Kyoto Trip", "days": []}';
    const result = extractJson(raw);
    expect(result).toEqual({ title: 'Kyoto Trip', days: [] });
  });

  it('strips markdown code fences (```json ... ```)', () => {
    const raw = '```json\n{\n  "title": "Kyoto Trip",\n  "days": []\n}\n```';
    const result = extractJson(raw);
    expect(result.title).toBe('Kyoto Trip');
  });

  it('strips generic markdown code fences (``` ... ```)', () => {
    const raw = '```\n{"title": "Tokyo Stroll"}\n```';
    const result = extractJson(raw);
    expect(result.title).toBe('Tokyo Stroll');
  });

  it('extracts outermost JSON embedded in surrounding conversational prose', () => {
    const raw = `
      Certainly! Here is your custom travel itinerary:
      {
        "title": "Osaka Food Adventure",
        "days": [
          { "label": "Day 1", "stops": [] }
        ]
      }
      I hope you have a wonderful trip! Let me know if you need changes.
    `;
    const result = extractJson(raw);
    expect(result.title).toBe('Osaka Food Adventure');
    expect(result.days).toHaveLength(1);
  });

  it('throws EMPTY when input is empty string or whitespace', () => {
    expect(() => extractJson('')).toThrowError(/empty response/i);
    try {
      extractJson('   \n  ');
    } catch (err) {
      expect(err.code).toBe(ERROR_CODES.EMPTY);
    }
  });

  it('throws MALFORMED when input has no JSON brackets', () => {
    try {
      extractJson('Sorry, as an AI travel planner I cannot assist with this prompt.');
      expect.unreachable('Should have thrown MALFORMED');
    } catch (err) {
      expect(err.code).toBe(ERROR_CODES.MALFORMED);
    }
  });

  it('throws MALFORMED when JSON syntax is corrupted or unclosed', () => {
    const broken = '{"title": "Kyoto", "days": [ { "label": "Day 1" ';
    try {
      extractJson(broken);
      expect.unreachable('Should have thrown MALFORMED');
    } catch (err) {
      expect(err.code).toBe(ERROR_CODES.MALFORMED);
    }
  });

  it('throws WRONG_SHAPE when outermost JSON is an array rather than an object', () => {
    const arrayJson = '[{"title": "Day 1"}]';
    try {
      extractJson(arrayJson);
      expect.unreachable('Should have thrown WRONG_SHAPE');
    } catch (err) {
      expect(err.code).toBe(ERROR_CODES.WRONG_SHAPE);
    }
  });
});

