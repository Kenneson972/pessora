import { describe, it, expect } from 'vitest';
import { formatDate, formatDateShort } from '../lib/eventDateFormat';

describe('eventDateFormat', () => {
  describe('formatDate', () => {
    it('should format a date string with full date info (year included)', () => {
      const result = formatDate('2026-09-15');
      // Result should include weekday, day, month, and year in French
      expect(result).toMatch(/^[a-z]+\s+15\s+septembre\s+2026$/i);
    });

    it('should handle different months', () => {
      const result = formatDate('2026-01-10');
      expect(result).toMatch(/^[a-z]+\s+10\s+janvier\s+2026$/i);
    });

    it('should handle single digit days', () => {
      const result = formatDate('2026-03-05');
      expect(result).toMatch(/^[a-z]+\s+5\s+mars\s+2026$/i);
    });

    it('should append T00:00:00 to avoid UTC timezone parsing', () => {
      // Test that dates are parsed as local time, not UTC
      const result = formatDate('2026-06-15');
      // Should contain the date parts
      expect(result).toContain('15');
      expect(result).toContain('juin');
      expect(result).toContain('2026');
    });
  });

  describe('formatDateShort', () => {
    it('should format a date string without year', () => {
      const result = formatDateShort('2026-09-15');
      // Result should include weekday, day, and month but NOT year
      expect(result).toMatch(/^[a-z]+\s+15\s+septembre$/i);
      expect(result).not.toContain('2026');
    });

    it('should handle different months without year', () => {
      const result = formatDateShort('2026-01-10');
      expect(result).toMatch(/^[a-z]+\s+10\s+janvier$/i);
      expect(result).not.toContain('2026');
    });

    it('should handle single digit days without year', () => {
      const result = formatDateShort('2026-03-05');
      expect(result).toMatch(/^[a-z]+\s+5\s+mars$/i);
      expect(result).not.toContain('2026');
    });

    it('should append T00:00:00 to avoid UTC timezone parsing', () => {
      // Test that dates are parsed as local time, not UTC
      const result = formatDateShort('2026-06-15');
      // Should contain the date parts but not year
      expect(result).toContain('15');
      expect(result).toContain('juin');
      expect(result).not.toContain('2026');
    });
  });
});
