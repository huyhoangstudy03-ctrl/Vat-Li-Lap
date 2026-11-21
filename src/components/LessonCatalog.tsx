import { useMemo, useState } from 'react';
import { ArrowRight, Search } from 'lucide-react';
import { ALL_LESSONS } from '../physics/curriculum';
import { GradeLevel, LessonId, PhysicsLesson } from '../physics/types';
import { MathText } from './MathText';

interface LessonCatalogProps {
  activeLessonId: LessonId;
  onSelectLesson: (id: LessonId) => void;
}

const SHOWCASE_BANNERS = [
  {
    title: 'Cơ học & Động lực học Lớp 10',
    image: '/src/assets/images/physics_mechanics_lab_1795234369373.jpg',
    grade: 10 as GradeLevel,
  },
  {
    title: 'Dao động, Sóng & Quang học Lớp 11',
    image: '/src/assets/images/physics_waves_optics_1795234391432.jpg',
    grade: 11 as GradeLevel,
  },
  {
    title: 'Điện học, Từ trường & Mạch RLC 11–12',
    image: '/src/assets/images/physics_electromagnetism_1795234365421.jpg',
    grade: 12 as GradeLevel,
  },
  {
    title: 'Vật lí Nhiệt, Lượng tử & Hạt nhân Lớp 12',
    image: '/src/assets/images/physics_thermo_nuclear_1795234363794.jpg',
    grade: 12 as GradeLevel,
  },
];

export function LessonCatalog({ activeLessonId, onSelectLesson }: LessonCatalogProps) {
  const [gradeFilter, setGradeFilter] = useState<'all' | GradeLevel>('all');
  const [query, setQuery] = useState('');

  const filteredLessons = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ALL_LESSONS.filter((lesson) => {
      if (gradeFilter !== 'all' && lesson.grade !== gradeFilter) return false;
      if (!q) return true;
      return (
        lesson.title.toLowerCase().includes(q) ||
        lesson.chapter.toLowerCase().includes(q) ||
        lesson.shortDesc.toLowerCase().includes(q)
      );
    });
  }, [gradeFilter, query]);

  const handleOpenGrade = (g: GradeLevel) => {
    setGradeFilter(g);
    const el = document.getElementById('lesson-grid-section');
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Editorial Hero Header */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <div className="lg:col-span-7 flex flex-col justify-center space-y-5">
          <div className="text-xs font-medium text-sky-400">
            Chương trình GDPT 2018 · Lớp 10, 11, 12 · Luyện thi THPT Quốc gia
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold text-slate-50 tracking-tight leading-[1.14] [text-wrap:balance]">
            Mô phỏng chuẩn xác toàn bộ hiện tượng Vật lí phổ thông
          </h1>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
            18 chuyên đề lý thuyết trọng tâm Lớp 10, 11, 12 (đã lược bỏ bài thực hành đo đạc). Điều chỉnh trực tiếp mọi thông số ngay cạnh khung mô phỏng toàn màn hình, theo dõi bảng biến thiên Δ, sơ đồ quy đổi công thức thi THPTQG và hỏi đáp chuyên sâu với trợ lý AI.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => onSelectLesson(activeLessonId)}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-slate-950 bg-sky-400 hover:bg-sky-300 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Mở phòng mô phỏng ngay
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('lesson-grid-section');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-200 bg-slate-900 border border-slate-700 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Khám phá 18 bài học
            </button>
          </div>
        </div>

        {/* Visual Showcase Grid */}
        <div className="lg:col-span-5 grid grid-cols-2 gap-3">
          {SHOWCASE_BANNERS.map((banner) => (
            <button
              key={banner.title}
              type="button"
              onClick={() => handleOpenGrade(banner.grade)}
              className="group relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 text-left h-40 sm:h-44 cursor-pointer focus-visible:outline-2 focus-visible:outline-sky-400"
            >
              <img
                src={banner.image}
                alt={banner.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/35 to-transparent p-3.5 flex flex-col justify-end">
                <div className="text-xs font-bold text-slate-50 leading-snug">
                  {banner.title}
                </div>
                <div className="text-[11px] text-sky-300 mt-0.5">
                  Lọc theo Lớp {banner.grade}
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Key Metrics Strip */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 border-y border-slate-800/90 py-5">
        <div>
          <div className="text-2xl font-mono font-bold tabular-nums text-sky-300">18 bài</div>
          <div className="text-xs text-slate-400 mt-0.5">Lý thuyết chuẩn Lớp 10, 11, 12 (0 bài thực hành)</div>
        </div>
        <div>
          <div className="text-2xl font-mono font-bold tabular-nums text-emerald-300">60 fps</div>
          <div className="text-xs text-slate-400 mt-0.5">Mô phỏng trực quan phản hồi tức thì mọi thông số</div>
        </div>
        <div>
          <div className="text-2xl font-mono font-bold tabular-nums text-amber-300">38+ chuỗi</div>
          <div className="text-xs text-slate-400 mt-0.5">Quy đổi & liên kết công thức ôn thi THPTQG</div>
        </div>
        <div>
          <div className="text-2xl font-mono font-bold tabular-nums text-slate-100">Đa nguồn</div>
          <div className="text-xs text-slate-400 mt-0.5">Đối chiếu SGK GDPT 2018, Halliday & OpenStax</div>
        </div>
      </section>

      {/* Filter & Search Bar + Lesson Grid */}
      <section id="lesson-grid-section" className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div
            className="flex items-center gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800 w-fit"
            role="tablist"
            aria-label="Lọc theo khối lớp"
          >
            {(
              [
                { key: 'all', label: 'Tất cả (18)' },
                { key: 10, label: 'Lớp 10 (6)' },
                { key: 11, label: 'Lớp 11 (6)' },
                { key: 12, label: 'Lớp 12 (6)' },
              ] as const
            ).map((tab) => (
              <button
                key={String(tab.key)}
                type="button"
                role="tab"
                aria-selected={gradeFilter === tab.key}
                onClick={() => setGradeFilter(tab.key)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  gradeFilter === tab.key
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                    : 'text-slate-400 hover:text-slate-100 border border-transparent'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <label htmlFor="lesson-search-input" className="sr-only">
              Tìm kiếm bài học hoặc chuyên đề vật lí
            </label>
            <input
              id="lesson-search-input"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm bài học (vd: Con lắc, RLC, Khí lí tưởng)..."
              className="w-full pl-9 pr-3.5 py-2 text-sm bg-slate-900 border border-slate-700 text-slate-100 placeholder:text-slate-500 rounded-lg focus:outline-none focus:border-sky-500 transition-colors"
            />
          </div>
        </div>

        {filteredLessons.length === 0 ? (
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-10 text-center space-y-3">
            <p className="text-sm font-semibold text-slate-100">
              Không tìm thấy bài học phù hợp với từ khóa "{query}"
            </p>
            <p className="text-xs text-slate-400">
              Thử tìm theo tên hiện tượng như "Giao thoa", "Newton", "Phóng xạ", hoặc đặt lại bộ lọc.
            </p>
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setGradeFilter('all');
              }}
              className="px-4 py-2 text-xs font-semibold text-slate-950 bg-sky-400 hover:bg-sky-300 rounded-lg transition-colors cursor-pointer"
            >
              Đặt lại bộ lọc
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredLessons.map((lesson: PhysicsLesson) => {
              const isCurrent = lesson.id === activeLessonId;
              return (
                <article
                  key={lesson.id}
                  className={`bg-slate-900/85 border rounded-xl overflow-hidden flex flex-col justify-between transition-colors ${
                    isCurrent
                      ? 'border-sky-500/80 ring-1 ring-sky-500/25'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="relative h-28 bg-[#050914] overflow-hidden px-4 py-3 flex flex-col justify-between border-b border-slate-800">
                      <div
                        className="absolute inset-0 opacity-20 pointer-events-none"
                        style={{
                          backgroundImage:
                            'linear-gradient(to right, rgba(56,189,248,0.22) 1px, transparent 1px), linear-gradient(to bottom, rgba(56,189,248,0.22) 1px, transparent 1px)',
                          backgroundSize: '20px 20px',
                        }}
                      />
                      <div className="relative z-10 text-[11px] font-mono text-slate-400 flex items-center justify-between">
                        <span>Lớp {lesson.grade} · {lesson.lessonNumber}</span>
                        <span className="text-slate-300">{lesson.parameters.length} thông số</span>
                      </div>
                      <div className="relative z-10 text-sky-300 text-xs sm:text-sm overflow-x-auto py-1">
                        <MathText latex={lesson.formulas[0]?.latex ?? ''} />
                      </div>
                    </div>

                    <div className="p-4 space-y-2">
                      <div className="text-xs text-slate-400">{lesson.chapter}</div>
                      <h3 className="text-base font-bold text-slate-100 leading-snug">
                        {lesson.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed line-clamp-3">
                        {lesson.shortDesc}
                      </p>
                    </div>
                  </div>

                  <div className="px-4 py-3 border-t border-slate-800 flex items-center justify-between gap-2 bg-slate-950/50">
                    <span className="text-xs text-slate-400 truncate">
                      {lesson.formulas.length} công thức · {lesson.transformations.length} quy đổi
                    </span>
                    <button
                      type="button"
                      onClick={() => onSelectLesson(lesson.id)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-sky-400 hover:text-sky-300 whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Vào mô phỏng
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
