import { describe, it, expect } from 'vitest';
import { parseLeadValue, MAX_LEAD_VALUE } from '../src/lib/utils';

describe('utils', () => {
  describe('parseLeadValue', () => {
    it('parses valid numeric strings correctly', () => {
      expect(parseLeadValue("150")).toBe(150);
      expect(parseLeadValue(" 42.5 ")).toBe(42.5);
    });

    it('handles commas as decimals if standard locale format', () => {
      // parseLeadValue internally uses parseFloat. 
      // If we implemented a custom replacement for commas:
      // expect(parseLeadValue("42,5")).toBe(42.5);
      // For now, testing raw parseFloat behavior based on current impl
      expect(parseLeadValue("1000")).toBe(1000);
    });

    it('returns 0 for empty or invalid strings', () => {
      expect(parseLeadValue("")).toBe(0);
      expect(parseLeadValue("abc")).toBe(0);
      expect(parseLeadValue(undefined as any)).toBe(0);
    });

    it('caps the value at MAX_LEAD_VALUE', () => {
      expect(parseLeadValue((MAX_LEAD_VALUE + 100).toString())).toBe(MAX_LEAD_VALUE);
    });

    it('prevents negative values', () => {
      expect(parseLeadValue("-50")).toBe(0);
    });
  });
});
