import { describe, it, expect } from 'vitest';
import { detectRequestedDays, checkRequestedDaysMatch } from '../services/semanticCheck.js';

describe('semanticCheck (detectRequestedDays & checkRequestedDaysMatch)', () => {
  describe('detectRequestedDays', () => {
    it('detects digit day expressions', () => {
      expect(detectRequestedDays('4 days in Kyoto')).toBe(4);
      expect(detectRequestedDays('3-day tour in Rome')).toBe(3);
      expect(detectRequestedDays('10 days exploring Spain')).toBe(10);
      expect(detectRequestedDays('1 day flash trip')).toBe(1);
    });

    it('detects written word day expressions', () => {
      expect(detectRequestedDays('four days in Paris')).toBe(4);
      expect(detectRequestedDays('three-day escape to Tokyo')).toBe(3);
      expect(detectRequestedDays('seven days road trip')).toBe(7);
    });

    it('detects conversational duration phrases', () => {
      expect(detectRequestedDays('a week in Italy')).toBe(7);
      expect(detectRequestedDays('1 week in Greece')).toBe(7);
      expect(detectRequestedDays('two weeks in Australia')).toBe(14);
      expect(detectRequestedDays('weekend trip to Prague')).toBe(2);
      expect(detectRequestedDays('a long weekend in Vienna')).toBe(3);
    });

    it('returns null when duration is unspecified or ambiguous', () => {
      expect(detectRequestedDays('I want to visit Tokyo and eat sushi')).toBeNull();
      expect(detectRequestedDays('')).toBeNull();
      expect(detectRequestedDays(null)).toBeNull();
    });
  });

  describe('checkRequestedDaysMatch', () => {
    it('returns a warning when fewer days are generated than requested', () => {
      const warning = checkRequestedDaysMatch('4 days in Kyoto', 2);
      expect(warning).toBe('You asked for 4 days but only 2 were generated.');
    });

    it('returns a warning for conversational phrases when under-generated', () => {
      const warning = checkRequestedDaysMatch('a week in Italy', 4);
      expect(warning).toBe('You asked for 7 days but only 4 were generated.');
    });

    it('returns null when day count matches or exceeds requested', () => {
      expect(checkRequestedDaysMatch('4 days in Kyoto', 4)).toBeNull();
      expect(checkRequestedDaysMatch('3 days in Rome', 4)).toBeNull();
    });

    it('returns null when no day count was specified in prompt', () => {
      expect(checkRequestedDaysMatch('Visit Kyoto for temples and food', 2)).toBeNull();
    });
  });
});
