import { describe, it, expect } from 'vitest';
import { adjustDinnerSchedule } from '../services/scheduleFix.js';
import { recomputeTimes } from '../../shared/time.js';

describe('scheduleFix (adjustDinnerSchedule)', () => {
  it('nudges dinner start time to 18:30 when it lands earlier than 17:30', () => {
    const itinerary = {
      title: 'Kyoto Highlights',
      days: [
        {
          id: 'day-1',
          label: 'Day 1',
          startTime: '09:00',
          stops: [
            { name: 'Kiyomizu-dera', type: 'sight', durationMin: 120, gapBeforeMin: 0 },   // 09:00 - 11:00
            { name: 'Nishiki Lunch', type: 'food', durationMin: 60, gapBeforeMin: 0 },     // 11:00 - 12:00
            { name: 'Gion Walk', type: 'sight', durationMin: 120, gapBeforeMin: 0 },       // 12:00 - 14:00
            {
              name: 'Gion Kaiseki Dinner',
              type: 'food',
              durationMin: 90,
              gapBeforeMin: 45, // Currently starts at 14:00 + 45m = 14:45
            },
          ],
        },
      ],
    };

    // Pre-check: without adjustment, dinner starts at 14:45
    const initialDay = recomputeTimes(itinerary.days[0]);
    expect(initialDay.stops[3].startTime).toBe('14:45');

    const result = adjustDinnerSchedule(itinerary);
    const updatedDay = recomputeTimes(result.days[0]);
    const dinnerStop = updatedDay.stops[3];

    // Dinner should now start at exactly 18:30
    expect(dinnerStop.startTime).toBe('18:30');
    expect(dinnerStop.endTime).toBe('20:00');
    // Gap should have increased from 45 to 270 (14:00 + 270m = 18:30)
    expect(dinnerStop.gapBeforeMin).toBe(270);
  });

  it('leaves dinner untouched when it already starts at or after 17:30', () => {
    const itinerary = {
      title: 'Late Dinner Itinerary',
      days: [
        {
          id: 'day-1',
          label: 'Day 1',
          startTime: '09:00',
          stops: [
            { name: 'Morning Museum', type: 'sight', durationMin: 180, gapBeforeMin: 0 },  // 09:00 - 12:00
            { name: 'Lunch', type: 'food', durationMin: 60, gapBeforeMin: 0 },            // 12:00 - 13:00
            { name: 'Afternoon Hike', type: 'activity', durationMin: 240, gapBeforeMin: 0 }, // 13:00 - 17:00
            {
              name: 'Dinner at 17:30',
              type: 'food',
              durationMin: 90,
              gapBeforeMin: 30, // 17:00 + 30m = 17:30
            },
          ],
        },
        {
          id: 'day-2',
          label: 'Day 2',
          startTime: '10:00',
          stops: [
            { name: 'Sight', type: 'sight', durationMin: 180, gapBeforeMin: 0 },          // 10:00 - 13:00
            { name: 'Break', type: 'rest', durationMin: 120, gapBeforeMin: 0 },            // 13:00 - 15:00
            {
              name: 'Evening Dinner',
              type: 'food',
              durationMin: 90,
              gapBeforeMin: 240, // 15:00 + 240m = 19:00
            },
          ],
        },
      ],
    };

    const result = adjustDinnerSchedule(itinerary);

    // Day 1: starts at exactly 17:30 -> untouched
    expect(result.days[0].stops[3].gapBeforeMin).toBe(30);

    // Day 2: starts at 19:00 (> 17:30) -> untouched
    expect(result.days[1].stops[2].gapBeforeMin).toBe(240);
  });

  it('leaves the day untouched when the last stop is not food', () => {
    const itinerary = {
      title: 'Night Sightseeing',
      days: [
        {
          id: 'day-1',
          label: 'Day 1',
          startTime: '09:00',
          stops: [
            { name: 'Morning Temple', type: 'sight', durationMin: 120, gapBeforeMin: 0 }, // 09:00 - 11:00
            { name: 'Lunch', type: 'food', durationMin: 60, gapBeforeMin: 0 },           // 11:00 - 12:00
            {
              name: 'Afternoon Bamboo Grove',
              type: 'sight',
              durationMin: 120,
              gapBeforeMin: 0, // Starts at 12:00 (earlier than 17:30, but type is 'sight')
            },
          ],
        },
        {
          id: 'day-2',
          label: 'Day 2',
          startTime: '09:00',
          stops: [
            { name: 'Shopping', type: 'activity', durationMin: 180, gapBeforeMin: 0 },
            { name: 'Transit to Station', type: 'transit', durationMin: 60, gapBeforeMin: 15 },
          ],
        },
      ],
    };

    const result = adjustDinnerSchedule(itinerary);
    expect(result.days[0].stops[2].gapBeforeMin).toBe(0);
    expect(result.days[1].stops[1].gapBeforeMin).toBe(15);
  });

  it('respects the schema cap (360 min) when moving dinner towards 18:30', () => {
    const itinerary = {
      title: 'Short Morning Trip',
      days: [
        {
          id: 'day-1',
          label: 'Day 1',
          startTime: '09:00',
          stops: [
            { name: 'Quick Stop', type: 'sight', durationMin: 60, gapBeforeMin: 0 }, // 09:00 - 10:00
            {
              name: 'Early Dinner Need Huge Gap',
              type: 'food',
              durationMin: 60,
              gapBeforeMin: 0, // 10:00 start -> would need 510m to reach 18:30
            },
          ],
        },
      ],
    };

    const result = adjustDinnerSchedule(itinerary);
    const dinnerStop = result.days[0].stops[1];

    // Must be capped at schema limit MAX_GAP = 360
    expect(dinnerStop.gapBeforeMin).toBe(360);

    const recomputed = recomputeTimes(result.days[0]);
    // 10:00 + 360m (6h) = 16:00
    expect(recomputed.stops[1].startTime).toBe('16:00');
  });

  it('handles empty days, empty stops, and one-stop days without crashing', () => {
    // 1. Null / undefined itinerary
    expect(adjustDinnerSchedule(null)).toBeNull();
    expect(adjustDinnerSchedule(undefined)).toBeUndefined();

    // 2. Itinerary with empty days
    const emptyItinerary = { title: 'Empty', days: [] };
    expect(adjustDinnerSchedule(emptyItinerary)).toEqual({ title: 'Empty', days: [] });

    // 3. Day with empty stops
    const dayWithNoStops = {
      title: 'No Stops Day',
      days: [{ id: 'd1', label: 'Day 1', startTime: '09:00', stops: [] }],
    };
    const resNoStops = adjustDinnerSchedule(dayWithNoStops);
    expect(resNoStops.days[0].stops).toHaveLength(0);

    // 4. One-stop day where stop is not food
    const oneStopSight = {
      title: 'One Stop Sight',
      days: [
        {
          id: 'd1',
          label: 'Day 1',
          startTime: '09:00',
          stops: [{ name: 'Solo Sight', type: 'sight', durationMin: 120, gapBeforeMin: 0 }],
        },
      ],
    };
    const resSight = adjustDinnerSchedule(oneStopSight);
    expect(resSight.days[0].stops[0].gapBeforeMin).toBe(0);

    // 5. One-stop day where stop IS food
    const oneStopFood = {
      title: 'One Stop Food',
      days: [
        {
          id: 'd1',
          label: 'Day 1',
          startTime: '09:00',
          stops: [{ name: 'Brunch/Dinner', type: 'food', durationMin: 90, gapBeforeMin: 0 }],
        },
      ],
    };
    const resFood = adjustDinnerSchedule(oneStopFood);
    // Starts at 09:00, needs 570m -> capped at 360
    expect(resFood.days[0].stops[0].gapBeforeMin).toBe(360);
  });

  it('never reduces an existing gap on a dinner stop', () => {
    const itinerary = {
      title: 'Existing Gap',
      days: [
        {
          id: 'd1',
          label: 'Day 1',
          startTime: '09:00',
          stops: [
            { name: 'Sight', type: 'sight', durationMin: 120, gapBeforeMin: 0 },
            { name: 'Dinner', type: 'food', durationMin: 90, gapBeforeMin: 320 },
          ],
        },
      ],
    };

    const result = adjustDinnerSchedule(itinerary);
    // Gap should remain at least 320
    expect(result.days[0].stops[1].gapBeforeMin).toBeGreaterThanOrEqual(320);
  });

  it('operates as a pure function and does not mutate the input itinerary', () => {
    const original = {
      title: 'Purity Check',
      days: [
        {
          id: 'd1',
          label: 'Day 1',
          startTime: '09:00',
          stops: [
            { name: 'Museum', type: 'sight', durationMin: 60, gapBeforeMin: 0 },
            { name: 'Dinner', type: 'food', durationMin: 60, gapBeforeMin: 0 },
          ],
        },
      ],
    };

    const snapshot = JSON.stringify(original);
    const result = adjustDinnerSchedule(original);

    expect(JSON.stringify(original)).toBe(snapshot);
    expect(result).not.toBe(original);
    expect(result.days[0].stops[1].gapBeforeMin).toBeGreaterThan(0);
  });
});
