import test from 'node:test';
import assert from 'node:assert/strict';
import {
  convertToAllUnits,
  convertUnitValue,
  describeConversionFormula,
  formatPhysicsNumber,
  UNIT_CATEGORIES,
} from './unitConverter';

test('all 24 unit categories round-trip accurately back to original value', () => {
  assert.equal(UNIT_CATEGORIES.length, 24);
  for (const cat of UNIT_CATEGORIES) {
    assert.ok(cat.units.length >= 4, `Category ${cat.id} should have at least 4 units`);
    for (const unit of cat.units) {
      const testVal = cat.id === 'temperature' ? 25 : 42.5;
      const toDefault = convertUnitValue(cat.id, unit.id, cat.defaultTo, testVal);
      const back = convertUnitValue(cat.id, cat.defaultTo, unit.id, toDefault);
      assert.ok(
        Math.abs(back - testVal) < 1e-6 * Math.max(1, Math.abs(testVal)),
        `Round-trip failed for ${cat.id}:${unit.id} (got ${back}, expected ${testVal})`
      );
    }
  }
});

test('speed, energy, pressure, mass, frequency, and radioactivity THPTQG constants match textbook values', () => {
  // 36 km/h = 10 m/s
  assert.ok(Math.abs(convertUnitValue('speed', 'km_h', 'm_s', 36) - 10) < 1e-9);
  // 1 u = 931.5 MeV/c²
  assert.ok(Math.abs(convertUnitValue('mass', 'u', 'mev_c2', 1) - 931.5) < 1e-6);
  // 1 kWh = 3.6 MJ
  assert.ok(Math.abs(convertUnitValue('energy', 'kWh', 'MJ', 1) - 3.6) < 1e-9);
  // 1 MeV = 1.6e-13 J
  assert.ok(Math.abs(convertUnitValue('energy', 'MeV', 'J', 1) - 1.6e-13) < 1e-22);
  // 1 atm = 101325 Pa = 760 mmHg
  assert.ok(Math.abs(convertUnitValue('pressure', 'atm', 'Pa', 1) - 101325) < 1e-9);
  assert.ok(Math.abs(convertUnitValue('pressure', 'atm', 'mmHg', 1) - 760) < 1e-6);
  // 50 Hz = 100*pi rad/s
  assert.ok(Math.abs(convertUnitValue('frequency', 'Hz', 'rad_s', 50) - 100 * Math.PI) < 1e-6);
  // 1 Ci = 37 GBq
  assert.ok(Math.abs(convertUnitValue('radioactivity', 'Ci', 'GBq', 1) - 37) < 1e-9);
  // 1 T = 10000 Gauss
  assert.ok(Math.abs(convertUnitValue('magnetic-field', 'T', 'G', 1) - 10000) < 1e-6);
});

test('affine temperature conversions (°C, K, °F, °R) are exact', () => {
  assert.ok(Math.abs(convertUnitValue('temperature', 'C', 'K', 0) - 273.15) < 1e-9);
  assert.ok(Math.abs(convertUnitValue('temperature', 'C', 'K', 27) - 300.15) < 1e-9);
  assert.ok(Math.abs(convertUnitValue('temperature', 'C', 'F', 0) - 32) < 1e-9);
  assert.ok(Math.abs(convertUnitValue('temperature', 'C', 'F', 100) - 212) < 1e-9);
  assert.ok(Math.abs(convertUnitValue('temperature', 'C', 'F', -40) - -40) < 1e-9);
  assert.ok(Math.abs(convertUnitValue('temperature', 'F', 'K', 32) - 273.15) < 1e-9);
});

test('convertToAllUnits, describeConversionFormula, and NaN handling work cleanly', () => {
  const rows = convertToAllUnits('capacitance', 'uF', 10);
  assert.equal(rows.length, 5);
  const nF = rows.find((r) => r.unit.id === 'nF');
  assert.ok(nF && Math.abs(nF.value - 10000) < 1e-6);

  assert.ok(Number.isNaN(convertUnitValue('length', 'm', 'km', NaN)));
  assert.equal(formatPhysicsNumber(NaN).standard, '—');
  assert.equal(describeConversionFormula('temperature', 'C', 'K'), 'T(K) = t(°C) + 273,15');
});
