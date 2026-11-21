import { CalculatedMetric, DeltaRow, LessonId, ParamMap, TelemetrySeries } from './types';

export const PHYSICS_CONSTANTS = {
  K_COULOMB: 9e9, // N·m²/C²
  H_PLANCK: 6.625e-34, // J·s
  C_LIGHT: 3e8, // m/s
  E_CHARGE: 1.6e-19, // C
  M_ELECTRON: 9.1e-31, // kg
  R_GAS: 8.31, // J/(mol·K)
  K_BOLTZMANN: 1.38e-23, // J/K
  UC2_MEV: 931.5, // MeV/u
  BOHR_R0: 5.3e-11, // m
};

/**
 * Physically calibrated visible light wavelength (380nm - 760nm) to RGB hex color.
 * UV (<380nm) renders deep violet-indigo; IR (>760nm) renders dark crimson.
 */
export function wavelengthToHex(wavelengthNm: number): string {
  let r = 0;
  let g = 0;
  let b = 0;
  const wl = wavelengthNm;

  if (wl < 380) {
    return '#6d28d9'; // UV indicator
  } else if (wl >= 380 && wl < 440) {
    r = -(wl - 440) / (440 - 380);
    g = 0;
    b = 1;
  } else if (wl >= 440 && wl < 490) {
    r = 0;
    g = (wl - 440) / (490 - 440);
    b = 1;
  } else if (wl >= 490 && wl < 510) {
    r = 0;
    g = 1;
    b = -(wl - 510) / (510 - 490);
  } else if (wl >= 510 && wl < 580) {
    r = (wl - 510) / (580 - 510);
    g = 1;
    b = 0;
  } else if (wl >= 580 && wl < 645) {
    r = 1;
    g = -(wl - 645) / (645 - 580);
    b = 0;
  } else if (wl >= 645 && wl <= 760) {
    r = 1;
    g = 0;
    b = 0;
  } else {
    return '#991b1b'; // IR indicator
  }

  let factor = 1.0;
  if (wl >= 380 && wl < 420) {
    factor = 0.35 + (0.65 * (wl - 380)) / (420 - 380);
  } else if (wl > 700 && wl <= 760) {
    factor = 0.35 + (0.65 * (760 - wl)) / (760 - 700);
  }

  const gamma = 0.8;
  const toByte = (c: number) =>
    c === 0 ? 0 : Math.round(255 * Math.pow(c * factor, gamma));

  const hex = (v: number) => v.toString(16).padStart(2, '0');
  return `#${hex(toByte(r))}${hex(toByte(g))}${hex(toByte(b))}`;
}

export function computeLessonMetrics(lessonId: LessonId, params: ParamMap): CalculatedMetric[] {
  switch (lessonId) {
    case 'kinematics-1d': {
      const v0 = params.v0 ?? 5;
      const a = params.a ?? 2;
      const t = params.t ?? 6;
      const v = v0 + a * t;
      const d = v0 * t + 0.5 * a * t * t;
      // Compute total path length S (accounts for velocity reversal if v0 and a have opposite signs)
      let s = Math.abs(d);
      let tStop = -1;
      if (v0 * a < 0 && a !== 0) {
        tStop = -v0 / a;
        if (tStop > 0 && tStop < t) {
          const d1 = v0 * tStop + 0.5 * a * tStop * tStop;
          const d2 = d - d1;
          s = Math.abs(d1) + Math.abs(d2);
        }
      }
      const vAvg = t > 0 ? d / t : v0;
      const dv2 = v * v - v0 * v0;
      return [
        { key: 'v', label: 'Vận tốc tức thời tại t', symbol: 'v', value: v, unit: 'm/s', precision: 2, highlight: true },
        { key: 'd', label: 'Độ dịch chuyển', symbol: 'd', value: d, unit: 'm', precision: 2, highlight: true },
        { key: 's', label: 'Quãng đường đi được', symbol: 's', value: s, unit: 'm', precision: 2 },
        { key: 'vAvg', label: 'Vận tốc trung bình (d/t)', symbol: 'v_tb', value: vAvg, unit: 'm/s', precision: 2 },
        { key: 'dv2', label: 'Hiệu bình phương vận tốc (2ad)', symbol: 'v² - v₀²', value: dv2, unit: 'm²/s²', precision: 2 },
      ];
    }

    case 'projectile-motion': {
      const v0 = params.v0 ?? 25;
      const angleDeg = params.angle ?? 45;
      const h0 = params.h0 ?? 0;
      const g = params.g ?? 9.8;
      const rad = (angleDeg * Math.PI) / 180;
      const vx = v0 * Math.cos(rad);
      const vy0 = v0 * Math.sin(rad);
      const tApex = Math.max(0, vy0 / g);
      const hMax = h0 + (vy0 > 0 ? (vy0 * vy0) / (2 * g) : 0);
      const disc = Math.max(0, vy0 * vy0 + 2 * g * h0);
      const tFlight = (vy0 + Math.sqrt(disc)) / g;
      const rangeL = vx * tFlight;
      const vLanding = Math.sqrt(v0 * v0 + 2 * g * h0);
      return [
        { key: 'rangeL', label: 'Tầm bay xa', symbol: 'L', value: rangeL, unit: 'm', precision: 2, highlight: true },
        { key: 'hMax', label: 'Độ cao cực đại', symbol: 'H_max', value: hMax, unit: 'm', precision: 2, highlight: true },
        { key: 'tFlight', label: 'Thời gian chuyển động', symbol: 't_bay', value: tFlight, unit: 's', precision: 2 },
        { key: 'tApex', label: 'Thời gian lên đỉnh', symbol: 't_đỉnh', value: tApex, unit: 's', precision: 2 },
        { key: 'vx', label: 'Vận tốc phương ngang', symbol: 'v_x', value: vx, unit: 'm/s', precision: 2 },
        { key: 'vLanding', label: 'Tốc độ chạm đất', symbol: 'v_đất', value: vLanding, unit: 'm/s', precision: 2 },
      ];
    }

    case 'newton-inclined': {
      const m = params.m ?? 5;
      const alphaDeg = params.alpha ?? 30;
      const mu = params.mu ?? 0.2;
      const fPull = params.fPull ?? 0;
      const g = params.g ?? 9.8;
      const rad = (alphaDeg * Math.PI) / 180;
      const P = m * g;
      const Px = P * Math.sin(rad);
      const N = P * Math.cos(rad);
      const fMsMax = mu * N;
      // Positive axis = down the incline; fPull pulls UP the incline
      const fDrive = Px - fPull;
      let a = 0;
      let fMs = 0;
      if (Math.abs(fDrive) <= fMsMax) {
        a = 0;
        fMs = Math.abs(fDrive);
      } else if (fDrive > fMsMax) {
        a = (fDrive - fMsMax) / m; // sliding down
        fMs = fMsMax;
      } else {
        a = (fDrive + fMsMax) / m; // pulled up (negative down-axis)
        fMs = fMsMax;
      }
      return [
        { key: 'a', label: 'Gia tốc dọc mặt nghiêng', symbol: 'a', value: a, unit: 'm/s²', precision: 3, highlight: true, note: a > 0 ? 'Trượt xuống' : a < 0 ? 'Đi lên' : 'Đứng yên (ma sát nghỉ)' },
        { key: 'N', label: 'Phản lực pháp tuyến', symbol: 'N', value: N, unit: 'N', precision: 2, highlight: true },
        { key: 'Px', label: 'Thành phần trọng lực P_x', symbol: 'P·sinα', value: Px, unit: 'N', precision: 2 },
        { key: 'fMs', label: 'Lực ma sát thực tế', symbol: 'F_ms', value: fMs, unit: 'N', precision: 2 },
        { key: 'fNet', label: 'Hợp lực tác dụng', symbol: 'F_hl', value: m * a, unit: 'N', precision: 2 },
      ];
    }

    case 'energy-conservation': {
      const m = params.m ?? 2;
      const h0 = params.h0 ?? 15;
      const v0 = params.v0 ?? 4;
      const g = params.g ?? 9.8;
      const wt0 = m * g * h0;
      const wd0 = 0.5 * m * v0 * v0;
      const W = wt0 + wd0;
      const hMax = W / (m * g);
      const rawHCurr = params.hCurr ?? 6;
      const exceedsMax = rawHCurr > hMax + 1e-6;
      const hCurr = Math.min(hMax, rawHCurr);
      const wtCurr = m * g * hCurr;
      const wdCurr = Math.max(0, W - wtCurr);
      const vCurr = Math.sqrt((2 * wdCurr) / m);
      return [
        { key: 'W', label: 'Cơ năng toàn phần (Bảo toàn)', symbol: 'W', value: W, unit: 'J', precision: 2, highlight: true },
        {
          key: 'vCurr',
          label: 'Tốc độ tại độ cao h',
          symbol: 'v(h)',
          value: vCurr,
          unit: 'm/s',
          precision: 2,
          highlight: true,
          note: exceedsMax ? 'h > h_max (vật không tới được)' : undefined,
        },
        { key: 'wdCurr', label: 'Động năng tại h', symbol: 'W_đ', value: wdCurr, unit: 'J', precision: 2 },
        { key: 'wtCurr', label: 'Thế năng tại h', symbol: 'W_t', value: wtCurr, unit: 'J', precision: 2 },
        { key: 'hMax', label: 'Độ cao cực đại đạt được', symbol: 'h_max', value: hMax, unit: 'm', precision: 2 },
      ];
    }

    case 'momentum-collision': {
      const m1 = params.m1 ?? 3;
      const v1 = params.v1 ?? 6;
      const m2 = params.m2 ?? 2;
      const v2 = params.v2 ?? -2;
      const e = params.e ?? 1; // Coefficient of restitution (1 = elastic, 0 = completely inelastic)
      const pTotal = m1 * v1 + m2 * v2;
      const v1After = (m1 * v1 + m2 * v2 + m2 * e * (v2 - v1)) / (m1 + m2);
      const v2After = (m1 * v1 + m2 * v2 + m1 * e * (v1 - v2)) / (m1 + m2);
      const keBefore = 0.5 * m1 * v1 * v1 + 0.5 * m2 * v2 * v2;
      const keAfter = 0.5 * m1 * v1After * v1After + 0.5 * m2 * v2After * v2After;
      const qHeat = Math.max(0, keBefore - keAfter);
      return [
        { key: 'v1After', label: 'Vận tốc vật 1 sau va chạm', symbol: "v₁'", value: v1After, unit: 'm/s', precision: 2, highlight: true },
        { key: 'v2After', label: 'Vận tốc vật 2 sau va chạm', symbol: "v₂'", value: v2After, unit: 'm/s', precision: 2, highlight: true },
        { key: 'pTotal', label: 'Tổng động lượng hệ (Bảo toàn)', symbol: 'p_hệ', value: pTotal, unit: 'kg·m/s', precision: 2 },
        { key: 'keBefore', label: 'Tổng động năng trước', symbol: 'W_đ1', value: keBefore, unit: 'J', precision: 2 },
        { key: 'qHeat', label: 'Nhiệt lượng tỏa ra (ΔW_đ)', symbol: 'Q', value: qHeat, unit: 'J', precision: 2 },
      ];
    }

    case 'circular-motion': {
      const m = params.m ?? 1.5;
      const r = params.r ?? 2;
      const omega = params.omega ?? 4;
      const v = omega * r;
      const T = (2 * Math.PI) / omega;
      const f = omega / (2 * Math.PI);
      const aHt = omega * omega * r;
      const fHt = m * aHt;
      return [
        { key: 'v', label: 'Tốc độ dài', symbol: 'v', value: v, unit: 'm/s', precision: 2, highlight: true },
        { key: 'fHt', label: 'Lực hướng tâm', symbol: 'F_ht', value: fHt, unit: 'N', precision: 2, highlight: true },
        { key: 'aHt', label: 'Gia tốc hướng tâm', symbol: 'a_ht', value: aHt, unit: 'm/s²', precision: 2 },
        { key: 'T', label: 'Chu kỳ quay', symbol: 'T', value: T, unit: 's', precision: 3 },
        { key: 'f', label: 'Tần số quay', symbol: 'f', value: f, unit: 'Hz', precision: 3 },
      ];
    }

    case 'spring-shm': {
      const m = params.m ?? 0.4; // kg
      const k = params.k ?? 100; // N/m
      const A_cm = params.A ?? 8; // cm
      const A = A_cm / 100; // m
      const omega = Math.sqrt(k / m);
      const T = (2 * Math.PI) / omega;
      const f = 1 / T;
      const vMax = omega * A;
      const aMax = omega * omega * A;
      const W = 0.5 * k * A * A;
      const fMax = k * A;
      return [
        { key: 'omega', label: 'Tần số góc', symbol: 'ω', value: omega, unit: 'rad/s', precision: 2, highlight: true },
        { key: 'T', label: 'Chu kỳ dao động', symbol: 'T', value: T, unit: 's', precision: 3, highlight: true },
        { key: 'f', label: 'Tần số dao động', symbol: 'f', value: f, unit: 'Hz', precision: 3 },
        { key: 'vMax', label: 'Tốc độ cực đại (VTCB)', symbol: 'v_max', value: vMax, unit: 'm/s', precision: 3 },
        { key: 'aMax', label: 'Gia tốc cực đại (tại biên)', symbol: 'a_max', value: aMax, unit: 'm/s²', precision: 2 },
        { key: 'W', label: 'Cơ năng dao động', symbol: 'W', value: W, unit: 'J', precision: 4 },
        { key: 'fMax', label: 'Lực kéo về cực đại', symbol: 'F_kv,max', value: fMax, unit: 'N', precision: 2 },
      ];
    }

    case 'simple-pendulum': {
      const l = params.l ?? 1.0; // m
      const g = params.g ?? 9.81; // m/s^2
      const m = params.m ?? 0.5; // kg
      const alpha0Deg = params.alpha0 ?? 12; // deg
      const alpha0 = (alpha0Deg * Math.PI) / 180;
      const omega = Math.sqrt(g / l);
      const T = 2 * Math.PI * Math.sqrt(l / g);
      // Exact elliptic-integral series correction for finite amplitude alpha0 > 10°
      const T_exact = T * (1 + (alpha0 * alpha0) / 16 + (11 * Math.pow(alpha0, 4)) / 3072);
      const f = 1 / T;
      const vMax = Math.sqrt(2 * g * l * (1 - Math.cos(alpha0)));
      const tMax = m * g * (3 - 2 * Math.cos(alpha0));
      const tMin = m * g * Math.cos(alpha0);
      const W = m * g * l * (1 - Math.cos(alpha0));
      return [
        {
          key: 'T',
          label: 'Chu kỳ dao động nhỏ',
          symbol: 'T',
          value: T,
          unit: 's',
          precision: 3,
          highlight: true,
          note: alpha0Deg > 10 ? `Góc lớn: T thực ≈ ${T_exact.toFixed(3)} s` : 'Đạt điều kiện góc nhỏ (≤ 10°)',
        },
        { key: 'vMax', label: 'Vận tốc cực đại tại VTCB', symbol: 'v_max', value: vMax, unit: 'm/s', precision: 3, highlight: true },
        { key: 'tMax', label: 'Lực căng dây cực đại (VTCB)', symbol: 'T_max', value: tMax, unit: 'N', precision: 3 },
        { key: 'tMin', label: 'Lực căng dây cực tiểu (biên)', symbol: 'T_min', value: tMin, unit: 'N', precision: 3 },
        { key: 'W', label: 'Cơ năng con lắc', symbol: 'W', value: W, unit: 'J', precision: 4 },
        { key: 'f', label: 'Tần số dao động', symbol: 'f', value: f, unit: 'Hz', precision: 3 },
      ];
    }

    case 'wave-interference': {
      const f = params.f ?? 20; // Hz
      const v = params.v ?? 40; // cm/s
      const s1s2 = params.s1s2 ?? 12; // cm
      const lambda = v / f; // cm
      const T = 1 / f;
      // Number of antinodal lines strictly between S1 and S2 (same phase): -S1S2/lambda < k < S1S2/lambda
      const ratio = s1s2 / lambda;
      const maxK = Math.floor(ratio - 1e-9);
      const numMax = 2 * Math.max(0, maxK) + 1;
      const maxKMin = Math.floor(ratio + 0.5 - 1e-9);
      const numMin = 2 * Math.max(0, maxKMin);
      const standingNodes = Math.floor(s1s2 / (lambda / 2) + 1e-9) + 1;
      return [
        { key: 'lambda', label: 'Bước sóng', symbol: 'λ', value: lambda, unit: 'cm', precision: 2, highlight: true },
        { key: 'numMax', label: 'Số vân cực đại giao thoa', symbol: 'N_CĐ', value: numMax, unit: 'vân', precision: 0, highlight: true },
        { key: 'numMin', label: 'Số vân cực tiểu giao thoa', symbol: 'N_CT', value: numMin, unit: 'vân', precision: 0 },
        { key: 'T', label: 'Chu kỳ sóng', symbol: 'T', value: T, unit: 's', precision: 4 },
        { key: 'halfLambda', label: 'Khoảng cách 2 cực đại liên tiếp trên S₁S₂', symbol: 'λ/2', value: lambda / 2, unit: 'cm', precision: 2 },
        { key: 'standingNodes', label: 'Số nút sóng dừng (nếu L = S₁S₂)', symbol: 'N_nút', value: standingNodes, unit: 'nút', precision: 0 },
      ];
    }

    case 'young-double-slit': {
      const lambdaNm = params.lambda ?? 550; // nm
      const aMm = params.a ?? 1.0; // mm
      const Dm = params.D ?? 2.0; // m
      const Lmm = params.L ?? 15; // mm screen width
      const lambdaUm = lambdaNm / 1000;
      const iMm = (lambdaUm * Dm) / aMm; // mm
      const nBrightHalf = Math.floor(Lmm / (2 * iMm) + 1e-9);
      const nBright = 2 * nBrightHalf + 1;
      const nDarkHalf = Math.floor(Lmm / (2 * iMm) + 0.5 + 1e-9);
      const nDark = 2 * nDarkHalf;
      const xBright3 = 3 * iMm;
      const freqTHz = (PHYSICS_CONSTANTS.C_LIGHT / (lambdaNm * 1e-9)) / 1e12;
      return [
        { key: 'i', label: 'Khoảng vân giao thoa', symbol: 'i', value: iMm, unit: 'mm', precision: 3, highlight: true },
        { key: 'nBright', label: 'Số vân sáng trên vùng L', symbol: 'N_s', value: nBright, unit: 'vân', precision: 0, highlight: true },
        { key: 'nDark', label: 'Số vân tối trên vùng L', symbol: 'N_t', value: nDark, unit: 'vân', precision: 0 },
        { key: 'xBright3', label: 'Tọa độ vân sáng bậc 3', symbol: 'x_s3', value: xBright3, unit: 'mm', precision: 3 },
        { key: 'freq', label: 'Tần số bức xạ ánh sáng', symbol: 'f', value: freqTHz, unit: 'THz', precision: 1 },
      ];
    }

    case 'coulomb-capacitor': {
      const q1uC = params.q1 ?? 4; // µC
      const q2uC = params.q2 ?? -2; // µC
      const rCm = params.r ?? 10; // cm
      const eps = params.eps ?? 1;
      const C_uF = params.C ?? 20; // µF
      const U = params.U ?? 12; // V
      const dCm = params.d ?? 2; // cm
      const rM = rCm / 100;
      const F =
        (PHYSICS_CONSTANTS.K_COULOMB * Math.abs(q1uC * 1e-6 * q2uC * 1e-6)) /
        (eps * rM * rM);
      const E = U / (dCm / 100); // V/m
      const Q_mC = C_uF * U * 1e-3; // mC
      const Wc_mJ = 0.5 * C_uF * 1e-6 * U * U * 1e3; // mJ
      return [
        { key: 'F', label: 'Độ lớn lực tĩnh điện Cu-lông', symbol: 'F', value: F, unit: 'N', precision: 3, highlight: true, note: q1uC * q2uC < 0 ? 'Lực hút' : 'Lực đẩy' },
        { key: 'E', label: 'Cường độ điện trường đều', symbol: 'E', value: E, unit: 'V/m', precision: 1, highlight: true },
        { key: 'Q', label: 'Điện tích tích được trên tụ', symbol: 'Q', value: Q_mC, unit: 'mC', precision: 3 },
        { key: 'Wc', label: 'Năng lượng điện trường tụ', symbol: 'W_C', value: Wc_mJ, unit: 'mJ', precision: 3 },
      ];
    }

    case 'ohms-closed-circuit': {
      const E = params.E ?? 12; // V
      const r = params.r ?? 2; // Ohm
      const RN = params.RN ?? 4; // Ohm
      const I = E / (RN + r);
      const UN = I * RN;
      const PN = I * I * RN;
      const PSource = E * I;
      const H = (RN / (RN + r)) * 100; // %
      const PMax = (E * E) / (4 * r);
      return [
        { key: 'I', label: 'Cường độ dòng điện mạch chính', symbol: 'I', value: I, unit: 'A', precision: 3, highlight: true },
        { key: 'UN', label: 'Hiệu điện thế mạch ngoài', symbol: 'U_N', value: UN, unit: 'V', precision: 2, highlight: true },
        { key: 'PN', label: 'Công suất tiêu thụ mạch ngoài', symbol: 'P_N', value: PN, unit: 'W', precision: 2, highlight: true },
        { key: 'H', label: 'Hiệu suất của nguồn điện', symbol: 'H', value: H, unit: '%', precision: 1 },
        { key: 'PSource', label: 'Công suất toàn phần nguồn', symbol: 'P_ng', value: PSource, unit: 'W', precision: 2 },
        { key: 'PMax', label: 'Công suất mạch ngoài cực đại (R=r)', symbol: 'P_max', value: PMax, unit: 'W', precision: 2 },
      ];
    }

    case 'thermo-first-law': {
      const m = params.m ?? 1.5; // kg
      const c = params.c ?? 4180; // J/(kg·K)
      const dT = params.dT ?? 25; // K (or °C)
      const A = params.A ?? -15000; // J (work done ON gas; <0 means gas expands and does work)
      const Q = m * c * dT; // J
      const dU = A + Q; // J
      const Q_kJ = Q / 1000;
      const A_kJ = A / 1000;
      const dU_kJ = dU / 1000;
      const eff = Q > 0 && A < 0 ? (Math.abs(A) / Q) * 100 : 0;
      const effNote =
        Q > 0 && A < 0
          ? Math.abs(A) > Q
            ? 'Tiêu hao thêm nội năng (ΔU < 0)'
            : 'Chuyển hóa từ nhiệt nhận vào'
          : A > 0
            ? 'Hệ nhận công (nén khí)'
            : undefined;
      return [
        { key: 'Q', label: 'Nhiệt lượng trao đổi', symbol: 'Q', value: Q_kJ, unit: 'kJ', precision: 2, highlight: true },
        { key: 'dU', label: 'Độ biến thiên nội năng (A + Q)', symbol: 'ΔU', value: dU_kJ, unit: 'kJ', precision: 2, highlight: true },
        { key: 'A', label: 'Công cơ học hệ nhận', symbol: 'A', value: A_kJ, unit: 'kJ', precision: 2 },
        { key: 'eff', label: 'Tỉ số sinh công |A|/Q', symbol: '|A|/Q', value: eff, unit: '%', precision: 1, note: effNote },
      ];
    }

    case 'ideal-gas-kinetic': {
      const n = params.n ?? 1.0; // mol
      const T = params.T ?? 300; // K
      const V_L = params.V ?? 10; // Liters (dm³)
      const M_g = params.M ?? 28; // g/mol (N2 = 28)
      const V_m3 = V_L * 1e-3;
      const pPa = (n * PHYSICS_CONSTANTS.R_GAS * T) / V_m3;
      const pAtm = pPa / 101325;
      const eKin_eV = (1.5 * PHYSICS_CONSTANTS.K_BOLTZMANN * T) / PHYSICS_CONSTANTS.E_CHARGE;
      const vRms = Math.sqrt((3 * PHYSICS_CONSTANTS.R_GAS * T) / (M_g * 1e-3));
      const U_kJ = (1.5 * n * PHYSICS_CONSTANTS.R_GAS * T) / 1000;
      return [
        { key: 'pAtm', label: 'Áp suất khí lí tưởng', symbol: 'p', value: pAtm, unit: 'atm', precision: 3, highlight: true },
        { key: 'pKPa', label: 'Áp suất (đơn vị kPa)', symbol: 'p', value: pPa / 1000, unit: 'kPa', precision: 2 },
        { key: 'vRms', label: 'Tốc độ căn quân phương phân tử', symbol: 'v_rms', value: vRms, unit: 'm/s', precision: 1, highlight: true },
        { key: 'eKin', label: 'Động năng tịnh tiến TB 1 phân tử', symbol: 'E_đ', value: eKin_eV * 1000, unit: 'meV', precision: 2 },
        { key: 'U', label: 'Nội năng khí đơn nguyên tử', symbol: 'U', value: U_kJ, unit: 'kJ', precision: 3 },
      ];
    }

    case 'ac-generator-em': {
      const N = params.N ?? 200; // turns
      const B = params.B ?? 0.25; // T
      const S_cm2 = params.S ?? 150; // cm^2
      const f = params.f ?? 50; // Hz
      const I_wire = params.I ?? 3; // A (for magnetic force on conductor)
      const alphaDeg = params.alpha ?? 90;
      const S = S_cm2 * 1e-4;
      const omega = 2 * Math.PI * f;
      const phi0_mWb = N * B * S * 1000; // mWb
      const E0 = omega * N * B * S; // V
      const E_eff = E0 / Math.SQRT2;
      const L_side = Math.sqrt(S);
      const F_mag = B * I_wire * L_side * Math.sin((alphaDeg * Math.PI) / 180);
      return [
        { key: 'E0', label: 'Suất điện động cực đại', symbol: 'E₀', value: E0, unit: 'V', precision: 2, highlight: true },
        { key: 'E_eff', label: 'Suất điện động hiệu dụng', symbol: 'E', value: E_eff, unit: 'V', precision: 2, highlight: true },
        { key: 'phi0', label: 'Từ thông cực đại qua khung', symbol: 'Φ₀', value: phi0_mWb, unit: 'mWb', precision: 2 },
        { key: 'omega', label: 'Tần số góc dòng xoay chiều', symbol: 'ω', value: omega, unit: 'rad/s', precision: 1 },
        { key: 'F_mag', label: 'Lực từ trên 1 cạnh dây (l=√S)', symbol: 'F_từ', value: F_mag, unit: 'N', precision: 3 },
      ];
    }

    case 'rlc-resonance': {
      const U = params.U ?? 220; // V effective
      const f = params.f ?? 50; // Hz
      const R = params.R ?? 60; // Ohm
      const L_mH = params.L ?? 318.3; // mH (~100 Ohm at 50Hz)
      const C_uF = params.C ?? 31.83; // uF (~100 Ohm at 50Hz)
      const omega = 2 * Math.PI * f;
      const ZL = omega * (L_mH * 1e-3);
      const ZC = 1 / (omega * (C_uF * 1e-6));
      const Z = Math.sqrt(R * R + (ZL - ZC) * (ZL - ZC));
      const I = U / Z;
      const phiRad = Math.atan2(ZL - ZC, R);
      const phiDeg = (phiRad * 180) / Math.PI;
      const cosPhi = R / Z;
      const P = U * I * cosPhi;
      const fRes = 1 / (2 * Math.PI * Math.sqrt(L_mH * 1e-3 * C_uF * 1e-6));
      return [
        { key: 'Z', label: 'Tổng trở toàn mạch', symbol: 'Z', value: Z, unit: 'Ω', precision: 2, highlight: true },
        { key: 'I', label: 'Cường độ hiệu dụng', symbol: 'I', value: I, unit: 'A', precision: 3, highlight: true },
        { key: 'P', label: 'Công suất tiêu thụ', symbol: 'P', value: P, unit: 'W', precision: 1, highlight: true },
        { key: 'ZL', label: 'Cảm kháng cuộn dây', symbol: 'Z_L', value: ZL, unit: 'Ω', precision: 2 },
        { key: 'ZC', label: 'Dung kháng tụ điện', symbol: 'Z_C', value: ZC, unit: 'Ω', precision: 2 },
        { key: 'cosPhi', label: 'Hệ số công suất', symbol: 'cosφ', value: cosPhi, unit: '', precision: 3 },
        { key: 'phiDeg', label: 'Độ lệch pha u so với i', symbol: 'φ', value: phiDeg, unit: '°', precision: 1 },
        { key: 'fRes', label: 'Tần số cộng hưởng điện', symbol: 'f₀', value: fRes, unit: 'Hz', precision: 2 },
      ];
    }

    case 'photoelectric-bohr': {
      const lambdaNm = params.lambda ?? 280; // nm
      const A_eV = params.A ?? 2.3; // eV (e.g., Na=2.3, Zn=3.55, Cu=4.47)
      const nBohr = Math.round(params.nBohr ?? 3);
      const eps_J = (PHYSICS_CONSTANTS.H_PLANCK * PHYSICS_CONSTANTS.C_LIGHT) / (lambdaNm * 1e-9);
      const eps_eV = eps_J / PHYSICS_CONSTANTS.E_CHARGE;
      const lambda0_nm =
        ((PHYSICS_CONSTANTS.H_PLANCK * PHYSICS_CONSTANTS.C_LIGHT) /
          (A_eV * PHYSICS_CONSTANTS.E_CHARGE)) *
        1e9;
      const occurs = eps_eV >= A_eV;
      const keMax_eV = occurs ? eps_eV - A_eV : 0;
      const v0Max_kms = occurs
        ? Math.sqrt((2 * keMax_eV * PHYSICS_CONSTANTS.E_CHARGE) / PHYSICS_CONSTANTS.M_ELECTRON) / 1000
        : 0;
      const Uh = keMax_eV; // Stopping voltage in V numerically equals KE_max in eV
      const rBohr_pm = nBohr * nBohr * PHYSICS_CONSTANTS.BOHR_R0 * 1e12;
      const En_eV = -13.6 / (nBohr * nBohr);
      return [
        { key: 'eps_eV', label: 'Năng lượng phôtôn chiếu tới', symbol: 'ε', value: eps_eV, unit: 'eV', precision: 3, highlight: true },
        { key: 'lambda0', label: 'Giới hạn quang điện kim loại', symbol: 'λ₀', value: lambda0_nm, unit: 'nm', precision: 1, highlight: true, note: occurs ? 'Xảy ra quang điện' : 'Không xảy ra quang điện' },
        { key: 'v0Max', label: 'Vận tốc ban đầu cực đại e', symbol: 'v₀max', value: v0Max_kms, unit: 'km/s', precision: 1 },
        { key: 'Uh', label: 'Hiệu điện thế hãm', symbol: 'U_h', value: Uh, unit: 'V', precision: 3 },
        { key: 'rBohr', label: 'Bán kính quỹ đạo Bo bậc n', symbol: 'r_n', value: rBohr_pm, unit: 'pm', precision: 1 },
        { key: 'En', label: 'Mức năng lượng Hiđrô bậc n', symbol: 'E_n', value: En_eV, unit: 'eV', precision: 2 },
      ];
    }

    case 'nuclear-decay': {
      const N0 = params.N0 ?? 1000; // normalized units (×10¹⁵ hạt)
      const T = params.T ?? 8; // days (e.g., I-131 = 8 days)
      const t = params.t ?? 16; // days
      const deltaM = params.deltaM ?? 0.137; // u (mass defect, O-16 ≈ 0.137 u)
      const A_num = params.A_num ?? 16; // mass number A
      const lambdaDay = Math.LN2 / T;
      const lambdaSec = Math.LN2 / (T * 86400);
      const N_remain = N0 * Math.pow(2, -t / T);
      const N_decayed = N0 - N_remain;
      const remainPct = (N_remain / N0) * 100;
      const activityGBq = (lambdaSec * N_remain * 1e15) / 1e9;
      const W_lk = deltaM * PHYSICS_CONSTANTS.UC2_MEV;
      const W_lkr = W_lk / A_num;
      return [
        { key: 'N_remain', label: 'Số hạt nhân còn lại', symbol: 'N(t)', value: N_remain, unit: '×10¹⁵ hạt', precision: 2, highlight: true },
        { key: 'N_decayed', label: 'Số hạt nhân đã phân rã', symbol: 'ΔN', value: N_decayed, unit: '×10¹⁵ hạt', precision: 2, highlight: true },
        { key: 'remainPct', label: 'Tỉ lệ phần trăm còn lại', symbol: 'N/N₀', value: remainPct, unit: '%', precision: 2 },
        { key: 'H_act', label: 'Độ phóng xạ tức thời', symbol: 'H(t)', value: activityGBq, unit: 'GBq', precision: 2 },
        { key: 'lambda', label: 'Hằng số phóng xạ', symbol: 'λ', value: lambdaDay, unit: 'ngày⁻¹', precision: 4 },
        { key: 'W_lk', label: 'Năng lượng liên kết hạt nhân', symbol: 'W_lk', value: W_lk, unit: 'MeV', precision: 2 },
        { key: 'W_lkr', label: 'Năng lượng liên kết riêng', symbol: 'W_lkr', value: W_lkr, unit: 'MeV/nuclôn', precision: 3 },
      ];
    }
  }
}

export function computeDeltaTable(
  lessonId: LessonId,
  baselineParams: ParamMap,
  currentParams: ParamMap
): DeltaRow[] {
  const baseMetrics = computeLessonMetrics(lessonId, baselineParams);
  const currMetrics = computeLessonMetrics(lessonId, currentParams);

  return currMetrics.map((curr, idx) => {
    const base = baseMetrics[idx];
    const delta = curr.value - base.value;
    const eps = 1e-9;
    const isZeroBase = Math.abs(base.value) < eps;
    const percentChange = isZeroBase ? null : (delta / Math.abs(base.value)) * 100;
    const ratio = isZeroBase ? null : curr.value / base.value;
    const trend: 'up' | 'down' | 'same' =
      Math.abs(delta) < 1e-6 ? 'same' : delta > 0 ? 'up' : 'down';

    return {
      key: curr.key,
      label: curr.label,
      symbol: curr.symbol,
      unit: curr.unit,
      baseline: base.value,
      current: curr.value,
      delta,
      percentChange,
      ratio,
      trend,
      precision: curr.precision ?? 2,
    };
  });
}

export function sampleTelemetrySeries(
  lessonId: LessonId,
  params: ParamMap,
  numPoints = 64
): TelemetrySeries {
  const points: Array<Record<string, number>> = [];

  switch (lessonId) {
    case 'kinematics-1d': {
      const v0 = params.v0 ?? 5;
      const a = params.a ?? 2;
      const tMax = Math.max(1, params.t ?? 6);
      for (let i = 0; i <= numPoints; i++) {
        const x = (i / numPoints) * tMax;
        points.push({ x, v: v0 + a * x, d: v0 * x + 0.5 * a * x * x });
      }
      return {
        xLabel: 'Thời gian t',
        xUnit: 's',
        channels: [
          { key: 'v', label: 'Vận tốc v(t)', unit: 'm/s', color: '#2563eb' },
          { key: 'd', label: 'Độ dịch chuyển d(t)', unit: 'm', color: '#d97706' },
        ],
        points,
      };
    }

    case 'projectile-motion': {
      const v0 = params.v0 ?? 25;
      const rad = ((params.angle ?? 45) * Math.PI) / 180;
      const h0 = params.h0 ?? 0;
      const g = params.g ?? 9.8;
      const vx = v0 * Math.cos(rad);
      const vy0 = v0 * Math.sin(rad);
      const tFlight = (vy0 + Math.sqrt(Math.max(0, vy0 * vy0 + 2 * g * h0))) / g;
      for (let i = 0; i <= numPoints; i++) {
        const t = (i / numPoints) * tFlight;
        const posX = vx * t;
        const posY = Math.max(0, h0 + vy0 * t - 0.5 * g * t * t);
        const speed = Math.sqrt(vx * vx + (vy0 - g * t) * (vy0 - g * t));
        points.push({ x: posX, y: posY, v: speed });
      }
      return {
        xLabel: 'Tầm ngang x',
        xUnit: 'm',
        channels: [
          { key: 'y', label: 'Độ cao y(x)', unit: 'm', color: '#2563eb' },
          { key: 'v', label: 'Tốc độ v(x)', unit: 'm/s', color: '#059669' },
        ],
        points,
      };
    }

    case 'newton-inclined': {
      const metrics = computeLessonMetrics(lessonId, params);
      const a = metrics.find((m) => m.key === 'a')?.value ?? 0;
      const tMax = 5;
      for (let i = 0; i <= numPoints; i++) {
        const t = (i / numPoints) * tMax;
        points.push({ x: t, v: a * t, s: 0.5 * a * t * t });
      }
      return {
        xLabel: 'Thời gian trượt t',
        xUnit: 's',
        channels: [
          { key: 'v', label: 'Vận tốc v(t)', unit: 'm/s', color: '#2563eb' },
          { key: 's', label: 'Tọa độ s(t)', unit: 'm', color: '#d97706' },
        ],
        points,
      };
    }

    case 'energy-conservation': {
      const m = params.m ?? 2;
      const h0 = params.h0 ?? 15;
      const v0 = params.v0 ?? 4;
      const g = params.g ?? 9.8;
      const W = m * g * h0 + 0.5 * m * v0 * v0;
      const hMax = Math.max(1, W / (m * g));
      for (let i = 0; i <= numPoints; i++) {
        const h = (i / numPoints) * hMax;
        const wt = m * g * h;
        const wd = Math.max(0, W - wt);
        points.push({ x: h, wd, wt });
      }
      return {
        xLabel: 'Độ cao h',
        xUnit: 'm',
        channels: [
          { key: 'wd', label: 'Động năng W_đ(h)', unit: 'J', color: '#2563eb' },
          { key: 'wt', label: 'Thế năng W_t(h)', unit: 'J', color: '#059669' },
        ],
        points,
      };
    }

    case 'momentum-collision': {
      const m1 = params.m1 ?? 3;
      const v1 = params.v1 ?? 6;
      const m2 = params.m2 ?? 2;
      const v2 = params.v2 ?? -2;
      for (let i = 0; i <= numPoints; i++) {
        const eVal = i / numPoints;
        const v1a = (m1 * v1 + m2 * v2 + m2 * eVal * (v2 - v1)) / (m1 + m2);
        const v2a = (m1 * v1 + m2 * v2 + m1 * eVal * (v1 - v2)) / (m1 + m2);
        const ke0 = 0.5 * m1 * v1 * v1 + 0.5 * m2 * v2 * v2;
        const ke1 = 0.5 * m1 * v1a * v1a + 0.5 * m2 * v2a * v2a;
        points.push({ x: eVal, v1a, q: Math.max(0, ke0 - ke1) });
      }
      return {
        xLabel: 'Hệ số đàn hồi e',
        xUnit: '',
        channels: [
          { key: 'q', label: 'Nhiệt lượng hao phí Q(e)', unit: 'J', color: '#dc2626' },
          { key: 'v1a', label: "Vận tốc v₁'(e)", unit: 'm/s', color: '#2563eb' },
        ],
        points,
      };
    }

    case 'circular-motion': {
      const m = params.m ?? 1.5;
      const r = params.r ?? 2;
      const maxOmega = Math.max(10, (params.omega ?? 4) * 1.5);
      for (let i = 0; i <= numPoints; i++) {
        const w = (i / numPoints) * maxOmega;
        points.push({ x: w, fht: m * w * w * r, v: w * r });
      }
      return {
        xLabel: 'Tốc độ góc ω',
        xUnit: 'rad/s',
        channels: [
          { key: 'fht', label: 'Lực hướng tâm F_ht(ω)', unit: 'N', color: '#2563eb' },
          { key: 'v', label: 'Tốc độ dài v(ω)', unit: 'm/s', color: '#059669' },
        ],
        points,
      };
    }

    case 'spring-shm': {
      const m = params.m ?? 0.4;
      const k = params.k ?? 100;
      const A_cm = params.A ?? 8;
      const phiDeg = params.phi ?? 0;
      const phi = (phiDeg * Math.PI) / 180;
      const omega = Math.sqrt(k / m);
      const T = (2 * Math.PI) / omega;
      const tSpan = 2 * T;
      for (let i = 0; i <= numPoints; i++) {
        const t = (i / numPoints) * tSpan;
        const xVal = A_cm * Math.cos(omega * t + phi);
        const vVal = -omega * (A_cm / 100) * Math.sin(omega * t + phi);
        points.push({ x: t, xt: xVal, vt: vVal });
      }
      return {
        xLabel: 'Thời gian t (2 chu kỳ)',
        xUnit: 's',
        channels: [
          { key: 'xt', label: 'Li độ x(t)', unit: 'cm', color: '#2563eb' },
          { key: 'vt', label: 'Vận tốc v(t)', unit: 'm/s', color: '#059669' },
        ],
        points,
      };
    }

    case 'simple-pendulum': {
      const l = params.l ?? 1.0;
      const g = params.g ?? 9.81;
      const m = params.m ?? 0.5;
      const alpha0Deg = params.alpha0 ?? 12;
      const alpha0 = (alpha0Deg * Math.PI) / 180;
      const omega = Math.sqrt(g / l);
      const T = (2 * Math.PI) / omega;
      for (let i = 0; i <= numPoints; i++) {
        const t = (i / numPoints) * (2 * T);
        const alpha = alpha0 * Math.cos(omega * t);
        const wt = m * g * l * (1 - Math.cos(alpha)) * 1000; // mJ
        const W = m * g * l * (1 - Math.cos(alpha0)) * 1000;
        const wd = Math.max(0, W - wt);
        points.push({ x: t, wd, wt });
      }
      return {
        xLabel: 'Thời gian t (2 chu kỳ)',
        xUnit: 's',
        channels: [
          { key: 'wd', label: 'Động năng W_đ(t)', unit: 'mJ', color: '#2563eb' },
          { key: 'wt', label: 'Thế năng W_t(t)', unit: 'mJ', color: '#d97706' },
        ],
        points,
      };
    }

    case 'wave-interference': {
      const f = params.f ?? 20;
      const v = params.v ?? 40;
      const s1s2 = params.s1s2 ?? 12;
      const lambda = v / f;
      for (let i = 0; i <= numPoints; i++) {
        const dDiff = -s1s2 + (i / numPoints) * (2 * s1s2);
        const amp = Math.abs(2 * Math.cos((Math.PI * dDiff) / lambda));
        points.push({ x: dDiff, amp });
      }
      return {
        xLabel: 'Hiệu đường đi d₂ - d₁',
        xUnit: 'cm',
        channels: [
          { key: 'amp', label: 'Biên độ giao thoa A/a', unit: 'lần', color: '#2563eb' },
        ],
        points,
      };
    }

    case 'young-double-slit': {
      const lambdaNm = params.lambda ?? 550;
      const aMm = params.a ?? 1.0;
      const Dm = params.D ?? 2.0;
      const Lmm = params.L ?? 15;
      const iMm = ((lambdaNm / 1000) * Dm) / aMm;
      const colorHex = wavelengthToHex(lambdaNm);
      for (let i = 0; i <= numPoints; i++) {
        const xPos = -Lmm / 2 + (i / numPoints) * Lmm;
        const intensity = Math.pow(Math.cos((Math.PI * xPos) / iMm), 2);
        points.push({ x: xPos, intensity: intensity * 100 });
      }
      return {
        xLabel: 'Tọa độ x trên màn hứng vân',
        xUnit: 'mm',
        channels: [
          { key: 'intensity', label: 'Cường độ sáng tương đối I(x)', unit: '%', color: colorHex },
        ],
        points,
      };
    }

    case 'coulomb-capacitor': {
      const q1uC = params.q1 ?? 4;
      const q2uC = params.q2 ?? -2;
      const eps = params.eps ?? 1;
      for (let i = 0; i <= numPoints; i++) {
        const rCm = 3 + (i / numPoints) * 27;
        const rM = rCm / 100;
        const F =
          (PHYSICS_CONSTANTS.K_COULOMB * Math.abs(q1uC * 1e-6 * q2uC * 1e-6)) /
          (eps * rM * rM);
        points.push({ x: rCm, F: Math.min(F, 200) });
      }
      return {
        xLabel: 'Khoảng cách r giữa hai điện tích',
        xUnit: 'cm',
        channels: [
          { key: 'F', label: 'Lực Cu-lông F(r) ~ 1/r²', unit: 'N', color: '#2563eb' },
        ],
        points,
      };
    }

    case 'ohms-closed-circuit': {
      const E = params.E ?? 12;
      const r = params.r ?? 2;
      const maxR = Math.max(15, r * 6);
      for (let i = 0; i <= numPoints; i++) {
        const Rval = 0.2 + (i / numPoints) * maxR;
        const I = E / (Rval + r);
        const P = I * I * Rval;
        const H = (Rval / (Rval + r)) * 100;
        points.push({ x: Rval, P, H });
      }
      return {
        xLabel: 'Điện trở mạch ngoài R_N',
        xUnit: 'Ω',
        channels: [
          { key: 'P', label: 'Công suất mạch ngoài P(R)', unit: 'W', color: '#2563eb' },
          { key: 'H', label: 'Hiệu suất nguồn H(R)', unit: '%', color: '#059669' },
        ],
        points,
      };
    }

    case 'thermo-first-law': {
      const m = params.m ?? 1.5;
      const c = params.c ?? 4180;
      const A = params.A ?? -15000;
      for (let i = 0; i <= numPoints; i++) {
        const dT = -20 + (i / numPoints) * 100;
        const Q = (m * c * dT) / 1000;
        const dU = Q + A / 1000;
        points.push({ x: dT, Q, dU });
      }
      return {
        xLabel: 'Độ biến thiên nhiệt độ ΔT',
        xUnit: 'K',
        channels: [
          { key: 'Q', label: 'Nhiệt lượng Q(ΔT)', unit: 'kJ', color: '#dc2626' },
          { key: 'dU', label: 'Biến thiên nội năng ΔU', unit: 'kJ', color: '#2563eb' },
        ],
        points,
      };
    }

    case 'ideal-gas-kinetic': {
      const n = params.n ?? 1.0;
      const T = params.T ?? 300;
      for (let i = 0; i <= numPoints; i++) {
        const V = 2 + (i / numPoints) * 28; // L
        const pAtm = (n * PHYSICS_CONSTANTS.R_GAS * T) / (V * 1e-3) / 101325;
        const pHot = (n * PHYSICS_CONSTANTS.R_GAS * (T + 150)) / (V * 1e-3) / 101325;
        points.push({ x: V, p: pAtm, pHot });
      }
      return {
        xLabel: 'Thể tích V (Đường đẳng nhiệt)',
        xUnit: 'lít',
        channels: [
          { key: 'p', label: `Áp suất p(V) tại T=${T}K`, unit: 'atm', color: '#2563eb' },
          { key: 'pHot', label: `Đường đối chiếu T=${T + 150}K`, unit: 'atm', color: '#d97706' },
        ],
        points,
      };
    }

    case 'ac-generator-em': {
      const N = params.N ?? 200;
      const B = params.B ?? 0.25;
      const S = (params.S ?? 150) * 1e-4;
      const f = params.f ?? 50;
      const omega = 2 * Math.PI * f;
      const T = 1 / f;
      const E0 = omega * N * B * S;
      const phi0 = N * B * S * 1000; // mWb
      for (let i = 0; i <= numPoints; i++) {
        const t = (i / numPoints) * (2 * T);
        const eVal = E0 * Math.sin(omega * t);
        const phiVal = phi0 * Math.cos(omega * t);
        points.push({ x: t * 1000, e: eVal, phi: phiVal });
      }
      return {
        xLabel: 'Thời gian t (ms)',
        xUnit: 'ms',
        channels: [
          { key: 'e', label: 'Suất điện động e(t)', unit: 'V', color: '#2563eb' },
          { key: 'phi', label: 'Từ thông Φ(t)', unit: 'mWb', color: '#d97706' },
        ],
        points,
      };
    }

    case 'rlc-resonance': {
      const U = params.U ?? 220;
      const R = params.R ?? 60;
      const L = (params.L ?? 318.3) * 1e-3;
      const C = (params.C ?? 31.83) * 1e-6;
      const fRes = 1 / (2 * Math.PI * Math.sqrt(L * C));
      const fMin = Math.max(5, fRes * 0.25);
      const fMax = Math.max(120, fRes * 2.0);
      for (let i = 0; i <= numPoints; i++) {
        const fVal = fMin + (i / numPoints) * (fMax - fMin);
        const w = 2 * Math.PI * fVal;
        const ZL = w * L;
        const ZC = 1 / (w * C);
        const Z = Math.sqrt(R * R + (ZL - ZC) * (ZL - ZC));
        const I = U / Z;
        const P = I * I * R;
        points.push({ x: fVal, I, P });
      }
      return {
        xLabel: 'Tần số dòng điện f (Đường cộng hưởng)',
        xUnit: 'Hz',
        channels: [
          { key: 'I', label: 'Cường độ hiệu dụng I(f)', unit: 'A', color: '#2563eb' },
          { key: 'P', label: 'Công suất P(f)', unit: 'W', color: '#d97706' },
        ],
        points,
      };
    }

    case 'photoelectric-bohr': {
      const A_eV = params.A ?? 2.3;
      for (let i = 0; i <= numPoints; i++) {
        const wl = 150 + (i / numPoints) * 550; // 150nm -> 700nm
        const eps_eV =
          (PHYSICS_CONSTANTS.H_PLANCK * PHYSICS_CONSTANTS.C_LIGHT) /
          (wl * 1e-9) /
          PHYSICS_CONSTANTS.E_CHARGE;
        const ke = Math.max(0, eps_eV - A_eV);
        points.push({ x: wl, eps: eps_eV, ke });
      }
      return {
        xLabel: 'Bước sóng bức xạ λ',
        xUnit: 'nm',
        channels: [
          { key: 'eps', label: 'Năng lượng phôtôn ε(λ)', unit: 'eV', color: '#2563eb' },
          { key: 'ke', label: 'Động năng cực đại e (W_đmax)', unit: 'eV', color: '#059669' },
        ],
        points,
      };
    }

    case 'nuclear-decay': {
      const N0 = params.N0 ?? 1000;
      const T = params.T ?? 8;
      const tMax = Math.max(T * 4, params.t ?? 16);
      for (let i = 0; i <= numPoints; i++) {
        const tVal = (i / numPoints) * tMax;
        const rem = N0 * Math.pow(2, -tVal / T);
        const dec = N0 - rem;
        points.push({ x: tVal, rem, dec });
      }
      return {
        xLabel: 'Thời gian phân rã t',
        xUnit: 'ngày',
        channels: [
          { key: 'rem', label: 'Hạt nhân còn lại N(t)', unit: '×10¹⁵', color: '#2563eb' },
          { key: 'dec', label: 'Hạt nhân phân rã ΔN(t)', unit: '×10¹⁵', color: '#dc2626' },
        ],
        points,
      };
    }
  }
}
