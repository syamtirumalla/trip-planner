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
  });
});
