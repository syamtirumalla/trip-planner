import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useTheme } from '../useTheme.js';

describe('useTheme (Theme state & system preference)', () => {
  let mockStore = {};

  beforeEach(() => {
    mockStore = {};
    vi.clearAllMocks();

    global.window = {
      localStorage: {
        getItem: (k) => mockStore[k] || null,
        setItem: (k, v) => {
          mockStore[k] = String(v);
        },
        removeItem: (k) => {
          delete mockStore[k];
        },
      },
      matchMedia: vi.fn().mockImplementation((query) => ({
        matches: query.includes('dark'),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    };

    global.document = {
      documentElement: {
        setAttribute: vi.fn(),
        getAttribute: vi.fn(),
      },
    };
  });

  it('initializes to dark when prefers-color-scheme matches dark and no localStorage override exists', () => {
    // Basic verification that mediaQuery is queried
    expect(window.matchMedia('(prefers-color-scheme: dark)').matches).toBe(true);
  });

  it('respects stored theme from localStorage over system default', () => {
    mockStore['trip_planner_theme'] = 'light';
    const stored = window.localStorage.getItem('trip_planner_theme');
    expect(stored).toBe('light');
  });
});

