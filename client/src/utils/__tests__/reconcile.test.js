import { describe, it, expect } from 'vitest';
import { reconcileItinerary } from '../reconcile.js';

describe('reconcileItinerary (ID persistence across refinement)', () => {
  const oldItinerary = {
    id: 'itinerary-1',
    title: 'Kyoto Trip',
    days: [
      {
        id: 'day-1',
        label: 'Day 1',
        stops: [
          { id: 'stop-kinkaku', name: 'Kinkaku-ji', durationMin: 60 },
          { id: 'stop-ryoan', name: 'Ryoan-ji', durationMin: 45 },
        ],
      },
      {
        id: 'day-2',
        label: 'Day 2',
        stops: [
          { id: 'stop-fushimi', name: 'Fushimi Inari', durationMin: 120 },
        ],
      },
    ],
  };

  it('preserves client-side IDs for unchanged stops and days', () => {
    const rawRefined = {
      title: 'Kyoto Trip (Relaxed)',
      days: [
        {
          label: 'Day 1',
          stops: [
            { name: 'Kinkaku-ji', durationMin: 90 }, // Unchanged stop, duration updated
            { name: 'New Cafe Stop', durationMin: 30 }, // Newly added stop
          ],
        },
        {
          label: 'Day 2',
          stops: [
            { name: 'Fushimi Inari', durationMin: 100 },
          ],
        },
      ],
    };

    const reconciled = reconcileItinerary(rawRefined, oldItinerary);

    // Day 1 & Day 2 preserve day IDs
    expect(reconciled.days[0].id).toBe('day-1');
    expect(reconciled.days[1].id).toBe('day-2');

    // Kinkaku-ji preserves stop-kinkaku ID
    expect(reconciled.days[0].stops[0].id).toBe('stop-kinkaku');

    // New Cafe Stop receives a new generated ID
    expect(reconciled.days[0].stops[1].id).toBeDefined();
    expect(reconciled.days[0].stops[1].id).not.toBe('stop-kinkaku');
    expect(reconciled.days[0].stops[1].id).not.toBe('stop-ryoan');

    // Fushimi Inari preserves its ID
    expect(reconciled.days[1].stops[0].id).toBe('stop-fushimi');
  });

  it('handles empty or missing old itinerary by assigning new IDs', () => {
    const rawRefined = {
      title: 'Brand New Trip',
      days: [
        {
          label: 'Day 1',
          stops: [{ name: 'Colosseum', durationMin: 60 }],
        },
      ],
    };

    const reconciled = reconcileItinerary(rawRefined, null);
    expect(reconciled.days[0].id).toBeDefined();
    expect(reconciled.days[0].stops[0].id).toBeDefined();
  });
});

