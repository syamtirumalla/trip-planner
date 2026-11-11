import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  STORAGE_KEY,
  saveItinerary,
  loadSavedItinerary,
  clearSavedItinerary,
} from '../storage.js';

describe('LocalStorage Auto-Save & Re-Validation (storage.js)', () => {
  let mockStore = {};

  const mockLocalStorage = {
    getItem: vi.fn((key) => mockStore[key] || null),
    setItem: vi.fn((key, val) => {
      mockStore[key] = String(val);
    }),
    removeItem: vi.fn((key) => {
      delete mockStore[key];
    }),
    clear: vi.fn(() => {
      mockStore = {};
    }),
  };

  beforeEach(() => {
    mockStore = {};
    vi.clearAllMocks();
    global.window = {
      localStorage: mockLocalStorage,
    };
  });

  const validItinerary = {
    title: 'Kyoto Journey',
    summary: 'A cultural trip',
    days: [
      {
        label: 'Day 1',
        startTime: '09:00',
        stops: [
          {
            name: 'Kinkaku-ji',
            type: 'sight',
            durationMin: 60,
            description: 'The Golden Pavilion',
          },
        ],
      },
    ],
  };

  it('saves itinerary and prompt with version 1', () => {
    const success = saveItinerary(validItinerary, 'Kyoto in spring');
    expect(success).toBe(true);
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      STORAGE_KEY,
      expect.stringContaining('"version":1')
    );
  });

  it('loads and re-validates a valid saved itinerary', () => {
    saveItinerary(validItinerary, 'Kyoto in spring');

    const loaded = loadSavedItinerary();
    expect(loaded).not.toBeNull();
    expect(loaded.itinerary.title).toBe('Kyoto Journey');
    expect(loaded.prompt).toBe('Kyoto in spring');
  });

  it('discards and deletes stored data if version is missing or mismatched', () => {
    mockStore[STORAGE_KEY] = JSON.stringify({
      version: 99, // Outdated version
      itinerary: validItinerary,
    });

    const loaded = loadSavedItinerary();
    expect(loaded).toBeNull();
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEY);
  });

  it('discards and deletes stored data if corrupted JSON', () => {
    mockStore[STORAGE_KEY] = '{ corrupted json :::';

    const loaded = loadSavedItinerary();
    expect(loaded).toBeNull();
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEY);
  });

  it('discards and deletes stored data if schema validation fails', () => {
    const invalidItinerary = {
      title: '', // Invalid empty title
      days: [], // Invalid empty days
    };

    mockStore[STORAGE_KEY] = JSON.stringify({
      version: 1,
      itinerary: invalidItinerary,
    });

    const loaded = loadSavedItinerary();
    expect(loaded).toBeNull();
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEY);
  });

  it('clears stored itinerary on clearSavedItinerary', () => {
    saveItinerary(validItinerary, 'Kyoto');
    expect(mockStore[STORAGE_KEY]).toBeDefined();

    clearSavedItinerary();
    expect(mockStore[STORAGE_KEY]).toBeUndefined();
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEY);
  });

  it('safely handles storage being disabled or throwing exceptions', () => {
    global.window = {
      localStorage: {
        getItem: () => {
          throw new Error('SecurityError: Access is denied');
        },
        setItem: () => {
          throw new Error('QuotaExceededError');
        },
        removeItem: () => {
          throw new Error('SecurityError');
        },
      },
    };

    expect(() => saveItinerary(validItinerary)).not.toThrow();
    expect(saveItinerary(validItinerary)).toBe(false);

    expect(() => loadSavedItinerary()).not.toThrow();
    expect(loadSavedItinerary()).toBeNull();

    expect(() => clearSavedItinerary()).not.toThrow();
  });
});

