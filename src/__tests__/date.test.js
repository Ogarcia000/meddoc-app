import { isValidDate, todayString } from '../utils/date';

describe('isValidDate', () => {
  test('rejects invalid formats', () => {
    expect(isValidDate('')).toBe(false);
    expect(isValidDate('2026')).toBe(false);
    expect(isValidDate('2026-1-1')).toBe(false);
    expect(isValidDate('01-01-2026')).toBe(false);
    expect(isValidDate('not-a-date')).toBe(false);
    expect(isValidDate('2026/03/15')).toBe(false);
  });

  test('rejects impossible dates', () => {
    expect(isValidDate('2026-02-30')).toBe(false);
    expect(isValidDate('2026-13-01')).toBe(false);
    expect(isValidDate('2026-00-15')).toBe(false);
    expect(isValidDate('2026-06-31')).toBe(false);
  });

  test('handles leap years correctly', () => {
    expect(isValidDate('2024-02-29')).toBe(true);  // leap year
    expect(isValidDate('2023-02-29')).toBe(false);  // not leap year
  });

  test('accepts valid dates', () => {
    expect(isValidDate('2026-03-15')).toBe(true);
    expect(isValidDate('1990-01-01')).toBe(true);
    expect(isValidDate('2000-12-31')).toBe(true);
  });
});

describe('todayString', () => {
  test('returns YYYY-MM-DD format', () => {
    const result = todayString();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test('returns a valid date', () => {
    expect(isValidDate(todayString())).toBe(true);
  });
});
