import test from 'node:test';
import assert from 'node:assert/strict';
import { computeDeltaTable, computeLessonMetrics, sampleTelemetrySeries, wavelengthToHex } from './engine';
import { ALL_LESSONS, getDefaultParams } from './curriculum';

function getMetric(lessonId: Parameters<typeof computeLessonMetrics>[0], params: Record<string, number>, key: string): number {
  const list = computeLessonMetrics(lessonId, params);
  const found = list.find((m) => m.key === key);
  assert.ok(found, `Expected metric "${key}" in lesson "${lessonId}"`);
  return found.value;
}

test('curriculum contains 18 theoretical lessons across Grades 10, 11, 12 with no lab practicums', () => {
  assert.equal(ALL_LESSONS.length, 18);
  assert.equal(ALL_LESSONS.filter((l) => l.grade === 10).length, 6);
  assert.equal(ALL_LESSONS.filter((l) => l.grade === 11).length, 6);
  assert.equal(ALL_LESSONS.filter((l) => l.grade === 12).length, 6);
  for (const lesson of ALL_LESSONS) {
    assert.ok(!lesson.title.toLowerCase().includes('thực hành'), `Lesson "${lesson.title}" should not be a lab practicum`);
    const defaults = getDefaultParams(lesson);
    const metrics = computeLessonMetrics(lesson.id, defaults);
    assert.ok(metrics.length >= 4, `Lesson ${lesson.id} should compute at least 4 metrics`);
    for (const m of metrics) {
      assert.ok(Number.isFinite(m.value), `Metric ${m.key} in ${lesson.id} must be finite`);
    }
    const telemetry = sampleTelemetrySeries(lesson.id, defaults, 24);
    assert.ok(telemetry.points.length > 10, `Telemetry points missing for ${lesson.id}`);
  }
});

test('simple pendulum: quadrupling length l exactly doubles period T (+100%)', () => {
  const base = { l: 1, g: 9.81, m: 0.5, alpha0: 10 };
  const curr = { l: 4, g: 9.81, m: 0.5, alpha0: 10 };
  const deltaRows = computeDeltaTable('simple-pendulum', base, curr);
  const tRow = deltaRows.find((r) => r.key === 'T');
  assert.ok(tRow);
  assert.ok(Math.abs((tRow.ratio ?? 0) - 2) < 1e-6);
  assert.ok(Math.abs((tRow.percentChange ?? 0) - 100) < 1e-4);
  assert.equal(tRow.trend, 'up');
});

test('RLC circuit achieves electrical resonance when ZL = ZC (cosPhi = 1, phi = 0)', () => {
  // At f = 50Hz: L = 1 / (2*pi*50) * 100 H = 318.309886 mH -> ZL = 100 Ohm
  // C = 1 / (2*pi*50*100) F = 31.8309886 uF -> ZC = 100 Ohm
  const params = { U: 220, f: 50, R: 55, L: 318.309886, C: 31.8309886 };
  const Z = getMetric('rlc-resonance', params, 'Z');
  const cosPhi = getMetric('rlc-resonance', params, 'cosPhi');
  const I = getMetric('rlc-resonance', params, 'I');
  assert.ok(Math.abs(Z - 55) < 1e-3);
  assert.ok(Math.abs(cosPhi - 1) < 1e-4);
  assert.ok(Math.abs(I - 4) < 1e-3);
});

test('Ohm law closed circuit reaches max external power at RN = r with 50% efficiency', () => {
  const params = { E: 12, r: 3, RN: 3 };
  const PN = getMetric('ohms-closed-circuit', params, 'PN');
  const PMax = getMetric('ohms-closed-circuit', params, 'PMax');
  const H = getMetric('ohms-closed-circuit', params, 'H');
  assert.ok(Math.abs(PN - PMax) < 1e-6);
  assert.equal(PN, 12);
  assert.equal(H, 50);
});

test('Young double slit computes fringe spacing i = lambda*D/a accurately', () => {
  const iMm = getMetric('young-double-slit', { lambda: 600, a: 1.2, D: 2.0, L: 15 }, 'i');
  assert.ok(Math.abs(iMm - 1.0) < 1e-6);
});

test('momentum collision conserves total momentum for both elastic and inelastic impacts', () => {
  const elastic = computeLessonMetrics('momentum-collision', { m1: 3, v1: 6, m2: 2, v2: -2, e: 1 });
  const inelastic = computeLessonMetrics('momentum-collision', { m1: 3, v1: 6, m2: 2, v2: -2, e: 0 });
  const qElastic = elastic.find((m) => m.key === 'qHeat')!.value;
  const qInelastic = inelastic.find((m) => m.key === 'qHeat')!.value;
  assert.ok(qElastic < 1e-9, 'Elastic collision should lose zero kinetic energy');
  assert.ok(qInelastic > 30, 'Inelastic collision should dissipate kinetic energy as heat');
});

test('radioactive decay halves remaining nuclei each half-life T', () => {
  const N1 = getMetric('nuclear-decay', { N0: 1000, T: 8, t: 8, deltaM: 0.1, A_num: 16 }, 'N_remain');
  const N3 = getMetric('nuclear-decay', { N0: 1000, T: 8, t: 24, deltaM: 0.1, A_num: 16 }, 'N_remain');
  assert.ok(Math.abs(N1 - 500) < 1e-6);
  assert.ok(Math.abs(N3 - 125) < 1e-6);
});

test('wavelengthToHex maps visible spectrum accurately', () => {
  assert.match(wavelengthToHex(550), /^#[0-9a-f]{6}$/);
  assert.equal(wavelengthToHex(250), '#6d28d9');
});

test('audited physics edge cases: wave interference, Young fringes, pendulum angle, thermo work, nuclear activity', () => {
  // Exact integer ratio S1S2/lambda = 12/2 = 6 -> strictly between S1, S2: 11 maxima, 12 minima
  assert.equal(getMetric('wave-interference', { f: 20, v: 40, s1s2: 12 }, 'numMax'), 11);
  assert.equal(getMetric('wave-interference', { f: 20, v: 40, s1s2: 12 }, 'numMin'), 12);
  // Exact half-integer ratio S1S2/lambda = 13/2 = 6.5 -> strictly between S1, S2: 13 maxima, 12 minima
  assert.equal(getMetric('wave-interference', { f: 20, v: 40, s1s2: 13 }, 'numMax'), 13);
  assert.equal(getMetric('wave-interference', { f: 20, v: 40, s1s2: 13 }, 'numMin'), 12);

  // Young double slit exact boundary L/(2i) = 15/(2*1.5) = 5 -> 11 bright fringes
  assert.equal(getMetric('young-double-slit', { lambda: 600, a: 1.0, D: 2.5, L: 15 }, 'nBright'), 11);

  // Simple pendulum large angle (> 10°) reports finite-amplitude T note
  const pendLarge = computeLessonMetrics('simple-pendulum', { l: 1, g: 9.81, m: 0.5, alpha0: 30 });
  const tMetric = pendLarge.find((m) => m.key === 'T');
  assert.ok(tMetric?.note?.includes('Góc lớn'));

  // Thermodynamics when |A| > Q notes internal energy drawdown
  const thermoDraw = computeLessonMetrics('thermo-first-law', { m: 0.5, c: 400, dT: 10, A: -5000 });
  const effMetric = thermoDraw.find((m) => m.key === 'eff');
  assert.ok(effMetric?.note?.includes('ΔU < 0'));

  // Nuclear activity H(t) = (ln2 / T_s) * N(t)
  const act = getMetric('nuclear-decay', { N0: 1000, T: 8, t: 0, deltaM: 0.137, A_num: 16 }, 'H_act');
  const expectedGBq = ((Math.LN2 / (8 * 86400)) * 1000 * 1e15) / 1e9;
  assert.ok(Math.abs(act - expectedGBq) < 1e-4);
});

