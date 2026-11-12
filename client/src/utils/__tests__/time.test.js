import { describe, it, expect } from 'vitest';
import { recomputeTimes, addMinutesToTime, formatDuration } from '../time.js';

describe('time utilities & recomputeTimes', () => {
  describe('formatDuration', () => {
    it('formats minutes under an hour', () => {
      expect(formatDuration(45)).toBe('45m');
      expect(formatDuration(15)).toBe('15m');
    });

    it('formats exact hours', () => {
      expect(formatDuration(60)).toBe('1h');
      expect(formatDuration(120)).toBe('2h');
    });

    it('formats hours and minutes combined', () => {
      expect(formatDuration(90)).toBe('1h 30m');
      expect(formatDuration(215)).toBe('3h 35m');
    });

    it('handles zero or negative inputs cleanly', () => {
      expect(formatDuration(0)).toBe('0m');
      expect(formatDuration(-10)).toBe('0m');
    });
  });

  describe('addMinutesToTime', () => {
    it('adds minutes within the same hour', () => {
      expect(addMinutesToTime('09:00', 30)).toBe('09:30');
    });

    it('rolls over hour boundaries', () => {
      expect(addMinutesToTime('09:45', 30)).toBe('10:15');
      expect(addMinutesToTime('09:00', 120)).toBe('11:00');
    });

    it('handles afternoon and 24-hour wrap', () => {
      expect(addMinutesToTime('14:30', 90)).toBe('16:00');
      expect(addMinutesToTime('23:30', 60)).toBe('00:30');
    });
  });

  describe('recomputeTimes', () => {
    it('handles a day with no stops', () => {
      const day = { label: 'Day 1', startTime: '09:00', stops: [] };
      const result = recomputeTimes(day);
      expect(result.stops).toHaveLength(0);
      expect(result.totalDurationMin).toBe(0);
    });

    it('computes cumulative start times and total duration across stops', () => {
      const day = {
        label: 'Day 1: Historic Rome',
        startTime: '09:00',
        stops: [
          { name: 'Colosseum', durationMin: 120 },      // 09:00 -> 11:00
          { name: 'Roman Forum', durationMin: 90 },     // 11:00 -> 12:30
          { name: 'Lunch Trattoria', durationMin: 60 }, // 12:30 -> 13:30
        ],
      };

      const result = recomputeTimes(day);
      expect(result.stops[0].startTime).toBe('09:00');
      expect(result.stops[0].endTime).toBe('11:00');

      expect(result.stops[1].startTime).toBe('11:00');
      expect(result.stops[1].endTime).toBe('12:30');

      expect(result.stops[2].startTime).toBe('12:30');
      expect(result.stops[2].endTime).toBe('13:30');

      // Total duration: 120 + 90 + 60 = 270 minutes (4h 30m)
      expect(result.totalDurationMin).toBe(270);
    });

    it('defaults to 09:00 when startTime is omitted or invalid', () => {
      const day = {
        label: 'Day 1',
        stops: [{ name: 'Stop 1', durationMin: 45 }],
      };
      const result = recomputeTimes(day);
      expect(result.startTime).toBe('09:00');
      expect(result.stops[0].startTime).toBe('09:00');
      expect(result.stops[0].endTime).toBe('09:45');
    });

    it('handles first stop with gapBeforeMin (first stop = day.startTime + gap)', () => {
      const day = {
        label: 'Day 1',
        startTime: '08:30',
        stops: [
          { name: 'Late Morning Brunch', durationMin: 60, gapBeforeMin: 90 }, // 08:30 + 90m = 10:00 -> 11:00
          { name: 'Museum Visit', durationMin: 120, gapBeforeMin: 0 },         // 11:00 -> 13:00
        ],
      };

      const result = recomputeTimes(day);
      expect(result.stops[0].startTime).toBe('10:00');
      expect(result.stops[0].endTime).toBe('11:00');
      expect(result.stops[1].startTime).toBe('11:00');
      expect(result.stops[1].endTime).toBe('13:00');
      // Total duration stays strictly active time (60 + 120 = 180 min)
      expect(result.totalDurationMin).toBe(180);
    });

    it('handles intermediate gaps before evening dinner and preserves active duration sum', () => {
      const day = {
        label: 'Day 1',
        startTime: '09:00',
        stops: [
          { name: 'Morning Temple', durationMin: 120, gapBeforeMin: 0 },    // 09:00 -> 11:00
          { name: 'Lunch', durationMin: 60, gapBeforeMin: 0 },             // 11:00 -> 12:00
          { name: 'Afternoon Stroll', durationMin: 90, gapBeforeMin: 0 },  // 12:00 -> 13:30
          { name: 'Dinner at Gion', durationMin: 90, gapBeforeMin: 300 },  // 13:30 + 5h = 18:30 -> 20:00
        ],
      };

      const result = recomputeTimes(day);
      expect(result.stops[0].startTime).toBe('09:00');
      expect(result.stops[0].endTime).toBe('11:00');
      expect(result.stops[1].startTime).toBe('11:00');
      expect(result.stops[1].endTime).toBe('12:00');
      expect(result.stops[2].startTime).toBe('12:00');
      expect(result.stops[2].endTime).toBe('13:30');
      expect(result.stops[3].startTime).toBe('18:30');
      expect(result.stops[3].endTime).toBe('20:00');

      // Total active duration: 120 + 60 + 90 + 90 = 360 min (6h), excluding the 300min gap
      expect(result.totalDurationMin).toBe(360);
    });

    it('handles times crossing midnight with 24-hour wrap-around', () => {
      const day = {
        label: 'Day 1',
        startTime: '21:00',
        stops: [
          { name: 'Late Night Dinner', durationMin: 90, gapBeforeMin: 0 }, // 21:00 -> 22:30
          { name: 'Midnight Walk', durationMin: 60, gapBeforeMin: 120 },    // 22:30 + 120m = 00:30 -> 01:30
          { name: 'Stargazing', durationMin: 60, gapBeforeMin: 30 },        // 01:30 + 30m = 02:00 -> 03:00
        ],
      };

      const result = recomputeTimes(day);
      expect(result.stops[0].startTime).toBe('21:00');
      expect(result.stops[0].endTime).toBe('22:30');
      expect(result.stops[1].startTime).toBe('00:30');
      expect(result.stops[1].endTime).toBe('01:30');
      expect(result.stops[2].startTime).toBe('02:00');
      expect(result.stops[2].endTime).toBe('03:00');
      expect(result.totalDurationMin).toBe(210);
    });

    it('clamps negative or excessive gaps and defaults non-numeric values to 0', () => {
      const day = {
        label: 'Day 1',
        startTime: '10:00',
        stops: [
          { name: 'Stop A', durationMin: 60, gapBeforeMin: -50 },     // clamped to 0 -> 10:00-11:00
          { name: 'Stop B', durationMin: 60, gapBeforeMin: 1000 },   // clamped to 360 -> 11:00 + 6h = 17:00-18:00
          { name: 'Stop C', durationMin: 30, gapBeforeMin: 'bad' },  // defaulted to 0 -> 18:00-18:30
        ],
      };

      const result = recomputeTimes(day);
      expect(result.stops[0].gapBeforeMin).toBe(0);
      expect(result.stops[0].startTime).toBe('10:00');
      expect(result.stops[0].endTime).toBe('11:00');

      expect(result.stops[1].gapBeforeMin).toBe(360);
      expect(result.stops[1].startTime).toBe('17:00');
      expect(result.stops[1].endTime).toBe('18:00');

      expect(result.stops[2].gapBeforeMin).toBe(0);
      expect(result.stops[2].startTime).toBe('18:00');
      expect(result.stops[2].endTime).toBe('18:30');
    });
  });
});
