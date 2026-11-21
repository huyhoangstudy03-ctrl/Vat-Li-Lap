export type UnitDomain = 'mechanics' | 'thermo-geo' | 'waves-angle' | 'electromagnetism' | 'nuclear';

export interface UnitDefinition {
  id: string;
  symbol: string;
  name: string;
  /** Factor to multiply by to obtain the category's base SI unit (for linear units). */
  toBaseFactor?: number;
  /** Custom conversion to base unit (for affine units like temperature). */
  toBase?: (val: number) => number;
  /** Custom conversion from base unit (for affine units like temperature). */
  fromBase?: (baseVal: number) => number;
  note?: string;
}

export interface UnitCategory {
  id: string;
  name: string;
  domain: UnitDomain;
  baseUnitSymbol: string;
  defaultFrom: string;
  defaultTo: string;
  examTip?: string;
  units: UnitDefinition[];
}

export interface SiPrefixItem {
  prefix: string;
  symbol: string;
  exponent: number;
  factorLabel: string;
  example: string;
}

export const DOMAIN_LABELS: Record<UnitDomain, string> = {
  mechanics: 'Cơ học',
  'thermo-geo': 'Nhiệt học & Hình học',
  'waves-angle': 'Sóng, Quang & Góc',
  electromagnetism: 'Điện & Từ trường',
  nuclear: 'Hạt nhân & Khối lượng riêng',
};

export const SI_PREFIXES: SiPrefixItem[] = [
  { prefix: 'Tera', symbol: 'T', exponent: 12, factorLabel: '10¹²', example: '1 THz = 10¹² Hz' },
  { prefix: 'Giga', symbol: 'G', exponent: 9, factorLabel: '10⁹', example: '1 GeV = 10⁹ eV' },
  { prefix: 'Mega', symbol: 'M', exponent: 6, factorLabel: '10⁶', example: '1 MeV = 10⁶ eV' },
  { prefix: 'Kilo', symbol: 'k', exponent: 3, factorLabel: '10³', example: '1 kΩ = 10³ Ω' },
  { prefix: 'Hecto', symbol: 'h', exponent: 2, factorLabel: '10²', example: '1 hPa = 100 Pa' },
  { prefix: 'Deci', symbol: 'd', exponent: -1, factorLabel: '10⁻¹', example: '1 dm = 0,1 m' },
  { prefix: 'Centi', symbol: 'c', exponent: -2, factorLabel: '10⁻²', example: '1 cm = 10⁻² m' },
  { prefix: 'Milli', symbol: 'm', exponent: -3, factorLabel: '10⁻³', example: '1 mH = 10⁻³ H' },
  { prefix: 'Micro', symbol: 'µ', exponent: -6, factorLabel: '10⁻⁶', example: '1 µF = 10⁻⁶ F' },
  { prefix: 'Nano', symbol: 'n', exponent: -9, factorLabel: '10⁻⁹', example: '1 nm = 10⁻⁹ m' },
  { prefix: 'Pico', symbol: 'p', exponent: -12, factorLabel: '10⁻¹²', example: '1 pF = 10⁻¹² F' },
  { prefix: 'Femto', symbol: 'f', exponent: -15, factorLabel: '10⁻¹⁵', example: '1 fm = 10⁻¹⁵ m' },
];

export const THPTQG_UNIT_SHORTCUTS = [
  {
    title: 'Đổi nhanh vận tốc m/s ↔ km/h',
    formula: '1\\ \\text{m/s} = 3{,}6\\ \\text{km/h} \\iff 1\\ \\text{km/h} = \\frac{1}{3{,}6}\\ \\text{m/s}',
    tip: 'Từ km/h sang m/s chia 3,6; từ m/s sang km/h nhân 3,6.',
  },
  {
    title: 'Giao thoa Y-âng không cần đổi sang mét',
    formula: 'i(\\text{mm}) = \\frac{\\lambda(\\mu\\text{m}) \\cdot D(\\text{m})}{a(\\text{mm})}',
    tip: 'Giữ nguyên λ (µm), D (m), a (mm) → kết quả khoảng vân i tự động ra đúng đơn vị mm!',
  },
  {
    title: 'Năng lượng phôtôn & Quang điện (Lớp 12)',
    formula: '1\\ \\text{eV} = 1{,}6\\times 10^{-19}\\ \\text{J}, \\quad \\varepsilon(\\text{eV}) \\approx \\frac{1240}{\\lambda(\\text{nm})} = \\frac{1{,}24}{\\lambda(\\mu\\text{m})}',
    tip: 'Động năng cực đại theo eV bằng đúng giá trị số của hiệu điện thế hãm U_h tính theo Vôn.',
  },
  {
    title: 'Khối lượng & Năng lượng hạt nhân (Lớp 12)',
    formula: '1\\ \\text{u} \\approx 1{,}66054\\times 10^{-27}\\ \\text{kg} = 931{,}5\\ \\text{MeV}/c^2',
    tip: '1 u·c² = 931,5 MeV; 1 MeV = 1,6×10⁻¹³ J.',
  },
  {
    title: 'Nhiệt độ & Khí lí tưởng (GDPT 2018)',
    formula: 'T(\\text{K}) = t(^\\circ\\text{C}) + 273{,}15, \\quad 1\\ \\text{atm} = 101\\,325\\ \\text{Pa} = 760\\ \\text{mmHg}',
    tip: '1 lít = 1 dm³ = 10⁻³ m³; 1 cm³ = 1 mL = 10⁻⁶ m³.',
  },
  {
    title: 'Độ phóng xạ Becơren ↔ Curi',
    formula: '1\\ \\text{Ci} = 3{,}7\\times 10^{10}\\ \\text{Bq} = 37\\ \\text{GBq}',
    tip: '1 Bq = 1 phân rã/giây; khi tính H = λN bắt buộc đổi chu kỳ bán rã T về giây (s)!',
  },
];

const U_KG = 1.6605390666e-27;

export const UNIT_CATEGORIES: UnitCategory[] = [
  {
    id: 'length',
    name: 'Độ dài & Bước sóng',
    domain: 'mechanics',
    baseUnitSymbol: 'm',
    defaultFrom: 'nm',
    defaultTo: 'um',
    examTip: 'Ánh sáng khả kiến: 380 nm – 760 nm (tức 0,38 µm – 0,76 µm). Bán kính Bo r₀ = 5,3×10⁻¹¹ m = 53 pm.',
    units: [
      { id: 'km', symbol: 'km', name: 'Kilômét', toBaseFactor: 1e3 },
      { id: 'm', symbol: 'm', name: 'Mét (SI)', toBaseFactor: 1 },
      { id: 'dm', symbol: 'dm', name: 'Đềximét', toBaseFactor: 1e-1 },
      { id: 'cm', symbol: 'cm', name: 'Xentimét', toBaseFactor: 1e-2 },
      { id: 'mm', symbol: 'mm', name: 'Milimét', toBaseFactor: 1e-3 },
      { id: 'um', symbol: 'µm', name: 'Micrômét', toBaseFactor: 1e-6, note: 'Thường dùng cho bước sóng ánh sáng' },
      { id: 'nm', symbol: 'nm', name: 'Nanômét', toBaseFactor: 1e-9, note: '1 µm = 1000 nm' },
      { id: 'angstrom', symbol: 'Å', name: 'Ångström', toBaseFactor: 1e-10, note: '1 Å = 0,1 nm' },
      { id: 'pm', symbol: 'pm', name: 'Picômét', toBaseFactor: 1e-12, note: 'Cỡ bán kính nguyên tử' },
      { id: 'fm', symbol: 'fm', name: 'Femtômét (Fermi)', toBaseFactor: 1e-15, note: 'Cỡ bán kính hạt nhân' },
      { id: 'inch', symbol: 'in', name: 'Inch', toBaseFactor: 0.0254 },
      { id: 'ft', symbol: 'ft', name: 'Foot', toBaseFactor: 0.3048 },
      { id: 'yd', symbol: 'yd', name: 'Yard', toBaseFactor: 0.9144 },
      { id: 'mile', symbol: 'mi', name: 'Dặm (Mile)', toBaseFactor: 1609.344 },
      { id: 'au', symbol: 'AU', name: 'Đơn vị thiên văn', toBaseFactor: 1.495978707e11 },
      { id: 'ly', symbol: 'ly', name: 'Năm ánh sáng', toBaseFactor: 9.4607304725808e15 },
    ],
  },
  {
    id: 'mass',
    name: 'Khối lượng & Hạt nhân',
    domain: 'mechanics',
    baseUnitSymbol: 'kg',
    defaultFrom: 'u',
    defaultTo: 'mev_c2',
    examTip: 'Trong Vật lí hạt nhân THPTQG: 1 u = 931,5 MeV/c² ≈ 1,66054×10⁻²⁷ kg.',
    units: [
      { id: 'ton', symbol: 'tấn', name: 'Tấn (Tonne)', toBaseFactor: 1000 },
      { id: 'ta', symbol: 'tạ', name: 'Tạ', toBaseFactor: 100 },
      { id: 'yen', symbol: 'yến', name: 'Yến', toBaseFactor: 10 },
      { id: 'kg', symbol: 'kg', name: 'Kilôgam (SI)', toBaseFactor: 1 },
      { id: 'g', symbol: 'g', name: 'Gam', toBaseFactor: 1e-3 },
      { id: 'mg', symbol: 'mg', name: 'Miligam', toBaseFactor: 1e-6 },
      { id: 'ug', symbol: 'µg', name: 'Micrôgam', toBaseFactor: 1e-9 },
      { id: 'u', symbol: 'u', name: 'Đơn vị khối lượng nguyên tử (amu)', toBaseFactor: U_KG, note: '1 u = 931,5 MeV/c²' },
      { id: 'mev_c2', symbol: 'MeV/c²', name: 'Mega electron-vôn trên c²', toBaseFactor: U_KG / 931.5, note: 'Đơn vị khối lượng hạt nhân' },
      { id: 'lb', symbol: 'lb', name: 'Pound', toBaseFactor: 0.45359237 },
      { id: 'oz', symbol: 'oz', name: 'Ounce', toBaseFactor: 0.028349523125 },
    ],
  },
  {
    id: 'time',
    name: 'Thời gian',
    domain: 'mechanics',
    baseUnitSymbol: 's',
    defaultFrom: 'day',
    defaultTo: 's',
    examTip: 'Khi tính độ phóng xạ H = (ln2 / T)·N theo đơn vị Bq, bắt buộc đổi T về giây (1 ngày = 86 400 s).',
    units: [
      { id: 'century', symbol: 'thế kỷ', name: 'Thế kỷ (100 năm)', toBaseFactor: 3.15576e9 },
      { id: 'year', symbol: 'năm', name: 'Năm (365,25 ngày)', toBaseFactor: 31557600 },
      { id: 'day', symbol: 'ngày', name: 'Ngày (24 giờ)', toBaseFactor: 86400 },
      { id: 'hour', symbol: 'h', name: 'Giờ', toBaseFactor: 3600 },
      { id: 'min', symbol: 'phút', name: 'Phút', toBaseFactor: 60 },
      { id: 's', symbol: 's', name: 'Giây (SI)', toBaseFactor: 1 },
      { id: 'ms', symbol: 'ms', name: 'Miligiây', toBaseFactor: 1e-3 },
      { id: 'us', symbol: 'µs', name: 'Micrôgiây', toBaseFactor: 1e-6 },
      { id: 'ns', symbol: 'ns', name: 'Nanôgiây', toBaseFactor: 1e-9 },
      { id: 'ps', symbol: 'ps', name: 'Picôgiây', toBaseFactor: 1e-12 },
    ],
  },
  {
    id: 'speed',
    name: 'Vận tốc & Tốc độ',
    domain: 'mechanics',
    baseUnitSymbol: 'm/s',
    defaultFrom: 'km_h',
    defaultTo: 'm_s',
    examTip: 'Quy đổi kinh điển: 36 km/h = 10 m/s; 54 km/h = 15 m/s; 72 km/h = 20 m/s.',
    units: [
      { id: 'm_s', symbol: 'm/s', name: 'Mét trên giây (SI)', toBaseFactor: 1 },
      { id: 'km_h', symbol: 'km/h', name: 'Kilômét trên giờ', toBaseFactor: 1 / 3.6, note: '1 m/s = 3,6 km/h' },
      { id: 'cm_s', symbol: 'cm/s', name: 'Xentimét trên giây', toBaseFactor: 0.01 },
      { id: 'mm_s', symbol: 'mm/s', name: 'Milimét trên giây', toBaseFactor: 0.001 },
      { id: 'km_s', symbol: 'km/s', name: 'Kilômét trên giây', toBaseFactor: 1000 },
      { id: 'c', symbol: 'c', name: 'Tốc độ ánh sáng chân không', toBaseFactor: 299792458, note: '≈ 3×10⁸ m/s' },
      { id: 'mph', symbol: 'mph', name: 'Dặm trên giờ', toBaseFactor: 0.44704 },
      { id: 'knot', symbol: 'kn', name: 'Hải lý trên giờ (Knot)', toBaseFactor: 1852 / 3600 },
    ],
  },
  {
    id: 'acceleration',
    name: 'Gia tốc',
    domain: 'mechanics',
    baseUnitSymbol: 'm/s²',
    defaultFrom: 'g0',
    defaultTo: 'm_s2',
    examTip: 'Gia tốc rơi tự do tiêu chuẩn g₀ = 9,80665 m/s² (đề thi thường lấy 9,8 hoặc 10 m/s²).',
    units: [
      { id: 'm_s2', symbol: 'm/s²', name: 'Mét trên giây bình phương (SI)', toBaseFactor: 1 },
      { id: 'cm_s2', symbol: 'cm/s²', name: 'Xentimét trên giây bình (Gal)', toBaseFactor: 0.01 },
      { id: 'g0', symbol: 'g₀', name: 'Gia tốc trọng trường chuẩn', toBaseFactor: 9.80665 },
      { id: 'km_h2', symbol: 'km/h²', name: 'Kilômét trên giờ bình', toBaseFactor: 1000 / 12960000 },
      { id: 'ft_s2', symbol: 'ft/s²', name: 'Foot trên giây bình', toBaseFactor: 0.3048 },
    ],
  },
  {
    id: 'force',
    name: 'Lực',
    domain: 'mechanics',
    baseUnitSymbol: 'N',
    defaultFrom: 'kN',
    defaultTo: 'N',
    examTip: '1 N = 1 kg·m/s² = 10⁵ dyn.',
    units: [
      { id: 'MN', symbol: 'MN', name: 'Meganewton', toBaseFactor: 1e6 },
      { id: 'kN', symbol: 'kN', name: 'Kilônewton', toBaseFactor: 1e3 },
      { id: 'N', symbol: 'N', name: 'Newton (SI)', toBaseFactor: 1 },
      { id: 'mN', symbol: 'mN', name: 'Milinewton', toBaseFactor: 1e-3 },
      { id: 'uN', symbol: 'µN', name: 'Micrônewton', toBaseFactor: 1e-6 },
      { id: 'dyn', symbol: 'dyn', name: 'Đyn (hệ CGS)', toBaseFactor: 1e-5 },
      { id: 'kgf', symbol: 'kgf', name: 'Kilôgam lực', toBaseFactor: 9.80665 },
      { id: 'lbf', symbol: 'lbf', name: 'Pound lực', toBaseFactor: 4.4482216152605 },
    ],
  },
  {
    id: 'energy',
    name: 'Năng lượng, Công & Nhiệt lượng',
    domain: 'mechanics',
    baseUnitSymbol: 'J',
    defaultFrom: 'eV',
    defaultTo: 'J',
    examTip: '1 eV = 1,6×10⁻¹⁹ J; 1 MeV = 1,6×10⁻¹³ J; 1 kWh = 3,6×10⁶ J = 3,6 MJ; 1 cal ≈ 4,184 J.',
    units: [
      { id: 'GJ', symbol: 'GJ', name: 'Gigajoule', toBaseFactor: 1e9 },
      { id: 'MJ', symbol: 'MJ', name: 'Megajoule', toBaseFactor: 1e6 },
      { id: 'kJ', symbol: 'kJ', name: 'Kilôjoule', toBaseFactor: 1e3 },
      { id: 'J', symbol: 'J', name: 'Joule (SI)', toBaseFactor: 1 },
      { id: 'mJ', symbol: 'mJ', name: 'Milijoule', toBaseFactor: 1e-3 },
      { id: 'kWh', symbol: 'kWh', name: 'Kilôoát-giờ (Số điện)', toBaseFactor: 3.6e6, note: '1 kWh = 3,6 MJ' },
      { id: 'Wh', symbol: 'Wh', name: 'Oát-giờ', toBaseFactor: 3600 },
      { id: 'cal', symbol: 'cal', name: 'Calo', toBaseFactor: 4.184 },
      { id: 'kcal', symbol: 'kcal', name: 'Kilôcalo', toBaseFactor: 4184 },
      { id: 'eV', symbol: 'eV', name: 'Electron-vôn', toBaseFactor: 1.6e-19, note: 'Chuẩn THPTQG: 1,6×10⁻¹⁹ J' },
      { id: 'keV', symbol: 'keV', name: 'Kilô electron-vôn', toBaseFactor: 1.6e-16 },
      { id: 'MeV', symbol: 'MeV', name: 'Mega electron-vôn', toBaseFactor: 1.6e-13, note: 'Năng lượng hạt nhân' },
      { id: 'GeV', symbol: 'GeV', name: 'Giga electron-vôn', toBaseFactor: 1.6e-10 },
      { id: 'erg', symbol: 'erg', name: 'Erg (hệ CGS)', toBaseFactor: 1e-7 },
      { id: 'BTU', symbol: 'BTU', name: 'British Thermal Unit', toBaseFactor: 1055.05585 },
    ],
  },
  {
    id: 'power',
    name: 'Công suất',
    domain: 'mechanics',
    baseUnitSymbol: 'W',
    defaultFrom: 'kW',
    defaultTo: 'hp',
    examTip: '1 W = 1 J/s; 1 HP (Anh) ≈ 745,7 W; 1 CV (mã lực mét) ≈ 735,5 W.',
    units: [
      { id: 'GW', symbol: 'GW', name: 'Gigaoát', toBaseFactor: 1e9 },
      { id: 'MW', symbol: 'MW', name: 'Megaoát', toBaseFactor: 1e6 },
      { id: 'kW', symbol: 'kW', name: 'Kilôoát', toBaseFactor: 1e3 },
      { id: 'W', symbol: 'W', name: 'Oát (SI)', toBaseFactor: 1 },
      { id: 'mW', symbol: 'mW', name: 'Milioát', toBaseFactor: 1e-3 },
      { id: 'uW', symbol: 'µW', name: 'Micrôoát', toBaseFactor: 1e-6 },
      { id: 'hp', symbol: 'HP', name: 'Mã lực cơ học (Anh)', toBaseFactor: 745.699872 },
      { id: 'cv', symbol: 'CV', name: 'Mã lực mét (PS)', toBaseFactor: 735.49875 },
      { id: 'cal_s', symbol: 'cal/s', name: 'Calo trên giây', toBaseFactor: 4.184 },
    ],
  },
  {
    id: 'pressure',
    name: 'Áp suất',
    domain: 'thermo-geo',
    baseUnitSymbol: 'Pa',
    defaultFrom: 'atm',
    defaultTo: 'Pa',
    examTip: 'Khí lí tưởng 12: 1 atm = 101 325 Pa = 760 mmHg; 1 bar = 10⁵ Pa.',
    units: [
      { id: 'MPa', symbol: 'MPa', name: 'Megapascal', toBaseFactor: 1e6 },
      { id: 'kPa', symbol: 'kPa', name: 'Kilôpascal', toBaseFactor: 1e3 },
      { id: 'hPa', symbol: 'hPa', name: 'Hectopascal', toBaseFactor: 100 },
      { id: 'Pa', symbol: 'Pa', name: 'Pascal / N/m² (SI)', toBaseFactor: 1 },
      { id: 'bar', symbol: 'bar', name: 'Bar', toBaseFactor: 1e5 },
      { id: 'mbar', symbol: 'mbar', name: 'Milibar', toBaseFactor: 100 },
      { id: 'atm', symbol: 'atm', name: 'Atmốtphe vật lí chuẩn', toBaseFactor: 101325, note: '1 atm = 760 mmHg' },
      { id: 'mmHg', symbol: 'mmHg', name: 'Milimét thủy ngân (Torr)', toBaseFactor: 101325 / 760 },
      { id: 'cmHg', symbol: 'cmHg', name: 'Xentimét thủy ngân', toBaseFactor: 101325 / 76 },
      { id: 'at', symbol: 'at', name: 'Atmốtphe kỹ thuật (kgf/cm²)', toBaseFactor: 98066.5 },
      { id: 'psi', symbol: 'psi', name: 'Pound trên inch vuông', toBaseFactor: 6894.757293 },
    ],
  },
  {
    id: 'temperature',
    name: 'Nhiệt độ (Thang đo tuyệt đối)',
    domain: 'thermo-geo',
    baseUnitSymbol: 'K',
    defaultFrom: 'C',
    defaultTo: 'K',
    examTip: 'GDPT 2018: T(K) = t(°C) + 273,15; t(°F) = 1,8·t(°C) + 32. Độ chênh lệch ΔT(K) = Δt(°C).',
    units: [
      {
        id: 'C',
        symbol: '°C',
        name: 'Độ Celsius',
        toBase: (v) => v + 273.15,
        fromBase: (k) => k - 273.15,
        note: '0 °C = 273,15 K',
      },
      {
        id: 'K',
        symbol: 'K',
        name: 'Kelvin (SI)',
        toBase: (v) => v,
        fromBase: (k) => k,
        note: 'Nhiệt độ tuyệt đối (≥ 0 K)',
      },
      {
        id: 'F',
        symbol: '°F',
        name: 'Độ Fahrenheit',
        toBase: (v) => ((v - 32) * 5) / 9 + 273.15,
        fromBase: (k) => ((k - 273.15) * 9) / 5 + 32,
        note: '0 °C = 32 °F; 100 °C = 212 °F',
      },
      {
        id: 'R',
        symbol: '°R',
        name: 'Độ Rankine',
        toBase: (v) => (v * 5) / 9,
        fromBase: (k) => (k * 9) / 5,
      },
    ],
  },
  {
    id: 'area',
    name: 'Diện tích',
    domain: 'thermo-geo',
    baseUnitSymbol: 'm²',
    defaultFrom: 'cm2',
    defaultTo: 'm2',
    examTip: 'Tính từ thông Φ = NBS: nhớ 1 cm² = 10⁻⁴ m² và 1 mm² = 10⁻⁶ m²!',
    units: [
      { id: 'km2', symbol: 'km²', name: 'Kilômét vuông', toBaseFactor: 1e6 },
      { id: 'ha', symbol: 'ha', name: 'Hecta', toBaseFactor: 1e4 },
      { id: 'm2', symbol: 'm²', name: 'Mét vuông (SI)', toBaseFactor: 1 },
      { id: 'dm2', symbol: 'dm²', name: 'Đềximét vuông', toBaseFactor: 1e-2 },
      { id: 'cm2', symbol: 'cm²', name: 'Xentimét vuông', toBaseFactor: 1e-4 },
      { id: 'mm2', symbol: 'mm²', name: 'Milimét vuông', toBaseFactor: 1e-6 },
      { id: 'um2', symbol: 'µm²', name: 'Micrômét vuông', toBaseFactor: 1e-12 },
      { id: 'barn', symbol: 'b', name: 'Barn (tiết diện hạt nhân)', toBaseFactor: 1e-28 },
    ],
  },
  {
    id: 'volume',
    name: 'Thể tích',
    domain: 'thermo-geo',
    baseUnitSymbol: 'm³',
    defaultFrom: 'dm3',
    defaultTo: 'm3',
    examTip: '1 lít = 1 dm³ = 10⁻³ m³; 1 mL = 1 cm³ = 10⁻⁶ m³.',
    units: [
      { id: 'm3', symbol: 'm³', name: 'Mét khối (SI)', toBaseFactor: 1 },
      { id: 'dm3', symbol: 'lít (dm³)', name: 'Lít / Đềximét khối', toBaseFactor: 1e-3 },
      { id: 'cm3', symbol: 'mL (cm³)', name: 'Mililít / Xentimét khối', toBaseFactor: 1e-6 },
      { id: 'mm3', symbol: 'mm³', name: 'Milimét khối', toBaseFactor: 1e-9 },
      { id: 'uL', symbol: 'µL', name: 'Micrôlít', toBaseFactor: 1e-9 },
      { id: 'gal', symbol: 'gal', name: 'Gallon (Mỹ)', toBaseFactor: 0.003785411784 },
    ],
  },
  {
    id: 'angle',
    name: 'Góc phẳng & Pha dao động',
    domain: 'waves-angle',
    baseUnitSymbol: 'rad',
    defaultFrom: 'deg',
    defaultTo: 'rad',
    examTip: '30° = π/6; 45° = π/4; 60° = π/3; 90° = π/2; 180° = π; 360° = 2π rad.',
    units: [
      { id: 'rad', symbol: 'rad', name: 'Radian (SI)', toBaseFactor: 1 },
      { id: 'deg', symbol: '°', name: 'Độ (Degree)', toBaseFactor: Math.PI / 180 },
      { id: 'rev', symbol: 'vòng', name: 'Vòng quay (2π rad)', toBaseFactor: 2 * Math.PI },
      { id: 'grad', symbol: 'grad', name: 'Gradian', toBaseFactor: Math.PI / 200 },
      { id: 'arcmin', symbol: "'", name: 'Phút cung (1/60 độ)', toBaseFactor: Math.PI / (180 * 60) },
      { id: 'arcsec', symbol: '"', name: 'Giây cung (1/3600 độ)', toBaseFactor: Math.PI / (180 * 3600) },
    ],
  },
  {
    id: 'frequency',
    name: 'Tần số & Tốc độ góc',
    domain: 'waves-angle',
    baseUnitSymbol: 'Hz',
    defaultFrom: 'Hz',
    defaultTo: 'rad_s',
    examTip: 'ω = 2πf (50 Hz = 100π ≈ 314,16 rad/s). Máy phát điện: 1 vòng/phút = 1/60 vòng/giây.',
    units: [
      { id: 'THz', symbol: 'THz', name: 'Terahertz', toBaseFactor: 1e12 },
      { id: 'GHz', symbol: 'GHz', name: 'Gigahertz', toBaseFactor: 1e9 },
      { id: 'MHz', symbol: 'MHz', name: 'Megahertz', toBaseFactor: 1e6 },
      { id: 'kHz', symbol: 'kHz', name: 'Kilôhertz', toBaseFactor: 1e3 },
      { id: 'Hz', symbol: 'Hz', name: 'Hertz / vòng/giây (SI)', toBaseFactor: 1 },
      { id: 'rpm', symbol: 'vòng/phút', name: 'Vòng trên phút (rpm)', toBaseFactor: 1 / 60 },
      { id: 'rad_s', symbol: 'rad/s', name: 'Radian trên giây (ω)', toBaseFactor: 1 / (2 * Math.PI), note: '1 Hz = 2π rad/s' },
    ],
  },
  {
    id: 'charge',
    name: 'Điện tích',
    domain: 'electromagnetism',
    baseUnitSymbol: 'C',
    defaultFrom: 'uC',
    defaultTo: 'C',
    examTip: '1 µC = 10⁻⁶ C; 1 nC = 10⁻⁹ C; điện tích nguyên tố |e| = 1,6×10⁻¹⁹ C.',
    units: [
      { id: 'C', symbol: 'C', name: 'Cu-lông (SI)', toBaseFactor: 1 },
      { id: 'mC', symbol: 'mC', name: 'Mili Cu-lông', toBaseFactor: 1e-3 },
      { id: 'uC', symbol: 'µC', name: 'Micrô Cu-lông', toBaseFactor: 1e-6 },
      { id: 'nC', symbol: 'nC', name: 'Nanô Cu-lông', toBaseFactor: 1e-9 },
      { id: 'pC', symbol: 'pC', name: 'Picô Cu-lông', toBaseFactor: 1e-12 },
      { id: 'e_elem', symbol: 'e', name: 'Điện tích nguyên tố', toBaseFactor: 1.6e-19 },
      { id: 'Ah', symbol: 'Ah', name: 'Ampe-giờ', toBaseFactor: 3600 },
      { id: 'mAh', symbol: 'mAh', name: 'Miliampe-giờ (pin)', toBaseFactor: 3.6 },
    ],
  },
  {
    id: 'voltage',
    name: 'Hiệu điện thế & Suất điện động',
    domain: 'electromagnetism',
    baseUnitSymbol: 'V',
    defaultFrom: 'kV',
    defaultTo: 'V',
    units: [
      { id: 'MV', symbol: 'MV', name: 'Megavôn', toBaseFactor: 1e6 },
      { id: 'kV', symbol: 'kV', name: 'Kilôvôn', toBaseFactor: 1e3 },
      { id: 'V', symbol: 'V', name: 'Vôn (SI)', toBaseFactor: 1 },
      { id: 'mV', symbol: 'mV', name: 'Milivôn', toBaseFactor: 1e-3 },
      { id: 'uV', symbol: 'µV', name: 'Micrôvôn', toBaseFactor: 1e-6 },
    ],
  },
  {
    id: 'current',
    name: 'Cường độ dòng điện',
    domain: 'electromagnetism',
    baseUnitSymbol: 'A',
    defaultFrom: 'mA',
    defaultTo: 'A',
    units: [
      { id: 'kA', symbol: 'kA', name: 'Kilôampe', toBaseFactor: 1e3 },
      { id: 'A', symbol: 'A', name: 'Ampe (SI)', toBaseFactor: 1 },
      { id: 'mA', symbol: 'mA', name: 'Miliampe', toBaseFactor: 1e-3 },
      { id: 'uA', symbol: 'µA', name: 'Micrôampe', toBaseFactor: 1e-6 },
      { id: 'nA', symbol: 'nA', name: 'Nanôampe', toBaseFactor: 1e-9 },
    ],
  },
  {
    id: 'resistance',
    name: 'Điện trở & Tổng trở',
    domain: 'electromagnetism',
    baseUnitSymbol: 'Ω',
    defaultFrom: 'kOhm',
    defaultTo: 'Ohm',
    units: [
      { id: 'GOhm', symbol: 'GΩ', name: 'Gigaôm', toBaseFactor: 1e9 },
      { id: 'MOhm', symbol: 'MΩ', name: 'Megaôm', toBaseFactor: 1e6 },
      { id: 'kOhm', symbol: 'kΩ', name: 'Kilôôm', toBaseFactor: 1e3 },
      { id: 'Ohm', symbol: 'Ω', name: 'Ôm (SI)', toBaseFactor: 1 },
      { id: 'mOhm', symbol: 'mΩ', name: 'Miliôm', toBaseFactor: 1e-3 },
    ],
  },
  {
    id: 'capacitance',
    name: 'Điện dung (Tụ điện)',
    domain: 'electromagnetism',
    baseUnitSymbol: 'F',
    defaultFrom: 'uF',
    defaultTo: 'F',
    examTip: 'Mạch RLC: 1 µF = 10⁻⁶ F; 1 nF = 10⁻⁹ F; 1 pF = 10⁻¹² F.',
    units: [
      { id: 'F', symbol: 'F', name: 'Fara (SI)', toBaseFactor: 1 },
      { id: 'mF', symbol: 'mF', name: 'Milifara', toBaseFactor: 1e-3 },
      { id: 'uF', symbol: 'µF', name: 'Micrôfara', toBaseFactor: 1e-6 },
      { id: 'nF', symbol: 'nF', name: 'Nanôfara', toBaseFactor: 1e-9 },
      { id: 'pF', symbol: 'pF', name: 'Picôfara', toBaseFactor: 1e-12 },
    ],
  },
  {
    id: 'inductance',
    name: 'Độ tự cảm (Cuộn cảm)',
    domain: 'electromagnetism',
    baseUnitSymbol: 'H',
    defaultFrom: 'mH',
    defaultTo: 'H',
    units: [
      { id: 'H', symbol: 'H', name: 'Henry (SI)', toBaseFactor: 1 },
      { id: 'mH', symbol: 'mH', name: 'Milihenry', toBaseFactor: 1e-3 },
      { id: 'uH', symbol: 'µH', name: 'Micrôhenry', toBaseFactor: 1e-6 },
      { id: 'nH', symbol: 'nH', name: 'Nanôhenry', toBaseFactor: 1e-9 },
    ],
  },
  {
    id: 'magnetic-field',
    name: 'Cảm ứng từ',
    domain: 'electromagnetism',
    baseUnitSymbol: 'T',
    defaultFrom: 'mT',
    defaultTo: 'G',
    examTip: '1 Tesla = 10⁴ Gauss; từ trường Trái Đất vào khoảng 30–60 µT.',
    units: [
      { id: 'T', symbol: 'T', name: 'Tesla (SI)', toBaseFactor: 1 },
      { id: 'mT', symbol: 'mT', name: 'Militesla', toBaseFactor: 1e-3 },
      { id: 'uT', symbol: 'µT', name: 'Micrôtesla', toBaseFactor: 1e-6 },
      { id: 'nT', symbol: 'nT', name: 'Nanôtesla', toBaseFactor: 1e-9 },
      { id: 'G', symbol: 'G', name: 'Gauss (hệ CGS)', toBaseFactor: 1e-4 },
    ],
  },
  {
    id: 'magnetic-flux',
    name: 'Từ thông',
    domain: 'electromagnetism',
    baseUnitSymbol: 'Wb',
    defaultFrom: 'mWb',
    defaultTo: 'Wb',
    units: [
      { id: 'Wb', symbol: 'Wb', name: 'Vêbe / Weber (SI)', toBaseFactor: 1 },
      { id: 'mWb', symbol: 'mWb', name: 'Milivêbe', toBaseFactor: 1e-3 },
      { id: 'uWb', symbol: 'µWb', name: 'Micrôvêbe', toBaseFactor: 1e-6 },
      { id: 'Mx', symbol: 'Mx', name: 'Maxwell (hệ CGS)', toBaseFactor: 1e-8 },
    ],
  },
  {
    id: 'radioactivity',
    name: 'Độ phóng xạ',
    domain: 'nuclear',
    baseUnitSymbol: 'Bq',
    defaultFrom: 'Ci',
    defaultTo: 'GBq',
    examTip: '1 Ci (Curi) = 3,7×10¹⁰ Bq = 37 GBq.',
    units: [
      { id: 'TBq', symbol: 'TBq', name: 'Terabecơren', toBaseFactor: 1e12 },
      { id: 'GBq', symbol: 'GBq', name: 'Gigabecơren', toBaseFactor: 1e9 },
      { id: 'MBq', symbol: 'MBq', name: 'Megabecơren', toBaseFactor: 1e6 },
      { id: 'kBq', symbol: 'kBq', name: 'Kilôbecơren', toBaseFactor: 1e3 },
      { id: 'Bq', symbol: 'Bq', name: 'Becơren (SI)', toBaseFactor: 1 },
      { id: 'Ci', symbol: 'Ci', name: 'Curi (Curie)', toBaseFactor: 3.7e10 },
      { id: 'mCi', symbol: 'mCi', name: 'Milicuri', toBaseFactor: 3.7e7 },
      { id: 'uCi', symbol: 'µCi', name: 'Micrôcuri', toBaseFactor: 3.7e4 },
    ],
  },
  {
    id: 'density',
    name: 'Khối lượng riêng',
    domain: 'nuclear',
    baseUnitSymbol: 'kg/m³',
    defaultFrom: 'g_cm3',
    defaultTo: 'kg_m3',
    examTip: 'Nước có ρ = 1 g/cm³ = 1 kg/lít = 1000 kg/m³.',
    units: [
      { id: 'kg_m3', symbol: 'kg/m³', name: 'Kilôgam trên mét khối (SI)', toBaseFactor: 1 },
      { id: 'g_cm3', symbol: 'g/cm³', name: 'Gam trên cm³ (= kg/lít)', toBaseFactor: 1000 },
      { id: 'g_L', symbol: 'g/L', name: 'Gam trên lít', toBaseFactor: 1 },
      { id: 'mg_cm3', symbol: 'mg/cm³', name: 'Miligam trên cm³', toBaseFactor: 1 },
    ],
  },
];

export const UNIT_CATEGORY_BY_ID: Record<string, UnitCategory> = Object.fromEntries(
  UNIT_CATEGORIES.map((cat) => [cat.id, cat])
);

export function convertUnitValue(
  categoryId: string,
  fromUnitId: string,
  toUnitId: string,
  value: number
): number {
  if (!Number.isFinite(value)) return NaN;
  const category = UNIT_CATEGORY_BY_ID[categoryId];
  if (!category) return NaN;
  const fromUnit = category.units.find((u) => u.id === fromUnitId);
  const toUnit = category.units.find((u) => u.id === toUnitId);
  if (!fromUnit || !toUnit) return NaN;
  if (fromUnitId === toUnitId) return value;

  const baseVal = fromUnit.toBase
    ? fromUnit.toBase(value)
    : value * (fromUnit.toBaseFactor ?? 1);

  return toUnit.fromBase
    ? toUnit.fromBase(baseVal)
    : baseVal / (toUnit.toBaseFactor ?? 1);
}

export function convertToAllUnits(
  categoryId: string,
  fromUnitId: string,
  value: number
): Array<{ unit: UnitDefinition; value: number }> {
  const category = UNIT_CATEGORY_BY_ID[categoryId];
  if (!category) return [];
  return category.units.map((unit) => ({
    unit,
    value: convertUnitValue(categoryId, fromUnitId, unit.id, value),
  }));
}

export function formatPhysicsNumber(val: number): {
  standard: string;
  scientific: string;
} {
  if (!Number.isFinite(val)) {
    return { standard: '—', scientific: '—' };
  }
  if (val === 0) {
    return { standard: '0', scientific: '0' };
  }
  const abs = Math.abs(val);
  const expStr = val.toExponential(5).replace(/\.?0+e/, 'e').replace('e+', ' × 10^').replace('e-', ' × 10^-');

  let standard: string;
  if (abs >= 1e-4 && abs < 1e9) {
    // Clean decimal representation without ugly floating-point tails
    const rounded = Number(val.toPrecision(10));
    standard = rounded.toLocaleString('en-US', {
      maximumFractionDigits: 8,
      useGrouping: true,
    });
  } else {
    standard = expStr;
  }

  return { standard, scientific: expStr };
}

export function describeConversionFormula(
  categoryId: string,
  fromUnitId: string,
  toUnitId: string
): string {
  const category = UNIT_CATEGORY_BY_ID[categoryId];
  if (!category) return '';
  const fromUnit = category.units.find((u) => u.id === fromUnitId);
  const toUnit = category.units.find((u) => u.id === toUnitId);
  if (!fromUnit || !toUnit) return '';
  if (fromUnitId === toUnitId) return `1 ${fromUnit.symbol} = 1 ${toUnit.symbol}`;

  if (categoryId === 'temperature') {
    if (fromUnitId === 'C' && toUnitId === 'K') return 'T(K) = t(°C) + 273,15';
    if (fromUnitId === 'K' && toUnitId === 'C') return 't(°C) = T(K) - 273,15';
    if (fromUnitId === 'C' && toUnitId === 'F') return 't(°F) = t(°C) × 9/5 + 32';
    if (fromUnitId === 'F' && toUnitId === 'C') return 't(°C) = (t(°F) - 32) × 5/9';
    if (fromUnitId === 'K' && toUnitId === 'F') return 't(°F) = (T(K) - 273,15) × 9/5 + 32';
    if (fromUnitId === 'F' && toUnitId === 'K') return 'T(K) = (t(°F) - 32) × 5/9 + 273,15';
    return `Quy đổi tuyến tính qua Kelvin (K): ${fromUnit.symbol} → K → ${toUnit.symbol}`;
  }

  const ratio = convertUnitValue(categoryId, fromUnitId, toUnitId, 1);
  const formatted = formatPhysicsNumber(ratio).standard;
  return `1 ${fromUnit.symbol} = ${formatted} ${toUnit.symbol}`;
}
