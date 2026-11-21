import { FormEvent, useEffect, useRef, useState } from 'react';
import { AlertCircle, Loader2, Send, Square, Trash2, X, Zap } from 'lucide-react';
import { CalculatedMetric, ParamMap, PhysicsLesson } from '../physics/types';
import { MathText } from './MathText';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  elapsedMs?: number;
}

type SpeedMode = 'fast' | 'deep';

interface AiTutorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  lesson: PhysicsLesson;
  params: ParamMap;
  metrics: CalculatedMetric[];
  queuedPrompt?: string | null;
  onConsumeQueuedPrompt?: () => void;
}

function FormattedAiText({ text }: { text: string }) {
  const paragraphs = text.split(/\n{2,}/);

  const renderInline = (line: string, keyPrefix: string) => {
    const tokens = line.split(/(\$\$[^$]+\$\$|\$[^$\n]+\$|\*\*[^*]+\*\*)/g);
    return tokens.map((tok, i) => {
      if (tok.startsWith('$$') && tok.endsWith('$$') && tok.length > 4) {
        return (
          <span key={`${keyPrefix}-${i}`} className="block my-2 overflow-x-auto text-sky-100">
            <MathText latex={tok.slice(2, -2).trim()} display />
          </span>
        );
      }
      if (tok.startsWith('$') && tok.endsWith('$') && tok.length > 2) {
        return (
          <MathText
            key={`${keyPrefix}-${i}`}
            latex={tok.slice(1, -1).trim()}
            className="text-sky-200"
          />
        );
      }
      if (tok.startsWith('**') && tok.endsWith('**') && tok.length > 4) {
        return (
          <strong key={`${keyPrefix}-${i}`} className="font-semibold text-slate-100">
            {tok.slice(2, -2)}
          </strong>
        );
      }
      return <span key={`${keyPrefix}-${i}`}>{tok}</span>;
    });
  };

  return (
    <div className="space-y-2.5 text-sm leading-relaxed text-slate-200">
      {paragraphs.map((para, pIdx) => (
        <p key={pIdx} className="whitespace-pre-line">
          {renderInline(para, `p${pIdx}`)}
        </p>
      ))}
    </div>
  );
}

export function AiTutorDrawer({
  isOpen,
  onClose,
  lesson,
  params,
  metrics,
  queuedPrompt,
  onConsumeQueuedPrompt,
}: AiTutorDrawerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [speedMode, setSpeedMode] = useState<SpeedMode>('fast');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const stopGeneration = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsLoading(false);
    setIsStreaming(false);
  };

  const sendMessage = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || isLoading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: trimmed,
    };

    const assistantId = `a-${Date.now() + 1}`;
    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setInput('');
    setErrorMsg(null);
    setIsLoading(true);
    setIsStreaming(false);

    const controller = new AbortController();
    abortRef.current = controller;
    const startedAt = performance.now();

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          mode: speedMode,
          messages: nextHistory.map((m) => ({ role: m.role, content: m.content })),
          context: {
            lessonTitle: lesson.title,
            grade: lesson.grade,
            chapter: lesson.chapter,
            parameters: lesson.parameters.map((p) => ({
              label: p.label,
              symbol: p.symbol,
              value: params[p.key] ?? p.defaultValue,
              unit: p.unit,
            })),
            metrics: metrics.map((m) => ({
              label: m.label,
              symbol: m.symbol,
              value: Number(m.value.toFixed(m.precision ?? 2)),
              unit: m.unit,
            })),
            formulas: lesson.formulas.map((f) => ({
              title: f.title,
              latex: f.latex,
            })),
          },
        }),
      });

      const contentType = response.headers.get('content-type') ?? '';
      if (!response.ok || !contentType.includes('text/event-stream')) {
        const errData = (await response.json().catch(() => ({}))) as { error?: string };
        setErrorMsg(errData.error || 'Đã xảy ra lỗi khi kết nối trợ lý AI.');
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        setErrorMsg('Trình duyệt không hỗ trợ đọc luồng phản hồi trực tiếp.');
        return;
      }

      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let accumulated = '';
      let createdBubble = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() ?? '';

        for (const rawEvent of events) {
          const line = rawEvent.trim();
          if (!line.startsWith('data:')) continue;
          const jsonStr = line.slice(5).trim();
          if (!jsonStr) continue;

          try {
            const payload = JSON.parse(jsonStr) as {
              chunk?: string;
              done?: boolean;
              error?: string;
            };

            if (payload.error) {
              setErrorMsg(payload.error);
              break;
            }

            if (payload.chunk) {
              accumulated += payload.chunk;
              setIsStreaming(true);
              if (!createdBubble) {
                createdBubble = true;
                setMessages((prev) => [
                  ...prev,
                  { id: assistantId, role: 'assistant', content: accumulated },
                ]);
              } else {
                setMessages((prev) =>
                  prev.map((m) => (m.id === assistantId ? { ...m, content: accumulated } : m))
                );
              }
            }

            if (payload.done && createdBubble) {
              const elapsedMs = Math.round(performance.now() - startedAt);
              setMessages((prev) =>
                prev.map((m) => (m.id === assistantId ? { ...m, elapsedMs } : m))
              );
            }
          } catch {
            // Ignore malformed partial SSE frame
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return;
      }
      setErrorMsg('Không thể gửi yêu cầu tới máy chủ. Vui lòng kiểm tra kết nối và thử lại.');
    } finally {
      abortRef.current = null;
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  useEffect(() => {
    if (isOpen && queuedPrompt) {
      sendMessage(queuedPrompt);
      onConsumeQueuedPrompt?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, queuedPrompt]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, errorMsg]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label="Hỏi đáp kỹ thuật Vật lí với AI"
    >
      <div className="flex-1" onClick={onClose} aria-hidden="true" />
      <aside className="w-full max-w-lg bg-[#0b1120] h-full border-l border-slate-800 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-slate-800 bg-slate-900/90">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-slate-100 truncate">
              Trợ lý kỹ thuật Vật lí AI
            </h2>
            <p className="text-xs text-slate-400 truncate mt-0.5">
              Truyền trực tiếp (Streaming) · Lớp {lesson.grade} · {lesson.title}
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {messages.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  stopGeneration();
                  setMessages([]);
                  setErrorMsg(null);
                }}
                aria-label="Xóa lịch sử trò chuyện"
                className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng khung chat AI"
              className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Speed mode switcher + live parameter sync */}
        <div className="px-5 py-2.5 bg-slate-950/80 border-b border-slate-800 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Chế độ xử lí:
            </span>
            <div className="flex items-center gap-1 p-0.5 bg-slate-900 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => setSpeedMode('fast')}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors cursor-pointer ${
                  speedMode === 'fast'
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                    : 'text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                Trả lời nhanh
              </button>
              <button
                type="button"
                onClick={() => setSpeedMode('deep')}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors cursor-pointer ${
                  speedMode === 'deep'
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                    : 'text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                Phân tích sâu
              </button>
            </div>
          </div>
          <div className="text-[11px] text-sky-300 font-mono tabular-nums overflow-x-auto whitespace-nowrap">
            Thông số gửi kèm:{' '}
            {lesson.parameters
              .map((p) => `${p.symbol}=${params[p.key] ?? p.defaultValue}${p.unit}`)
              .join(' · ')}
          </div>
        </div>

        {/* Messages body */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
          {messages.length === 0 && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-300 leading-relaxed">
                Xin chào! Tôi đã đồng bộ toàn bộ thông số hiện tại của bài{' '}
                <strong className="text-slate-100">{lesson.title}</strong> và tối ưu phản hồi tức thì theo luồng (streaming). Hãy chọn câu hỏi gợi ý hoặc nhập thắc mắc của bạn.
              </div>

              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-400">
                  Câu hỏi chuyên sâu gợi ý cho bài này
                </div>
                {lesson.suggestedQuestions.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => sendMessage(q)}
                    className="w-full text-left px-3.5 py-2.5 text-xs sm:text-sm text-slate-200 bg-slate-900/70 border border-slate-800 rounded-lg hover:border-sky-500/60 hover:bg-slate-800/80 transition-colors cursor-pointer"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[88%] rounded-xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-sky-500 text-slate-950 font-medium text-sm leading-relaxed'
                    : 'bg-slate-900 border border-slate-800 text-slate-200'
                }`}
              >
                {msg.role === 'user' ? (
                  <p className="whitespace-pre-line">{msg.content}</p>
                ) : (
                  <>
                    <FormattedAiText text={msg.content} />
                    {msg.elapsedMs !== undefined && (
                      <div className="mt-2 pt-1.5 border-t border-slate-800/80 text-[10px] font-mono text-slate-500 text-right">
                        Hoàn tất trong {(msg.elapsedMs / 1000).toFixed(1)}s
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}

          {isLoading && !isStreaming && (
            <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
              <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
              <span>Đang khởi tạo câu trả lời nhanh...</span>
            </div>
          )}

          {errorMsg && (
            <div
              role="alert"
              className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-xs sm:text-sm text-rose-200"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="p-4 border-t border-slate-800 bg-slate-900/90">
          <label htmlFor="ai-chat-input" className="sr-only">
            Nhập câu hỏi vật lí kỹ thuật
          </label>
          <div className="flex items-center gap-2">
            <input
              id="ai-chat-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Hỏi về quy đổi công thức, đổi đơn vị, bản chất..."
              disabled={isLoading}
              className="flex-1 px-3.5 py-2.5 text-sm bg-slate-950 border border-slate-700 text-slate-100 placeholder:text-slate-500 rounded-lg focus:outline-none focus:border-sky-500 transition-colors"
            />
            {isLoading ? (
              <button
                type="button"
                onClick={stopGeneration}
                aria-label="Dừng trả lời"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-slate-100 bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                Dừng
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                aria-label="Gửi câu hỏi"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-slate-950 bg-sky-400 hover:bg-sky-300 disabled:opacity-40 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                Gửi
              </button>
            )}
          </div>
        </form>
      </aside>
    </div>
  );
}
