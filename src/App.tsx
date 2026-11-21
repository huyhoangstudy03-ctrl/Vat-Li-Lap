import { useMemo, useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  BookmarkCheck,
  ChevronRight,
  Layers,
  MessageSquare,
  RotateCcw,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { ALL_LESSONS, getDefaultParams, LESSON_BY_ID } from './physics/curriculum';
import { computeDeltaTable, computeLessonMetrics, sampleTelemetrySeries } from './physics/engine';
import { GradeLevel, LessonId, ParamMap } from './physics/types';
import { SimulationCanvas } from './components/SimulationCanvas';
import { TelemetryOscilloscope } from './components/TelemetryOscilloscope';
import { DeltaComparisonTable } from './components/DeltaComparisonTable';
import { FormulaCorrelationPanel } from './components/FormulaCorrelationPanel';
import { ReferencesPanel } from './components/ReferencesPanel';
import { AiTutorDrawer } from './components/AiTutorDrawer';
import { LessonCatalog } from './components/LessonCatalog';
import { FormulaMatrixView } from './components/FormulaMatrixView';
import { UnitConverterView } from './components/UnitConverterView';

type AppView = 'catalog' | 'lab' | 'formulas' | 'units' | 'references';
type LabSubTab = 'simulation' | 'analytics' | 'formulas' | 'references';

export default function App() {
  const [view, setView] = useState<AppView>('lab');
  const [activeLessonId, setActiveLessonId] = useState<LessonId>('spring-shm');
  const [labTab, setLabTab] = useState<LabSubTab>('simulation');
  const [drawerGrade, setDrawerGrade] = useState<'all' | GradeLevel>('all');
  const [lessonDrawerOpen, setLessonDrawerOpen] = useState(false);

  const [paramsByLesson, setParamsByLesson] = useState<Record<string, ParamMap>>(() => {
    const initial: Record<string, ParamMap> = {};
    for (const lesson of ALL_LESSONS) {
      initial[lesson.id] = getDefaultParams(lesson);
    }
    return initial;
  });

  const [baselineByLesson, setBaselineByLesson] = useState<Record<string, ParamMap>>(() => {
    const initial: Record<string, ParamMap> = {};
    for (const lesson of ALL_LESSONS) {
      initial[lesson.id] = getDefaultParams(lesson);
    }
    return initial;
  });

  const [aiOpen, setAiOpen] = useState(false);
  const [queuedPrompt, setQueuedPrompt] = useState<string | null>(null);

  const activeLesson = LESSON_BY_ID[activeLessonId];
  const currentParams = paramsByLesson[activeLessonId] ?? getDefaultParams(activeLesson);
  const baselineParams = baselineByLesson[activeLessonId] ?? getDefaultParams(activeLesson);

  const metrics = useMemo(
    () => computeLessonMetrics(activeLessonId, currentParams),
    [activeLessonId, currentParams]
  );

  const deltaRows = useMemo(
    () => computeDeltaTable(activeLessonId, baselineParams, currentParams),
    [activeLessonId, baselineParams, currentParams]
  );

  const deltaByKey = useMemo(() => {
    const map: Record<string, (typeof deltaRows)[number]> = {};
    for (const row of deltaRows) {
      map[row.key] = row;
    }
    return map;
  }, [deltaRows]);

  const telemetrySeries = useMemo(
    () => sampleTelemetrySeries(activeLessonId, currentParams, 64),
    [activeLessonId, currentParams]
  );

  const defaultParams = useMemo(() => getDefaultParams(activeLesson), [activeLesson]);
  const hasParamChanges = useMemo(() => {
    return activeLesson.parameters.some(
      (p) => Math.abs((currentParams[p.key] ?? p.defaultValue) - defaultParams[p.key]) > 1e-6
    );
  }, [activeLesson, currentParams, defaultParams]);

  const handleParamChange = (key: string, value: number) => {
    setParamsByLesson((prev) => ({
      ...prev,
      [activeLessonId]: {
        ...(prev[activeLessonId] ?? defaultParams),
        [key]: value,
      },
    }));
  };

  const handleSetBaseline = () => {
    setBaselineByLesson((prev) => ({
      ...prev,
      [activeLessonId]: { ...currentParams },
    }));
  };

  const handleResetDefaults = () => {
    setParamsByLesson((prev) => ({
      ...prev,
      [activeLessonId]: { ...defaultParams },
    }));
    setBaselineByLesson((prev) => ({
      ...prev,
      [activeLessonId]: { ...defaultParams },
    }));
  };

  const handleSelectLesson = (id: LessonId) => {
    setActiveLessonId(id);
    setLabTab('simulation');
    setView('lab');
    setLessonDrawerOpen(false);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handleAskAi = (prompt: string) => {
    setQueuedPrompt(prompt);
    setAiOpen(true);
  };

  const drawerLessons = useMemo(
    () => ALL_LESSONS.filter((l) => drawerGrade === 'all' || l.grade === drawerGrade),
    [drawerGrade]
  );

  const isSplitCockpit = view === 'lab' && (labTab === 'simulation' || labTab === 'analytics');

  const renderControlConsole = () => (
    <aside
      className="w-full lg:w-[370px] xl:w-[400px] shrink-0 lg:h-full flex flex-col bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden"
      aria-label="Bảng điều chỉnh thông số và kết quả tức thời"
    >
      {/* Top Pinned Live Readouts with Inline Delta % */}
      <div className="p-3.5 border-b border-slate-800 bg-slate-950/70 shrink-0">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-semibold text-slate-300">
            Thông số đo tức thời (theo thời gian thực)
          </span>
          <button
            type="button"
            onClick={handleSetBaseline}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-sky-400 hover:text-sky-300 cursor-pointer"
            title="Lưu trạng thái hiện tại làm mốc so sánh Δ"
          >
            <BookmarkCheck className="w-3.5 h-3.5" />
            Đặt mốc Δ
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {metrics.slice(0, 4).map((m) => {
            const dRow = deltaByKey[m.key];
            const changed = dRow && dRow.trend !== 'same';
            return (
              <div
                key={m.key}
                className="bg-[#080d1a] border border-slate-800/90 rounded-lg px-3 py-2"
              >
                <div className="text-[11px] text-slate-400 truncate">
                  {m.label} ({m.symbol})
                </div>
                <div className="mt-0.5 flex items-baseline justify-between gap-1 font-mono tabular-nums">
                  <div className="truncate">
                    <span className="text-base font-bold text-slate-50">
                      {m.value.toFixed(m.precision ?? 2)}
                    </span>
                    {m.unit && (
                      <span className="text-[11px] text-slate-400 ml-1">{m.unit}</span>
                    )}
                  </div>
                  {changed && dRow.percentChange !== null && (
                    <span
                      className={`inline-flex items-center text-[10px] font-semibold shrink-0 ${
                        dRow.trend === 'up' ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {dRow.trend === 'up' ? (
                        <ArrowUpRight className="w-3 h-3" />
                      ) : (
                        <ArrowDownRight className="w-3 h-3" />
                      )}
                      {dRow.percentChange > 0 ? '+' : ''}
                      {dRow.percentChange.toFixed(0)}%
                    </span>
                  )}
                </div>
                {m.note && (
                  <div className="text-[10px] font-medium text-sky-400 truncate mt-0.5">
                    {m.note}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Scrollable Parameter Sliders right alongside the giant simulation */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-sky-400" aria-hidden="true" />
            <h2 className="text-sm font-bold text-slate-100">Điều chỉnh thông số</h2>
          </div>
          <button
            type="button"
            onClick={handleResetDefaults}
            disabled={!hasParamChanges}
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-sky-300 disabled:opacity-35 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            Mặc định
          </button>
        </div>

        <div className="space-y-4">
          {activeLesson.parameters.map((param) => {
            const val = currentParams[param.key] ?? param.defaultValue;
            const inputId = `param-${activeLesson.id}-${param.key}`;
            return (
              <div key={param.key} className="space-y-1.5">
                <div className="flex items-baseline justify-between gap-2">
                  <label htmlFor={inputId} className="text-xs font-semibold text-slate-200">
                    {param.label} ({param.symbol})
                  </label>
                  <span className="text-xs font-mono font-bold tabular-nums text-sky-300">
                    {val} {param.unit}
                  </span>
                </div>
                <input
                  id={inputId}
                  type="range"
                  min={param.min}
                  max={param.max}
                  step={param.step}
                  value={val}
                  onChange={(e) => handleParamChange(param.key, parseFloat(e.target.value))}
                  className="w-full lab-slider"
                />
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono tabular-nums">
                  <span>
                    {param.min} {param.unit}
                  </span>
                  <span>
                    {param.max} {param.unit}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">{param.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Pinned Quick Switch to Full Analytics / Formulas */}
      <div className="px-4 py-2.5 border-t border-slate-800 bg-slate-950/75 flex items-center justify-between gap-2 shrink-0">
        <button
          type="button"
          onClick={() => setLabTab(labTab === 'simulation' ? 'analytics' : 'simulation')}
          className="inline-flex items-center gap-1 text-xs font-semibold text-sky-400 hover:text-sky-300 cursor-pointer"
        >
          {labTab === 'simulation' ? 'Xem đồ thị & Bảng Δ đầy đủ' : 'Quay lại mô phỏng toàn màn hình'}
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => setLabTab('formulas')}
          className="text-xs font-medium text-slate-400 hover:text-slate-100 cursor-pointer"
        >
          Công thức
        </button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen lab-bg-surface text-slate-100 flex flex-col">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-30 bg-[#070b14]/90 backdrop-blur-md border-b border-slate-800/90 shrink-0">
        <div className="w-full px-4 sm:px-6 h-14 flex items-center justify-between gap-8">
          {/* Zone 1: Single text element wordmark */}
          <button
            type="button"
            onClick={() => setView('catalog')}
            className="font-display text-lg font-extrabold tracking-tight text-slate-50 whitespace-nowrap shrink-0 cursor-pointer"
          >
            Vật Lí Lab
          </button>

          {/* Zone 2: 5 concise single-line text nav links */}
          <nav
            className="hidden md:flex items-center gap-5 lg:gap-6 text-sm font-medium text-slate-400"
            aria-label="Điều hướng chính"
          >
            {(
              [
                { id: 'catalog', label: 'Thư viện' },
                { id: 'lab', label: 'Mô phỏng' },
                { id: 'formulas', label: 'Quy đổi công thức' },
                { id: 'units', label: 'Quy đổi đơn vị' },
                { id: 'references', label: 'Tài liệu' },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setView(item.id)}
                className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  view === item.id
                    ? 'border-sky-400 text-slate-50 font-semibold'
                    : 'border-transparent hover:text-slate-100 hover:border-slate-700'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Zone 3: 1 primary CTA */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setAiOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-950 bg-sky-400 hover:bg-sky-300 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Hỏi đáp AI
            </button>
          </div>
        </div>

        {/* Compact mobile navigation row */}
        <nav
          className="flex md:hidden items-center gap-1 px-3 py-1 border-t border-slate-800/80 overflow-x-auto bg-[#070b14]"
          aria-label="Điều hướng di động"
        >
          {(
            [
              { id: 'catalog', label: 'Thư viện' },
              { id: 'lab', label: 'Mô phỏng' },
              { id: 'formulas', label: 'Quy đổi CT' },
              { id: 'units', label: 'Đổi đơn vị' },
              { id: 'references', label: 'Tài liệu' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setView(item.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 cursor-pointer ${
                view === item.id
                  ? 'bg-sky-500/20 text-sky-300 font-semibold'
                  : 'text-slate-400'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {view === 'catalog' && (
          <LessonCatalog
            activeLessonId={activeLessonId}
            onSelectLesson={handleSelectLesson}
          />
        )}

        {view === 'formulas' && (
          <FormulaMatrixView
            onOpenLesson={handleSelectLesson}
            onAskAi={handleAskAi}
          />
        )}

        {view === 'units' && <UnitConverterView />}

        {view === 'references' && (
          <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
            <ReferencesPanel />
          </div>
        )}

        {view === 'lab' && (
          <div className="flex-1 flex flex-col w-full">
            {/* Compact Full-Width Lab Ribbon */}
            <div className="px-4 sm:px-6 py-2.5 border-b border-slate-800/80 bg-slate-950/55 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => setLessonDrawerOpen(true)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-100 bg-slate-900 border border-slate-700 hover:border-sky-500/60 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Layers className="w-3.5 h-3.5 text-sky-400" />
                  Đổi bài học (18)
                </button>
                <div className="min-w-0">
                  <div className="text-[11px] text-slate-400 truncate">
                    Vật lí Lớp {activeLesson.grade} · {activeLesson.chapter} · {activeLesson.lessonNumber}
                  </div>
                  <h1 className="text-sm sm:text-base font-bold text-slate-50 truncate leading-tight">
                    {activeLesson.title}
                  </h1>
                </div>
              </div>

              <div
                className="flex items-center gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800 overflow-x-auto max-w-full"
                role="tablist"
                aria-label="Khu vực học tập bài hiện tại"
              >
                {(
                  [
                    { id: 'simulation', label: 'Mô phỏng trực quan' },
                    { id: 'analytics', label: 'Đồ thị & Bảng Δ' },
                    { id: 'formulas', label: 'Công thức & Quy đổi' },
                    { id: 'references', label: 'Tài liệu đối chiếu' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={labTab === tab.id}
                    onClick={() => setLabTab(tab.id)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      labTab === tab.id
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                        : 'text-slate-400 hover:text-slate-100 border border-transparent'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Mode A: Full-Viewport Simulation Cockpit (Giant Canvas Left + Docked Controls Right) */}
            {labTab === 'simulation' && (
              <div className="flex-1 w-full px-3 sm:px-5 py-3.5 lg:h-[calc(100vh-116px)] lg:min-h-[580px] flex flex-col lg:flex-row gap-4 lg:overflow-hidden">
                <div className="flex-1 min-w-0 lg:h-full">
                  <SimulationCanvas lesson={activeLesson} params={currentParams} />
                </div>
                {renderControlConsole()}
              </div>
            )}

            {/* Mode B: Live Analytics & Delta Table (Left) + Docked Controls (Right) */}
            {labTab === 'analytics' && (
              <div className="flex-1 w-full px-3 sm:px-5 py-4 lg:h-[calc(100vh-116px)] lg:min-h-[580px] flex flex-col lg:flex-row gap-4 lg:overflow-hidden">
                <div className="flex-1 min-w-0 lg:h-full lg:overflow-y-auto space-y-4 pr-0 lg:pr-1">
                  <TelemetryOscilloscope series={telemetrySeries} />
                  <DeltaComparisonTable
                    rows={deltaRows}
                    onSetBaseline={handleSetBaseline}
                    onResetDefaults={handleResetDefaults}
                    hasChanges={hasParamChanges}
                  />
                </div>
                {renderControlConsole()}
              </div>
            )}

            {/* Mode C: Core Formulas, Variable Meanings & THPTQG Conversion Bridges */}
            {labTab === 'formulas' && (
              <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6">
                <FormulaCorrelationPanel
                  key={activeLesson.id}
                  lesson={activeLesson}
                  onAskAiAboutFormula={handleAskAi}
                />
              </div>
            )}

            {/* Mode D: Academic References */}
            {labTab === 'references' && (
              <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6">
                <ReferencesPanel lesson={activeLesson} />
              </div>
            )}
          </div>
        )}
      </main>

      {/* Quiet Footer (hidden in full-viewport cockpit mode on desktop to preserve 100% viewport canvas height) */}
      {!isSplitCockpit && (
        <footer className="border-t border-slate-800/90 bg-[#070b14] mt-10">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
            <span>
              Vật Lí Lab · Hệ thống mô phỏng Vật lí phổ thông Lớp 10, 11, 12 chuẩn GDPT 2018
            </span>
            <span>Đối chiếu SGK Kết nối tri thức, Chân trời sáng tạo, Halliday & Resnick, OpenStax</span>
          </div>
        </footer>
      )}

      {/* Slide-over 18-Lesson Curriculum Switcher Drawer */}
      {lessonDrawerOpen && (
        <div
          className="fixed inset-0 z-50 flex bg-slate-950/70 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-label="Danh mục 18 bài học Vật lí 10, 11, 12"
        >
          <aside className="w-full max-w-sm bg-[#0b1120] h-full border-r border-slate-800 flex flex-col shadow-2xl">
            <div className="p-4 border-b border-slate-800 bg-slate-900/90 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-100">
                  Chọn chuyên đề lý thuyết (10–12)
                </h2>
                <button
                  type="button"
                  onClick={() => setLessonDrawerOpen(false)}
                  aria-label="Đóng danh mục bài học"
                  className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-4 gap-1 p-0.5 bg-slate-950 rounded-lg border border-slate-800">
                {(['all', 10, 11, 12] as const).map((g) => (
                  <button
                    key={String(g)}
                    type="button"
                    onClick={() => setDrawerGrade(g)}
                    className={`py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                      drawerGrade === g
                        ? 'bg-sky-500/20 text-sky-300'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {g === 'all' ? 'Tất cả' : `L.${g}`}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-800/70">
              {drawerLessons.map((lesson) => {
                const isActive = lesson.id === activeLessonId;
                return (
                  <button
                    key={lesson.id}
                    type="button"
                    onClick={() => handleSelectLesson(lesson.id)}
                    className={`w-full text-left px-4 py-3.5 transition-colors cursor-pointer ${
                      isActive ? 'bg-sky-500/12 text-sky-100' : 'hover:bg-slate-900 text-slate-300'
                    }`}
                  >
                    <div className="text-[11px] font-medium text-slate-400 flex items-center justify-between gap-2">
                      <span>
                        Lớp {lesson.grade} · {lesson.lessonNumber}
                      </span>
                      {isActive && <span className="text-sky-400 font-semibold">Đang mở</span>}
                    </div>
                    <div
                      className={`text-sm mt-0.5 leading-snug ${
                        isActive ? 'font-bold text-sky-200' : 'font-medium text-slate-100'
                      }`}
                    >
                      {lesson.title}
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>
          <div className="flex-1" onClick={() => setLessonDrawerOpen(false)} aria-hidden="true" />
        </div>
      )}

      {/* Slide-over Context-Aware AI Technical Tutor */}
      <AiTutorDrawer
        isOpen={aiOpen}
        onClose={() => setAiOpen(false)}
        lesson={activeLesson}
        params={currentParams}
        metrics={metrics}
        queuedPrompt={queuedPrompt}
        onConsumeQueuedPrompt={() => setQueuedPrompt(null)}
      />
    </div>
  );
}
