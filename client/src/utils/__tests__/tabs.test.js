import { describe, it, expect } from 'vitest';
import { getNextTabIndex } from '../tabs.js';

describe('getNextTabIndex (WAI-ARIA Tab Keyboard Navigation)', () => {
  const totalDays = 4; // indices 0, 1, 2, 3

  it('moves to next tab on ArrowRight', () => {
    expect(getNextTabIndex(0, totalDays, 'ArrowRight')).toBe(1);
    expect(getNextTabIndex(1, totalDays, 'ArrowRight')).toBe(2);
    expect(getNextTabIndex(2, totalDays, 'ArrowRight')).toBe(3);
  });

  it('wraps around to first tab from last on ArrowRight', () => {
    expect(getNextTabIndex(3, totalDays, 'ArrowRight')).toBe(0);
  });

  it('moves to previous tab on ArrowLeft', () => {
    expect(getNextTabIndex(3, totalDays, 'ArrowLeft')).toBe(2);
    expect(getNextTabIndex(2, totalDays, 'ArrowLeft')).toBe(1);
    expect(getNextTabIndex(1, totalDays, 'ArrowLeft')).toBe(0);
  });

  it('wraps around to last tab from first on ArrowLeft', () => {
    expect(getNextTabIndex(0, totalDays, 'ArrowLeft')).toBe(3);
  });

  it('jumps to first tab on Home', () => {
    expect(getNextTabIndex(2, totalDays, 'Home')).toBe(0);
    expect(getNextTabIndex(3, totalDays, 'Home')).toBe(0);
  });

  it('jumps to last tab on End', () => {
    expect(getNextTabIndex(0, totalDays, 'End')).toBe(3);
    expect(getNextTabIndex(1, totalDays, 'End')).toBe(3);
  });

  it('returns null for unhandled keys or empty lists', () => {
    expect(getNextTabIndex(0, totalDays, 'Enter')).toBeNull();
    expect(getNextTabIndex(0, totalDays, 'Space')).toBeNull();
    expect(getNextTabIndex(0, 0, 'ArrowRight')).toBeNull();
  });
});
