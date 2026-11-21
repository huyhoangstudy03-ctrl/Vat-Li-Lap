import { useState } from 'react';
import { ArrowRight, GitBranch, MessageSquare } from 'lucide-react';
import { PhysicsLesson } from '../physics/types';
import { MathText } from './MathText';

interface FormulaCorrelationPanelProps {
  lesson: PhysicsLesson;
  onAskAiAboutFormula: (prompt: string) => void;
}

export function FormulaCorrelationPanel({
  lesson,
  onAskAiAboutFormula,
}: FormulaCorrelationPanelProps) {
  const [selectedTransId, setSelectedTransId] = useState<string>(
    lesson.transformations[0]?.id ?? ''
  );

  const activeTransformation =
    lesson.transformations.find((t) => t.id === selectedTransId) ??
    lesson.transformations[0];

  return (
    <div className="space-y-8">
      {/* Section 1: Core Formulas & Variable Meanings */}
      <section aria-labelledby="core-formulas-heading">
        <div className="mb-4">
          <h3 id="core-formulas-heading" className="text-base font-bold text-slate-100">
            1. Hệ thống công thức cốt lõi & Ý nghĩa từng đại lượng
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Đầy đủ biểu thức toán học chuẩn SGK GDPT 2018 kèm đơn vị SI và bản chất vật lí từng đại lượng.
          </p>
        </div>

        <div className="space-y-5">
          {lesson.formulas.map((formula, idx) => (
            <div
              key={formula.id}
              className="bg-slate-900/85 border border-slate-800 rounded-xl overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/50">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h4 className="text-sm font-semibold text-slate-100">
                    {String(idx + 1).padStart(2, '0')}. {formula.title}
                  </h4>
                  {formula.condition && (
                    <span className="text-xs text-amber-300 font-medium">
                      Điều kiện: {formula.condition}
                    </span>
                  )}
                </div>
                <div className="mt-3 py-2.5 px-3.5 bg-[#070b14] border border-slate-800 rounded-lg text-sky-100 overflow-x-auto text-[13px] sm:text-base">
                  <MathText latex={formula.latex} display />
                </div>
              </div>

              {/* Mobile stacked symbol breakdown */}
              <div className="sm:hidden divide-y divide-slate-800/80 px-4 py-1">
                {formula.symbols.map((sym) => (
                  <div key={sym.symbol + sym.name} className="py-3 space-y-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <div className="flex items-baseline gap-2">
                        <span className="font-mono font-semibold text-sky-300 text-sm">
                          <MathText latex={sym.symbol} />
                        </span>
                        <span className="text-sm font-semibold text-slate-100">{sym.name}</span>
                      </div>
                      <span className="text-xs font-mono text-slate-400 shrink-0">{sym.unit}</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{sym.meaning}</p>
                  </div>
                ))}
              </div>

              {/* Desktop structured symbol table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/60">
                      <th className="py-2.5 px-5 font-medium w-28">Ký hiệu</th>
                      <th className="py-2.5 px-3 font-medium w-48">Tên đại lượng</th>
                      <th className="py-2.5 px-3 font-medium w-32">Đơn vị</th>
                      <th className="py-2.5 px-5 font-medium">Ý nghĩa vật lí & Lưu ý thi THPTQG</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70">
                    {formula.symbols.map((sym) => (
                      <tr key={sym.symbol + sym.name}>
                        <td className="py-2.5 px-5 font-mono font-semibold text-sky-300">
                          <MathText latex={sym.symbol} />
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-100">{sym.name}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-400">{sym.unit}</td>
                        <td className="py-2.5 px-5 text-slate-300 leading-relaxed">{sym.meaning}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section 2: Formula Transformation & Exam Correlation Map */}
      <section aria-labelledby="formula-bridge-heading">
        <div className="mb-4">
          <h3 id="formula-bridge-heading" className="text-base font-bold text-slate-100">
            2. Sơ đồ quy đổi & Liên kết công thức tương quan (Ôn thi THPTQG)
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Chọn tình huống đề bài bên dưới để xem chuỗi suy luận quy đổi từ công thức gốc sang công thức hệ quả.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Selector list */}
          <div className="lg:col-span-5 space-y-2.5" role="tablist" aria-label="Các phép quy đổi công thức">
            {lesson.transformations.map((tr, i) => {
              const isSelected = activeTransformation?.id === tr.id;
              return (
                <button
                  key={tr.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setSelectedTransId(tr.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-sky-500/12 border-sky-500/70 text-slate-100'
                      : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="text-xs text-slate-400 font-medium mb-1">
                    Chuỗi quy đổi {i + 1} · Đề hỏi:{' '}
                    <span className="font-mono text-sky-300">{tr.targetVar}</span>
                  </div>
                  <div className="text-sm font-semibold text-slate-100 leading-snug">
                    {tr.title}
                  </div>
                  <div className="text-xs text-slate-400 mt-1.5">
                    Dữ kiện đề cho:{' '}
                    <span className="font-mono text-slate-200">{tr.givenVars.join(', ')}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Detailed Derivation Bridge */}
          {activeTransformation && (
            <div className="lg:col-span-7 bg-slate-900/85 border border-slate-800 rounded-xl p-5 flex flex-col justify-between gap-5">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-sky-300">
                  <GitBranch className="w-4 h-4" aria-hidden="true" />
                  <span>Cầu nối suy luận đại số & vật lí</span>
                </div>

                <h4 className="text-base font-bold text-slate-100">
                  {activeTransformation.title}
                </h4>

                {/* Base -> Derived Visual Chain */}
                <div className="grid grid-cols-1 gap-3">
                  <div className="p-3.5 rounded-lg bg-[#070b14] border border-slate-800">
                    <div className="text-xs font-medium text-slate-400 mb-1.5">
                      Công thức gốc (Xuất phát điểm)
                    </div>
                    <div className="overflow-x-auto text-slate-100 text-[13px] sm:text-base">
                      <MathText latex={activeTransformation.baseLatex} display />
                    </div>
                  </div>

                  <div className="flex items-center justify-center text-sky-400/70">
                    <ArrowRight className="w-4 h-4 rotate-90" aria-hidden="true" />
                  </div>

                  <div className="p-3.5 rounded-lg bg-sky-950/40 border border-sky-500/40">
                    <div className="text-xs font-medium text-sky-300 mb-1.5">
                      Công thức quy đổi / Tương quan giải nhanh
                    </div>
                    <div className="overflow-x-auto text-sky-100 text-[13px] sm:text-base">
                      <MathText latex={activeTransformation.derivedLatex} display />
                    </div>
                  </div>
                </div>

                {/* Logic Explanation */}
                <div className="space-y-3 pt-1 text-sm text-slate-300 leading-relaxed">
                  <div>
                    <span className="font-semibold text-slate-100">Logic biến đổi: </span>
                    {activeTransformation.bridgeLogic}
                  </div>
                  <div className="pt-2.5 border-t border-slate-800">
                    <span className="font-semibold text-amber-300">Nhận diện trong đề thi THPTQG: </span>
                    {activeTransformation.examPattern}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end">
                <button
                  type="button"
                  onClick={() =>
                    onAskAiAboutFormula(
                      `Hãy chứng minh chi tiết từng bước phép quy đổi "${activeTransformation.title}" trong bài "${lesson.title}" và cho một ví dụ tính số ngay với thông số hiện tại của tôi.`
                    )
                  }
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-950 bg-sky-400 hover:bg-sky-300 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Hỏi AI giải thích chi tiết bằng số liệu hiện tại
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
