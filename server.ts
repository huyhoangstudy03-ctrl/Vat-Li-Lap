import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const MODEL_NAME = 'gemini-4-hydrogen';

interface ChatHistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface SimulationContextPayload {
  lessonTitle?: string;
  grade?: number;
  chapter?: string;
  parameters?: Array<{ label: string; symbol: string; value: number; unit: string }>;
  metrics?: Array<{ label: string; symbol: string; value: number; unit: string }>;
  formulas?: Array<{ title: string; latex: string }>;
}

type SpeedMode = 'fast' | 'deep';

let cachedClient: GoogleGenAI | null = null;
let cachedApiKey: string | undefined;

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error('MISSING_API_KEY');
  }
  if (!cachedClient || cachedApiKey !== apiKey) {
    cachedClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
    cachedApiKey = apiKey;
  }
  return cachedClient;
}

function resolveThinkingLevel(mode?: SpeedMode): ThinkingLevel {
  return mode === 'deep' ? ThinkingLevel.MEDIUM : ThinkingLevel.LOW;
}

function buildSystemInstruction(context?: SimulationContextPayload, mode: SpeedMode = 'fast'): string {
  const lengthRule =
    mode === 'deep'
      ? 'Trình bày chi tiết các bước biến đổi đại số, so sánh mô hình lí tưởng với thực tế và liên hệ dạng đề THPTQG (khoảng 250-400 từ).'
      : 'Trả lời trực diện, súc tích, đúng trọng tâm ngay từ câu đầu tiên (khoảng 100-200 từ), tránh mở bài dài dòng.';

  const basePrompt = [
    'Bạn là cố vấn kỹ thuật Vật lí phổ thông (Lớp 10, 11, 12 — GDPT 2018 & ôn thi THPTQG) của nền tảng Vật Lí Lab.',
    '- Giải thích chính xác bản chất vật lí, phương trình mô phỏng và quy đổi công thức sang các dạng đề thi.',
    '- Dùng ngay thông số hiện tại của bài mô phỏng để minh họa bằng số cụ thể khi phù hợp.',
    '- Dùng tiếng Việt chuẩn, đặt công thức LaTeX trong $...$ hoặc $$...$$.',
    `- ${lengthRule}`,
  ].join('\n');

  if (!context?.lessonTitle) {
    return basePrompt;
  }

  const paramSummary = (context.parameters ?? [])
    .map((p) => `${p.symbol}=${p.value}${p.unit}`)
    .join(', ');
  const metricSummary = (context.metrics ?? [])
    .map((m) => `${m.symbol}=${m.value}${m.unit}`)
    .join(', ');
  const formulaSummary = (context.formulas ?? [])
    .map((f) => f.latex)
    .join(' ; ');

  return `${basePrompt}

[NGỮ CẢNH HIỆN TẠI]
Bài: ${context.lessonTitle} (Lớp ${context.grade ?? ''} — ${context.chapter ?? ''})
Thông số: ${paramSummary || 'N/A'}
Đo được: ${metricSummary || 'N/A'}
Công thức: ${formulaSummary || 'N/A'}`;
}

function mapApiError(err: unknown): { status: number; error: string } {
  const message = err instanceof Error ? err.message : String(err);
  if (message === 'MISSING_API_KEY') {
    return {
      status: 503,
      error:
        'Chưa cấu hình GEMINI_API_KEY trên máy chủ. Vui lòng kiểm tra mục Settings > Secrets để kích hoạt trợ lý AI.',
    };
  }
  if (message.includes('API_KEY_INVALID') || message.includes('403') || message.includes('PERMISSION_DENIED')) {
    return {
      status: 403,
      error: 'Khóa API Gemini không hợp lệ hoặc thiếu quyền truy cập. Vui lòng kiểm tra lại trong Settings > Secrets.',
    };
  }
  if (message.includes('RESOURCE_EXHAUSTED') || message.includes('429')) {
    return {
      status: 429,
      error: 'Hệ thống đang chạm giới hạn lưu lượng API. Vui lòng thử lại sau giây lát.',
    };
  }
  return {
    status: 500,
    error: 'Không thể kết nối tới máy chủ phân tích AI lúc này. Vui lòng thử lại.',
  };
}

function validateChatPayload(body: unknown): {
  messages?: ChatHistoryMessage[];
  context?: SimulationContextPayload;
  mode: SpeedMode;
  validationError?: string;
} {
  const { messages, context, mode } = (body ?? {}) as {
    messages?: ChatHistoryMessage[];
    context?: SimulationContextPayload;
    mode?: SpeedMode;
  };
  if (!Array.isArray(messages) || messages.length === 0) {
    return { mode: 'fast', validationError: 'Nội dung câu hỏi không hợp lệ. Vui lòng nhập câu hỏi của bạn.' };
  }
  const lastUserMessage = messages[messages.length - 1];
  if (!lastUserMessage?.content?.trim()) {
    return { mode: 'fast', validationError: 'Vui lòng nhập câu hỏi trước khi gửi.' };
  }
  return {
    messages,
    context,
    mode: mode === 'deep' ? 'deep' : 'fast',
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // High-speed SSE streaming endpoint (primary endpoint used by AiTutorDrawer)
  app.post('/api/chat/stream', async (req, res) => {
    const { messages, context, mode, validationError } = validateChatPayload(req.body);
    if (validationError || !messages) {
      return res.status(400).json({ error: validationError });
    }

    let ai: GoogleGenAI;
    try {
      ai = getGeminiClient();
    } catch (err) {
      const mapped = mapApiError(err);
      return res.status(mapped.status).json({ error: mapped.error });
    }

    const contents = messages.slice(-6).map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    let clientClosed = false;
    req.on('close', () => {
      clientClosed = true;
    });

    try {
      const stream = await ai.models.generateContentStream({
        model: MODEL_NAME,
        contents,
        config: {
          systemInstruction: buildSystemInstruction(context, mode),
          thinkingConfig: {
            thinkingLevel: resolveThinkingLevel(mode),
          },
        },
      });

      for await (const chunk of stream) {
        if (clientClosed) break;
        const text = chunk.text;
        if (text) {
          res.write(`data: ${JSON.stringify({ chunk: text })}\n\n`);
        }
      }

      if (!clientClosed) {
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();
      }
    } catch (err: unknown) {
      console.error('[/api/chat/stream] Gemini API error:', err instanceof Error ? err.message : String(err));
      if (!clientClosed) {
        const mapped = mapApiError(err);
        res.write(`data: ${JSON.stringify({ error: mapped.error })}\n\n`);
        res.end();
      }
    }
  });

  // Standard JSON endpoint (optimized with ThinkingLevel.LOW)
  app.post('/api/chat', async (req, res) => {
    const { messages, context, mode, validationError } = validateChatPayload(req.body);
    if (validationError || !messages) {
      return res.status(400).json({ error: validationError });
    }

    let ai: GoogleGenAI;
    try {
      ai = getGeminiClient();
    } catch (err) {
      const mapped = mapApiError(err);
      return res.status(mapped.status).json({ error: mapped.error });
    }

    const contents = messages.slice(-6).map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    try {
      let replyText = '';
      let lastError: unknown = null;

      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents,
            config: {
              systemInstruction: buildSystemInstruction(context, mode),
              thinkingConfig: {
                thinkingLevel: resolveThinkingLevel(mode),
              },
            },
          });
          replyText = response.text?.trim() ?? '';
          break;
        } catch (err) {
          lastError = err;
          if (attempt === 0) {
            await new Promise((resolve) => setTimeout(resolve, 400));
          }
        }
      }

      if (!replyText && lastError) {
        throw lastError;
      }

      return res.json({
        reply: replyText || 'Xin lỗi, hệ thống chưa nhận được nội dung phản hồi. Vui lòng thử lại.',
      });
    } catch (err: unknown) {
      console.error('[/api/chat] Gemini API error:', err instanceof Error ? err.message : String(err));
      const mapped = mapApiError(err);
      return res.status(mapped.status).json({ error: mapped.error });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Vat Li Lab server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
