export type GradeLevel = 10 | 11 | 12;

export type LessonId =
  // Lớp 10
  | 'kinematics-1d'
  | 'projectile-motion'
  | 'newton-inclined'
  | 'energy-conservation'
  | 'momentum-collision'
  | 'circular-motion'
  // Lớp 11
  | 'spring-shm'
  | 'simple-pendulum'
  | 'wave-interference'
  | 'young-double-slit'
  | 'coulomb-capacitor'
  | 'ohms-closed-circuit'
  // Lớp 12
  | 'thermo-first-law'
  | 'ideal-gas-kinetic'
  | 'ac-generator-em'
  | 'rlc-resonance'
  | 'photoelectric-bohr'
  | 'nuclear-decay';

export interface ParameterDef {
  key: string;
  label: string;
  symbol: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  description: string;
}

export interface CalculatedMetric {
  key: string;
  label: string;
  symbol: string;
  value: number;
  unit: string;
  precision?: number;
  note?: string;
  highlight?: boolean;
}

export interface DeltaRow {
  key: string;
  label: string;
  symbol: string;
  unit: string;
  baseline: number;
  current: number;
  delta: number;
  percentChange: number | null;
  ratio: number | null;
  trend: 'up' | 'down' | 'same';
  precision: number;
}

export interface SymbolMeaning {
  symbol: string;
  name: string;
  unit: string;
  meaning: string;
}

export interface FormulaItem {
  id: string;
  title: string;
  latex: string;
  condition?: string;
  symbols: SymbolMeaning[];
}

export interface FormulaTransformation {
  id: string;
  title: string;
  baseLatex: string;
  derivedLatex: string;
  givenVars: string[];
  targetVar: string;
  bridgeLogic: string;
  examPattern: string;
}

export interface ReferenceSource {
  title: string;
  authors: string;
  publisher: string;
  section: string;
  reliability: string;
  url?: string;
}

export interface TelemetryChannel {
  key: string;
  label: string;
  unit: string;
  color: string;
}

export interface TelemetrySeries {
  xLabel: string;
  xUnit: string;
  channels: TelemetryChannel[];
  points: Array<Record<string, number>>;
}

export interface PhysicsLesson {
  id: LessonId;
  grade: GradeLevel;
  chapter: string;
  lessonNumber: string;
  title: string;
  shortDesc: string;
  phenomenonSummary: string;
  bannerImage: string;
  bannerAlt: string;
  thptqgWeight: string;
  parameters: ParameterDef[];
  formulas: FormulaItem[];
  transformations: FormulaTransformation[];
  references: ReferenceSource[];
  suggestedQuestions: string[];
}

export type ParamMap = Record<string, number>;
