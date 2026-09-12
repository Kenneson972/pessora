import { describe, it, expect } from 'vitest';
import { formatDate, formatDateShort } from '../lib/eventDateFormat';

describe('eventDateFormat', () => {
  describe('formatDate', () => {
    it('should format a date string with full date info (year included)', () => {
      const result = formatDate('2026-09-15');
      expect(result).toBe('mardi 15 septembre 2026');
    });

    it('should handle different months', () => {
      const result = formatDate('2026-01-10');
      expect(result).toBe('samedi 10 janvier 2026');
    });

    it('should handle single digit days', () => {
      const result = formatDate('2026-03-05');
      expect(result).toBe('jeudi 5 mars 2026');
    });

    it('should append T00:00:00 to avoid UTC timezone parsing', () => {
      // Test that dates are parsed as local time, not UTC
      const result = formatDate('2026-06-15');
      expect(result).toBe('lundi 15 juin 2026');
    });
  });

  describe('formatDateShort', () => {
    it('should format a date string without year', () => {
      const result = formatDateShort('2026-09-15');
      expect(result).toBe('mardi 15 septembre');
    });

    it('should handle different months without year', () => {
      const result = formatDateShort('2026-01-10');
      expect(result).toBe('samedi 10 janvier');
    });

    it('should handle single digit days without year', () => {
      const result = formatDateShort('2026-03-05');
      expect(result).toBe('jeudi 5 mars');
    });

    it('should append T00:00:00 to avoid UTC timezone parsing', () => {
      // Test that dates are parsed as local time, not UTC
      const result = formatDateShort('2026-06-15');
      expect(result).toBe('lundi 15 juin');
    });
  });
});
