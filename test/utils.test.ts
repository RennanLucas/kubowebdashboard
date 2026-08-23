import { describe, it, expect } from 'vitest';
import { parseLeadValue, MAX_LEAD_VALUE } from '../src/lib/utils';

describe('utils', () => {
  describe('parseLeadValue', () => {
    // parseLeadValue returns { value, error }: on success value is the parsed
    // number and error is null; on failure value is null and error is a
    // user-facing message.

    it('parses valid integer strings', () => {
      expect(parseLeadValue('150')).toEqual({ value: 150, error: null });
      expect(parseLeadValue('1000')).toEqual({ value: 1000, error: null });
    });

    it('parses decimals written with a dot', () => {
      expect(parseLeadValue('42.5')).toEqual({ value: 42.5, error: null });
    });

    it('parses decimals written with a comma (pt-BR locale)', () => {
      expect(parseLeadValue('42,5')).toEqual({ value: 42.5, error: null });
    });

    it('parses values with thousand separators', () => {
      // "1.000,50" -> 1000.5 (dot as thousands, comma as decimal)
      expect(parseLeadValue('1.000,50')).toEqual({ value: 1000.5, error: null });
    });

    it('trims surrounding whitespace', () => {
      expect(parseLeadValue(' 42.5 ')).toEqual({ value: 42.5, error: null });
    });

    it('rounds to two decimal places', () => {
      expect(parseLeadValue('3.14159')).toEqual({ value: 3.14, error: null });
    });

    it('rejects empty input with an error', () => {
      const result = parseLeadValue('');
      expect(result.value).toBeNull();
      expect(result.error).toBeTruthy();
    });

    it('rejects undefined input with an error', () => {
      const result = parseLeadValue(undefined as unknown as string);
      expect(result.value).toBeNull();
      expect(result.error).toBeTruthy();
    });

    it('rejects non-numeric strings with an error', () => {
      const result = parseLeadValue('abc');
      expect(result.value).toBeNull();
      expect(result.error).toBeTruthy();
    });

    it('rejects negative values', () => {
      const result = parseLeadValue('-50');
      expect(result.value).toBeNull();
      expect(result.error).toMatch(/negativo/i);
    });

    it('accepts a value exactly at MAX_LEAD_VALUE', () => {
      expect(parseLeadValue(MAX_LEAD_VALUE.toString())).toEqual({
        value: MAX_LEAD_VALUE,
        error: null,
      });
    });

    it('rejects values above MAX_LEAD_VALUE', () => {
      const result = parseLeadValue((MAX_LEAD_VALUE + 100).toString());
      expect(result.value).toBeNull();
      expect(result.error).toMatch(/máximo/i);
    });
  });
});
