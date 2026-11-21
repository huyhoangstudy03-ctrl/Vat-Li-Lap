import { useMemo, useState } from 'react';
import { ArrowDownRight, ArrowRight, GitBranch, MessageSquare, Search } from 'lucide-react';
import { ALL_LESSONS } from '../physics/curriculum';
import { FORMULA_CONVERSION_HUBS } from '../physics/formulaConversions';
import { GradeLevel, LessonId } from '../physics/types';
import { MathText } from './MathText';

interface FormulaMatrixViewProps {
  onOpenLesson: (id: LessonId) => void;
  onAskAi?: (prompt: string) => void;
}

type MatrixFilter = 'all' | 'cross' | GradeLevel;
type ViewMode = 'hubs' | 'all-lessons';

export function FormulaMatrixView({ onOpenLesson, onAskAi }: FormulaMatrixViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('hubs');
  const [filter, setFilter] = useState<MatrixFilter>('all');
  const [search, setSearch] = useState('');
  const [selectedHubId, setSelectedHubId] = useState<string>(FORMULA_CONVERSION_HUBS[0].id);

  const filteredHubs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return FORMULA_CONVERSION_HUBS.filter((hub) => {
      if (filter !== 'all' && hub.gradeTag !== filter) return false;
      if (!q) return true;
      return (
        hub.baseTitle.toLowerCase().includes(q) ||
        hub.topicLabel.toLowerCase().includes(q) ||
        hub.coreIdea.toLowerCase().includes(q) ||
        hub.branches.some(
          (b) =>
            b.targetTitle.toLowerCase().includes(q) ||
            b.substitutionStep.toLowerCase().includes(q) ||
            b.examSignal.toLowerCase().includes(q) ||
            b.targetVar.toLowerCase().includes(q) ||
            b.givenVars.some((g) => g.toLowerCase().includes(q))
        )
      );
    });
  }, [filter, search]);

  const activeHub = useMemo(() => {
    return (
      filteredHubs.find((h) => h.id === selectedHubId) ??
      filteredHubs[0] ??
      null
    );
  }, [filteredHubs, selectedHubId]);

  const lessonItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return ALL_LESSONS.filter((l) => filter === 'all' || filter === 'cross' || l.grade === filter)
      .flatMap((lesson) =>
        lesson.transformations.map((tr) => ({
          lesson,
          tr,
        }))
      )
      .filter(({ lesson, tr }) => {
        if (!q) return true;
        return (
          lesson.title.toLowerCase().includes(q) ||
          tr.title.toLowerCase().includes(q) ||
          tr.examPattern.toLowerCase().includes(q) ||
          tr.targetVar.toLowerCase().includes(q) ||
          tr.givenVars.some((v) => v.toLowerCase().includes(q))
        );
      });
  }, [filter, search]);

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-7 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="space-y-1.5">
          <div className="text-xs font-medium text-sky-400">
            Bản đồ quy đổi công thức · Liên thông Lớp 10, 11, 12 ôn thi THPT Quốc gia
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-50 tracking-tight">
            Công thức nào quy đổi sang công thức nào?
          </h1>
          <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
            Chọn một công thức gốc để xem toàn bộ các nhánh biến đổi tương đương sang công thức hệ quả và công thức liên chuyên đề, kèm phép thế đại số và dấu hiệu nhận biết trong đề thi THPTQG.
          </p>
        </div>

        {/* Mode switch */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-xl border border-slate-800 w-fit shrink-0">
          <button
            type="button"
            onClick={() => setViewMode('hubs')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              viewMode === 'hubs'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                : 'text-slate-400 hover:text-slate-100 border border-transparent'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5" />
            Sơ đồ nhánh gốc → đích ({FORMULA_CONVERSION_HUBS.length})
          </button>
          <button
            type="button"
            onClick={() => setViewMode('all-lessons')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              viewMode === 'all-lessons'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                : 'text-slate-400 hover:text-slate-100 border border-transparent'
            }`}
          >
            Theo 18 bài học ({lessonItems.length})
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800 overflow-x-auto max-w-full">
          {(
            [
              { id: 'all', label: 'Tất cả' },
              { id: 'cross', label: 'Liên chuyên đề 10–12' },
              { id: 10, label: 'Lớp 10' },
              { id: 11, label: 'Lớp 11' },
              { id: 12, label: 'Lớp 12' },
            ] as const
          ).map((item) => (
            <button
              key={String(item.id)}
              type="button"
              onClick={() => setFilter(item.id)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                filter === item.id
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                  : 'text-slate-400 hover:text-slate-100 border border-transparent'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <label htmlFor="formula-matrix-search" className="sr-only">
            Tìm theo đại lượng đề cho, công thức hoặc dạng bài
          </label>
          <input
            id="formula-matrix-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo đại lượng hoặc dạng bài (vd: cộng hưởng, U_h, v_rms)..."
            className="w-full pl-9 pr-3.5 py-2 text-sm bg-slate-900 border border-slate-700 text-slate-100 placeholder:text-slate-500 rounded-lg focus:outline-none focus:border-sky-500"
          />
        </div>
      </div>

      {/* Mode 1: Interactive Base Formula -> Multiple Derived Formulas Branch Map */}
      {viewMode === 'hubs' && (
        <>
          {filteredHubs.length === 0 ? (
            <div className="p-10 text-center bg-slate-900/80 border border-slate-800 rounded-xl space-y-2">
              <div className="text-base font-bold text-slate-200">
                Không tìm thấy cụm quy đổi công thức phù hợp
              </div>
              <p className="text-xs text-slate-400">
                Thử đổi bộ lọc khối lớp hoặc nhập từ khóa ngắn hơn (ví dụ: năng lượng, chu kỳ, tụ điện, hạt nhân).
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Left list of Base Formula Hubs */}
              <aside
                className="lg:col-span-4 bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden"
                aria-label="Danh sách công thức gốc"
              >
                <div className="px-4 py-3 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    1. Chọn công thức gốc ({filteredHubs.length})
                  </h2>
                </div>
                <div className="divide-y divide-slate-800/70 max-h-[680px] overflow-y-auto">
                  {filteredHubs.map((hub) => {
                    const isSelected = activeHub?.id === hub.id;
                    return (
                      <button
                        key={hub.id}
                        type="button"
                        onClick={() => setSelectedHubId(hub.id)}
                        className={`w-full text-left px-4 py-3.5 transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-sky-500/15 border-l-2 border-l-sky-400'
                            : 'hover:bg-slate-800/60 border-l-2 border-l-transparent'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 text-[11px]">
                          <span className={hub.gradeTag === 'cross' ? 'text-amber-300 font-semibold' : 'text-sky-400 font-medium'}>
                            {hub.topicLabel}
                          </span>
                          <span className="font-mono text-slate-400 shrink-0">
                            → {hub.branches.length} nhánh
                          </span>
                        </div>
                        <div className={`text-sm mt-1 leading-snug ${isSelected ? 'font-bold text-slate-50' : 'font-medium text-slate-200'}`}>
                          {hub.baseTitle}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </aside>

              {/* Right visual Base -> Branches Tree */}
              {activeHub && (
                <section className="lg:col-span-8 space-y-4">
                  {/* Base Formula Root Card */}
                  <div className="bg-slate-900/95 border border-sky-500/45 rounded-xl p-5 sm:p-6 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-sky-300">
                        CÔNG THỨC GỐC · {activeHub.topicLabel}
                      </span>
                      <button
                        type="button"
                        onClick={() => onOpenLesson(activeHub.primaryLessonId)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-sky-400 hover:text-sky-300 cursor-pointer"
                      >
                        Mở mô phỏng gốc
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <h2 className="text-lg sm:text-xl font-extrabold text-slate-50">
                      {activeHub.baseTitle}
                    </h2>
                    <div className="p-4 rounded-xl bg-[#070b14] border border-slate-800 text-slate-50 overflow-x-auto">
                      <MathText latex={activeHub.baseLatex} display />
                    </div>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      {activeHub.coreIdea}
                    </p>
                  </div>

                  {/* Derived Formula Branches */}
                  <div className="space-y-3 pl-2 sm:pl-5 border-l-2 border-sky-500/35">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400 pl-2">
                      2. Quy đổi trực tiếp sang {activeHub.branches.length} công thức sau:
                    </div>

                    {activeHub.branches.map((branch, idx) => (
                      <article
                        key={branch.id}
                        className="bg-slate-900/90 border border-slate-800 hover:border-sky-500/40 rounded-xl p-4 sm:p-5 space-y-3 transition-colors"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-sky-500/20 text-sky-300 font-mono text-xs font-bold shrink-0">
                              {idx + 1}
                            </span>
                            <h3 className="text-sm sm:text-base font-bold text-slate-100">
                              {branch.targetTitle}
                            </h3>
                          </div>
                          <span className="text-xs font-mono font-semibold text-emerald-300 shrink-0">
                            Tính nhanh: {branch.targetVar}
                          </span>
                        </div>

                        <div className="flex items-start gap-2.5 text-xs text-slate-300 bg-slate-950/70 border border-slate-800/90 rounded-lg px-3 py-2">
                          <ArrowDownRight className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                          <span>
                            <strong className="text-sky-300">Phép thế quy đổi:</strong> {branch.substitutionStep}
                          </span>
                        </div>

                        <div className="p-3.5 rounded-lg bg-sky-950/35 border border-sky-500/35 text-sky-100 overflow-x-auto">
                          <MathText latex={branch.derivedLatex} display />
                        </div>

                        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                          <strong className="text-amber-300">Dấu hiệu đề THPTQG:</strong> {branch.examSignal}
                        </p>

                        <div className="pt-2.5 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                          <span className="text-xs font-mono text-slate-400">
                            Đề cho: {branch.givenVars.join(', ')}
                          </span>
                          <div className="flex items-center gap-3">
                            {onAskAi && (
                              <button
                                type="button"
                                onClick={() =>
                                  onAskAi(
                                    `Hãy chứng minh chi tiết từng bước quy đổi từ công thức gốc (${activeHub.baseTitle}) sang công thức (${branch.targetTitle}) và cho 1 ví dụ số trắc nghiệm THPTQG.`
                                  )
                                }
                                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-sky-300 cursor-pointer"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                                Hỏi AI chứng minh
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => onOpenLesson(branch.linkedLessonId)}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-sky-400 hover:text-sky-300 cursor-pointer"
                            >
                              Mở mô phỏng
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </>
      )}

      {/* Mode 2: Flat Searchable List Across All 18 Lessons */}
      {viewMode === 'all-lessons' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {lessonItems.map(({ lesson, tr }) => (
            <article
              key={tr.id}
              className="bg-slate-900/85 border border-slate-800 rounded-xl p-5 flex flex-col justify-between gap-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2 text-xs text-slate-400">
                  <span>
                    Lớp {lesson.grade} · {lesson.title}
                  </span>
                  <span className="font-mono text-sky-300 font-semibold shrink-0">
                    Hỏi: {tr.targetVar}
                  </span>
                </div>

                <h2 className="text-base font-bold text-slate-100 leading-snug">{tr.title}</h2>

                <div className="p-3 rounded-lg bg-[#070b14] border border-slate-800 text-xs text-slate-100 overflow-x-auto">
                  <div className="text-slate-400 mb-1">Gốc:</div>
                  <MathText latex={tr.baseLatex} display />
                </div>

                <div className="p-3 rounded-lg bg-sky-950/40 border border-sky-500/40 text-xs text-sky-100 overflow-x-auto">
                  <div className="text-sky-300 font-medium mb-1">Quy đổi sang:</div>
                  <MathText latex={tr.derivedLatex} display />
                </div>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  <strong className="text-slate-100">Logic:</strong> {tr.bridgeLogic}
                </p>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  <strong className="text-amber-300">Dạng đề THPTQG:</strong> {tr.examPattern}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                <span className="text-xs text-slate-400 font-mono">
                  Đề cho: {tr.givenVars.join(', ')}
                </span>
                <button
                  type="button"
                  onClick={() => onOpenLesson(lesson.id)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-sky-400 hover:text-sky-300 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Mở mô phỏng bài này
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
