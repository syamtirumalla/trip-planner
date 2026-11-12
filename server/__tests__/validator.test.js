import { describe, it, expect } from 'vitest';
import { validateAndSalvage } from '../services/validator.js';
import { StopSchema } from '../../shared/schema.js';
import { ERROR_CODES } from '../../shared/constants.js';

describe('validateAndSalvage', () => {
  const validTrip = {
    title: '4 Days in Kyoto',
    summary: 'Temples and gardens',
    days: [
      {
        label: 'Day 1: Historic Higashiyama',
        startTime: '09:00',
        stops: [
          {
            name: 'Kiyomizu-dera',
            type: 'sight',
            durationMin: 90,
            description: 'Historic hilltop temple with panoramic views.',
            costEstimate: '¥400',
            tip: 'Go early to avoid crowds',
          },
          {
            name: 'Nishiki Market',
            type: 'food',
            durationMin: 60,
            description: 'Bustling food street.',
            costEstimate: '¥1,500',
          },
        ],
      },
    ],
  };

  it('validates a pristine itinerary without modifications or warnings', () => {
    const result = validateAndSalvage(validTrip);
    expect(result.itinerary.title).toBe('4 Days in Kyoto');
    expect(result.itinerary.days).toHaveLength(1);
    expect(result.itinerary.days[0].stops).toHaveLength(2);
    expect(result.warnings).toHaveLength(0);
  });

  it('salvages valid stops and drops invalid stops with a warning', () => {
    const tripWithBadStop = {
      title: 'Tokyo Exploration',
      days: [
        {
          label: 'Day 1',
          startTime: '09:30',
          stops: [
            {
              name: 'Valid Sight',
              type: 'sight',
              durationMin: 60,
              description: 'A great sight to see',
            },
            {
              name: 'Corrupted Stop (Negative Duration)',
              type: 'sight',
              durationMin: -10, // Invalid duration
              description: 'This stop is broken',
            },
            {
              name: 'Another Good Stop',
              type: 'food',
              durationMin: 45,
              description: 'Delicious ramen spot',
            },
            {
              name: 'Invalid Type Stop',
              type: 'space-flight', // Invalid enum
              durationMin: 120,
              description: 'Not a supported stop category',
            },
          ],
        },
      ],
    };

    const result = validateAndSalvage(tripWithBadStop);
    expect(result.itinerary.days[0].stops).toHaveLength(2);
    expect(result.itinerary.days[0].stops[0].name).toBe('Valid Sight');
    expect(result.itinerary.days[0].stops[1].name).toBe('Another Good Stop');
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toMatch(/2 stops couldn't be loaded/i);
  });

  it('omits an entire day if all its stops are invalid', () => {
    const tripWithInvalidDay = {
      title: 'Multi-Day Trip',
      days: [
        {
          label: 'Day 1: All Invalid',
          startTime: '09:00',
          stops: [
            {
              name: 'Bad Stop 1',
              type: 'sight',
              durationMin: 9999, // Too long
              description: 'Broken',
            },
          ],
        },
        {
          label: 'Day 2: Valid Day',
          startTime: '10:00',
          stops: [
            {
              name: 'Good Stop',
              type: 'activity',
              durationMin: 60,
              description: 'Valid activity',
            },
          ],
        },
      ],
    };

    const result = validateAndSalvage(tripWithInvalidDay);
    expect(result.itinerary.days).toHaveLength(1);
    expect(result.itinerary.days[0].label).toBe('Day 2: Valid Day');
    expect(result.warnings.some((w) => w.includes('Day 1') && w.includes('omitted'))).toBe(true);
  });

  it('falls back to "09:00" start time if model returns invalid format', () => {
    const tripWithBadTime = {
      title: 'Time Test',
      days: [
        {
          label: 'Day 1',
          startTime: '9 oclock am', // Non-standard time format
          stops: [
            {
              name: 'Good Stop',
              type: 'sight',
              durationMin: 60,
              description: 'Valid stop',
            },
          ],
        },
      ],
    };

    const result = validateAndSalvage(tripWithBadTime);
    expect(result.itinerary.days[0].startTime).toBe('09:00');
  });

  it('throws EMPTY if days array is missing or empty', () => {
    try {
      validateAndSalvage({ title: 'No Days Trip', days: [] });
      expect.unreachable('Should have thrown EMPTY');
    } catch (err) {
      expect(err.code).toBe(ERROR_CODES.EMPTY);
    }
  });

  it('throws WRONG_SHAPE if all stops and days fail validation', () => {
    const completelyInvalid = {
      title: 'Total Failure Trip',
      days: [
        {
          label: 'Day 1',
          stops: [{ name: '', type: 'bad', durationMin: 0, description: '' }],
        },
      ],
    };

    try {
      validateAndSalvage(completelyInvalid);
      expect.unreachable('Should have thrown WRONG_SHAPE');
    } catch (err) {
      expect(err.code).toBe(ERROR_CODES.WRONG_SHAPE);
    }
  });

  it('throws WRONG_SHAPE if input is not an object', () => {
    try {
      validateAndSalvage(null);
      expect.unreachable('Should have thrown WRONG_SHAPE');
    } catch (err) {
      expect(err.code).toBe(ERROR_CODES.WRONG_SHAPE);
    }
  });

  describe('gapBeforeMin schema bounds & backward compatibility', () => {
    it('accepts valid gapBeforeMin within [0, 360]', () => {
      const validStop = {
        name: 'Evening Dinner',
        type: 'food',
        durationMin: 90,
        gapBeforeMin: 180,
        description: 'Authentic Kyoto dining',
      };
      const parsed = StopSchema.safeParse(validStop);
      expect(parsed.success).toBe(true);
      expect(parsed.data.gapBeforeMin).toBe(180);
    });

    it('defaults gapBeforeMin to 0 when omitted (backward compatibility)', () => {
      const legacyStop = {
        name: 'Historic Shrine',
        type: 'sight',
        durationMin: 60,
        description: 'Serene mountain shrine',
      };
      const parsed = StopSchema.safeParse(legacyStop);
      expect(parsed.success).toBe(true);
      expect(parsed.data.gapBeforeMin).toBe(0);
    });

    it('rejects negative gapBeforeMin', () => {
      const invalidStop = {
        name: 'Invalid Gap Stop',
        type: 'sight',
        durationMin: 60,
        gapBeforeMin: -15,
        description: 'Should fail validation',
      };
      const parsed = StopSchema.safeParse(invalidStop);
      expect(parsed.success).toBe(false);
    });

    it('rejects gapBeforeMin exceeding 360 minutes', () => {
      const invalidStop = {
        name: 'Excessive Gap Stop',
        type: 'sight',
        durationMin: 60,
        gapBeforeMin: 400,
        description: 'Should fail validation',
      };
      const parsed = StopSchema.safeParse(invalidStop);
      expect(parsed.success).toBe(false);
    });

    it('rejects non-integer gapBeforeMin', () => {
      const invalidStop = {
        name: 'Float Gap Stop',
        type: 'sight',
        durationMin: 60,
        gapBeforeMin: 45.5,
        description: 'Should fail validation',
      };
      const parsed = StopSchema.safeParse(invalidStop);
      expect(parsed.success).toBe(false);
    });
  });

  describe('validateAndSalvage gapBeforeMin resilience', () => {
    it('clamps out-of-range gapBeforeMin and defaults invalid types to 0 without dropping the stop', () => {
      const tripWithOddGaps = {
        title: 'Gap Clamping Test',
        days: [
          {
            label: 'Day 1',
            startTime: '09:00',
            stops: [
              {
                name: 'Stop with Negative Gap',
                type: 'sight',
                durationMin: 60,
                gapBeforeMin: -60, // Should clamp to 0
                description: 'Valid stop description',
              },
              {
                name: 'Stop with Huge Gap',
                type: 'food',
                durationMin: 90,
                gapBeforeMin: 9999, // Should clamp to 360
                description: 'Valid dinner description',
              },
              {
                name: 'Stop with String Gap',
                type: 'activity',
                durationMin: 45,
                gapBeforeMin: 'not a number', // Should default to 0
                description: 'Valid activity description',
              },
            ],
          },
        ],
      };

      const result = validateAndSalvage(tripWithOddGaps);
      expect(result.itinerary.days[0].stops).toHaveLength(3);

      expect(result.itinerary.days[0].stops[0].name).toBe('Stop with Negative Gap');
      expect(result.itinerary.days[0].stops[0].gapBeforeMin).toBe(0);

      expect(result.itinerary.days[0].stops[1].name).toBe('Stop with Huge Gap');
      expect(result.itinerary.days[0].stops[1].gapBeforeMin).toBe(360);

      expect(result.itinerary.days[0].stops[2].name).toBe('Stop with String Gap');
      expect(result.itinerary.days[0].stops[2].gapBeforeMin).toBe(0);

      // Verify no stops were dropped
      expect(result.warnings).toHaveLength(0);
    });
  });
});
