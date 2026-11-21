import { useEffect, useRef, useState } from 'react';
import { Gauge, Pause, Play, RotateCcw } from 'lucide-react';
import { ParamMap, PhysicsLesson } from '../physics/types';
import { renderPhysicsScene } from '../physics/canvasRenderer';

interface SimulationCanvasProps {
  lesson: PhysicsLesson;
  params: ParamMap;
}

export function SimulationCanvas({ lesson, params }: SimulationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const paramsRef = useRef<ParamMap>(params);
  const lessonIdRef = useRef(lesson.id);
  const isPlayingRef = useRef(true);
  const speedRef = useRef(1);
  const simTimeRef = useRef(0);

  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState<number>(1);
  const [showPhoto, setShowPhoto] = useState(false);

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  useEffect(() => {
    lessonIdRef.current = lesson.id;
    simTimeRef.current = 0;
  }, [lesson.id]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    let lastTs = performance.now();

    const drawFrame = (now: number) => {
      const dt = Math.min(0.05, (now - lastTs) / 1000);
      lastTs = now;
      if (isPlayingRef.current) {
        simTimeRef.current += dt * speedRef.current;
      }

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        const targetW = Math.max(320, Math.round(rect.width * dpr));
        const targetH = Math.max(240, Math.round(rect.height * dpr));

        if (canvas.width !== targetW || canvas.height !== targetH) {
          canvas.width = targetW;
          canvas.height = targetH;
        }

        ctx.save();
        ctx.scale(dpr, dpr);
        renderPhysicsScene(
          ctx,
          rect.width,
          rect.height,
          lessonIdRef.current,
          paramsRef.current,
          simTimeRef.current
        );
        ctx.restore();
      }

      rafId = requestAnimationFrame(drawFrame);
    };

    rafId = requestAnimationFrame(drawFrame);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const handleResetTime = () => {
    simTimeRef.current = 0;
  };

  return (
    <div className="h-full flex flex-col bg-[#0b1120] border border-slate-800 rounded-xl overflow-hidden">
      {/* Compact Stage Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 px-4 py-2.5 border-b border-slate-800 bg-slate-900/90 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <h2 className="text-sm font-semibold text-slate-100 truncate">
            Khung mô phỏng trực quan
          </h2>
          <span className="text-xs text-slate-400 hidden sm:inline whitespace-nowrap">
            · {isPlaying ? 'Đang chạy' : 'Tạm dừng'}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => setIsPlaying((p) => !p)}
            aria-label={isPlaying ? 'Tạm dừng mô phỏng' : 'Chạy mô phỏng'}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-sky-500 text-slate-950 hover:bg-sky-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isPlaying ? 'Tạm dừng' : 'Tiếp tục'}
          </button>

          <button
            type="button"
            onClick={handleResetTime}
            aria-label="Chạy lại từ đầu"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Lại t=0
          </button>

          <div
            className="flex items-center gap-0.5 bg-slate-950/80 p-0.5 rounded-lg border border-slate-800"
            role="group"
            aria-label="Tốc độ mô phỏng"
          >
            <Gauge className="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-1" aria-hidden="true" />
            {[0.5, 1, 2].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSpeed(s)}
                className={`px-2 py-1 text-xs font-mono font-medium rounded-md transition-colors cursor-pointer ${
                  speed === s
                    ? 'bg-slate-800 text-sky-300'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {s}×
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setShowPhoto((v) => !v)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              showPhoto
                ? 'border-sky-500/70 bg-sky-500/15 text-sky-300'
                : 'border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-700'
            }`}
          >
            {showPhoto ? 'Về mô phỏng động' : 'Ảnh thí nghiệm thực'}
          </button>
        </div>
      </div>

      {/* Full-Bleed Dominant Simulation Viewport */}
      <div className="relative flex-1 min-h-[380px] sm:min-h-[460px] lg:min-h-0 bg-[#0b1120]">
        <canvas
          ref={canvasRef}
          data-testid="physics-canvas"
          data-sim-lesson={lesson.id}
          data-sim-state={isPlaying ? 'playing' : 'paused'}
          className={`w-full h-full block cursor-crosshair ${showPhoto ? 'hidden' : 'block'}`}
        />

        {showPhoto && (
          <div className="relative w-full h-full bg-slate-950">
            <img
              src={lesson.bannerImage}
              alt={lesson.bannerAlt}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/95 via-slate-950/60 to-transparent px-5 py-4">
              <p className="text-xs font-medium text-slate-200">
                Thiết bị phòng thí nghiệm thực tế đối chiếu — {lesson.bannerAlt}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Concise Physical Principle Footer Strip */}
      <div className="px-4 py-2.5 bg-slate-900/90 border-t border-slate-800 text-xs text-slate-300 leading-relaxed shrink-0">
        <span className="font-semibold text-sky-300">Cơ chế hiện tượng: </span>
        {lesson.phenomenonSummary}
      </div>
    </div>
  );
}
