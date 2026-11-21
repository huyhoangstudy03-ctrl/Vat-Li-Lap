import { BookOpen } from 'lucide-react';
import { GLOBAL_REFERENCES } from '../physics/curriculum';
import { PhysicsLesson } from '../physics/types';

interface ReferencesPanelProps {
  lesson?: PhysicsLesson;
}

export function ReferencesPanel({ lesson }: ReferencesPanelProps) {
  return (
    <div className="space-y-8">
      {lesson && (
        <section>
          <div className="mb-4">
            <h3 className="text-base font-bold text-slate-100">
              Nguồn tài liệu đối chiếu cho bài: {lesson.title}
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Mọi hằng số, quy ước dấu và phương trình trong mô phỏng được đối chiếu trực tiếp từ sách giáo khoa chuẩn và giáo trình đại học uy tín.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lesson.references.map((ref) => (
              <article
                key={ref.title + ref.section}
                className="bg-slate-900/85 border border-slate-800 rounded-xl p-5 flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="text-xs text-sky-300 font-medium mb-1">
                    {ref.reliability} · {ref.publisher}
                  </div>
                  <h4 className="text-sm font-bold text-slate-100 leading-snug">
                    {ref.title}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">Tác giả: {ref.authors}</p>
                </div>
                <div className="pt-3 border-t border-slate-800 text-xs sm:text-sm text-slate-300 flex items-start gap-2">
                  <BookOpen className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{ref.section}</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-6">
        <div>
          <h3 className="text-base font-bold text-slate-100">
            Hệ thống nguồn học thuật & Tài liệu chuẩn ôn thi THPTQG
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Danh mục sách giáo khoa GDPT 2018 và giáo trình kiểm chuẩn quốc tế dùng để đối chiếu chéo toàn bộ 18 mô phỏng.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {GLOBAL_REFERENCES.map((group) => (
            <div
              key={group.category}
              className="bg-slate-900/85 border border-slate-800 rounded-xl p-5 space-y-4"
            >
              <h4 className="text-sm font-bold text-slate-100 pb-2.5 border-b border-slate-800">
                {group.category}
              </h4>
              <div className="space-y-4">
                {group.items.map((item) => (
                  <div key={item.title} className="space-y-1">
                    <div className="text-sm font-semibold text-sky-200">{item.title}</div>
                    <div className="text-xs text-slate-400">
                      {item.authors} · {item.publisher}
                    </div>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      {item.note}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
