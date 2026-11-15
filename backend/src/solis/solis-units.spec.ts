import { deriveBatteryState, deriveGridState, num, toKw, toKwh } from './solis-units';

describe('solis-units', () => {
  describe('num', () => {
    it('parses numbers and numeric strings', () => {
      expect(num(42)).toBe(42);
      expect(num('3.14')).toBe(3.14);
      expect(num('-2.5')).toBe(-2.5);
    });

    it('returns 0 for NaN, Infinity, null, undefined, and empty string', () => {
      expect(num(NaN)).toBe(0);
      expect(num(Infinity)).toBe(0);
      expect(num(-Infinity)).toBe(0);
      expect(num('not-a-number')).toBe(0);
      expect(num(null)).toBe(0);
      expect(num(undefined)).toBe(0);
      expect(num('')).toBe(0);
    });
  });

  describe('toKw', () => {
    it('converts W, kW, and MW accurately', () => {
      expect(toKw(2323, 'W')).toBe(2.323);
      expect(toKw(-1500, 'w')).toBe(-1.5);
      expect(toKw(2.323, 'kW')).toBe(2.323);
      expect(toKw(1.5, 'MW')).toBe(1500);
    });

    it('assumes kW for empty, null, undefined, or unknown units', () => {
      expect(toKw(4.2, '')).toBe(4.2);
      expect(toKw(4.2, null)).toBe(4.2);
      expect(toKw(4.2, undefined)).toBe(4.2);
      expect(toKw(4.2, 'kVA')).toBe(4.2);
    });

    it('handles invalid numeric inputs safely', () => {
      expect(toKw('abc', 'W')).toBe(0);
      expect(toKw(undefined, 'MW')).toBe(0);
    });
  });

  describe('toKwh', () => {
    it('converts Wh, kWh, and MWh accurately', () => {
      expect(toKwh(500, 'Wh')).toBe(0.5);
      expect(toKwh(11.2, 'kWh')).toBe(11.2);
      expect(toKwh(1.088, 'MWh')).toBe(1088);
    });

    it('assumes kWh for empty, null, undefined, or unknown units', () => {
      expect(toKwh(9.5, '')).toBe(9.5);
      expect(toKwh(9.5, null)).toBe(9.5);
      expect(toKwh(9.5, undefined)).toBe(9.5);
      expect(toKwh(9.5, 'varh')).toBe(9.5);
    });
  });

  describe('deriveGridState', () => {
    it('returns idle within 0.05 kW threshold', () => {
      expect(deriveGridState(0)).toBe('idle');
      expect(deriveGridState(0.049)).toBe('idle');
      expect(deriveGridState(-0.049)).toBe('idle');
    });

    it('returns exporting for positive and importing for negative', () => {
      expect(deriveGridState(0.05)).toBe('exporting');
      expect(deriveGridState(2.5)).toBe('exporting');
      expect(deriveGridState(-0.05)).toBe('importing');
      expect(deriveGridState(-1.2)).toBe('importing');
    });
  });

  describe('deriveBatteryState', () => {
    it('returns full when idle and SOC >= 95, otherwise idle', () => {
      expect(deriveBatteryState(0, 95)).toBe('full');
      expect(deriveBatteryState(0.02, 97)).toBe('full');
      expect(deriveBatteryState(0, 94)).toBe('idle');
      expect(deriveBatteryState(-0.04, 50)).toBe('idle');
    });

    it('returns charging for positive and discharging for negative', () => {
      expect(deriveBatteryState(1.2, 98)).toBe('charging');
      expect(deriveBatteryState(-0.8, 96)).toBe('discharging');
    });
  });
});
