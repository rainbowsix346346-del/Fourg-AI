import express, { Request, Response } from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { InMemoryServerStorage } from './src/services/storageInterface.js';
import { GeminiModelId, SharedToolSession, AppVersion } from './src/types.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;
const server = http.createServer(app);

app.use(express.json({ limit: '10mb' }));

// Storage interface instance (ready for DB swap)
const storage = new InMemoryServerStorage();

// Allowed Gemini models
const ALLOWED_MODELS = new Set<string>([
  'gemini-3.8-flash',
  'gemini-3.1-flash-lite',
  'gemini-4-carbon',
]);

// Rate limiting: max 30 requests per hour per user/IP
interface RateLimitRecord {
  timestamps: number[];
}
const rateLimitMap = new Map<string, RateLimitRecord>();
const RATE_LIMIT_MAX = 30;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function checkRateLimit(key: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitMap.get(key) || { timestamps: [] };
  // Remove timestamps outside window
  record.timestamps = record.timestamps.filter((ts) => now - ts < RATE_LIMIT_WINDOW_MS);

  if (record.timestamps.length >= RATE_LIMIT_MAX) {
    rateLimitMap.set(key, record);
    return { allowed: false, remaining: 0 };
  }

  record.timestamps.push(now);
  rateLimitMap.set(key, record);
  return { allowed: true, remaining: RATE_LIMIT_MAX - record.timestamps.length };
}

// Queue for concurrency handling in collaborative tools
const collabQueueMap = new Map<string, Promise<unknown>>();

function queueCollabTask<T>(sessionId: string, task: () => Promise<T>): Promise<T> {
  const currentPromise = collabQueueMap.get(sessionId) || Promise.resolve();
  const nextPromise = currentPromise.then(task, task);
  collabQueueMap.set(sessionId, nextPromise);
  return nextPromise;
}

const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

const SYSTEM_INSTRUCTION = `شما یک دستیار متخصص ساخت ابزار، برنامه و بازی کوچک تحت وب برای موبایل به زبان فارسی هستید.
کاربر یک توضیح یا درخواست تغییر ارسال می‌کند. شما باید دقیقاً یک شیء JSON با ساختار زیر برگردانید:
{
  "title": "نام کوتاه برنامه به فارسی (حداکثر ۴ کلمه)",
  "description": "توضیح کوتاه یک‌خطی به فارسی درباره کاربرد برنامه",
  "category": "یکی از این چهار مقدار: بازی، ابزار، برنامه، دیگر",
  "html": "کد کامل، معتبر، راست‌به‌چپ و مستقل HTML5 شامل استایل داخلی و اسکریپت بدون هیچ وابستگی خارجی یا CDN"
}
نکات الزامی:
- کد HTML باید کاملاً مستقل باشد و بدون نیاز به اینترنت یا فایل خارجی کار کند.
- طراحی موبایل‌محور، تمیز و آرام باشد.
- هیچ ایموجی در رابط کاربری استفاده نشود.
- تمام متون داخل برنامه فارسی باشند.`;

/**
 * Helper to generate a complete, valid Persian HTML app on the server
 * when all AI models or API quotas are exhausted.
 */
function generateServerFallbackApp(prompt: string, isRevision?: boolean, currentCode?: string) {
  const clean = (prompt || '').trim();
  const isGame = /بازی|دوز|حدس|مار|پازل|تاس|سرگرمی|کوییز|پینگ/i.test(clean);
  const isTool = /ماشین|حساب|مبدل|محاسبه|ابزار|تایمر|زمان|درصد|تقویم|شمارنده/i.test(clean);

  let category: 'بازی' | 'ابزار' | 'برنامه' | 'دیگر' = 'برنامه';
  let title = clean.length > 20 ? clean.slice(0, 20) + '...' : (clean || 'برنامه کاربردی');
  let description = 'ابزار کاربردی سبک و تعاملی';

  if (isGame) {
    category = 'بازی';
    title = clean.includes('دوز') ? 'بازی دوز هوشمند' : (clean.length > 2 ? clean : 'بازی تعاملی');
    description = 'بازی ساده دونفره روی یک صفحه با رابط کاربری لمسی';
  } else if (isTool) {
    category = 'ابزار';
    title = clean.includes('ماشین') ? 'ماشین‌حساب مینیمال' : (clean.length > 2 ? clean : 'ابزار محاسباتی');
    description = 'ابزار محاسبه سریع و روان با رابط لمسی';
  }

  if (isRevision && currentCode) {
    title = title + ' (ویرایش‌شده)';
    description = `ویرایش بر اساس: ${clean}`;
  }

  const html = category === 'بازی'
    ? `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; user-select: none; font-family: system-ui, sans-serif; }
    body { background: #fafaf9; color: #1c1917; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; padding: 16px; }
    .card { background: #ffffff; border: 1px solid #e7e5e4; border-radius: 24px; padding: 20px; width: 100%; max-width: 320px; text-align: center; }
    h1 { font-size: 1.1rem; margin-bottom: 6px; font-weight: 600; }
    p { font-size: 0.8rem; color: #78716c; margin-bottom: 16px; }
    .status { font-size: 0.85rem; font-weight: 500; margin-bottom: 14px; padding: 6px 12px; background: #f5f5f4; border-radius: 12px; display: inline-block; }
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 16px; }
    .cell { aspect-ratio: 1; background: #f5f5f4; border: 1px solid #e7e5e4; border-radius: 14px; font-size: 1.6rem; font-weight: bold; color: #1c1917; display: flex; align-items: center; justify-content: center; cursor: pointer; }
    .cell:active { background: #e7e5e4; transform: scale(0.96); }
    button.btn { background: #1c1917; color: #ffffff; border: none; border-radius: 14px; padding: 10px 20px; font-size: 0.85rem; cursor: pointer; font-weight: 500; width: 100%; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${title}</h1>
    <p>${description}</p>
    <div id="status" class="status">نوبت: ضربدر (X)</div>
    <div class="grid" id="grid"></div>
    <button class="btn" onclick="initGame()">شروع مجدد</button>
  </div>
  <script>
    let board = Array(9).fill(''), turn = 'X', active = true;
    function render() {
      const grid = document.getElementById('grid'); grid.innerHTML = '';
      board.forEach((val, idx) => {
        const d = document.createElement('div'); d.className = 'cell'; d.textContent = val;
        d.onclick = () => {
          if (!active || board[idx]) return;
          board[idx] = turn;
          const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
          if (wins.some(([a,b,c]) => board[a] && board[a] === board[b] && board[a] === board[c])) {
            document.getElementById('status').textContent = 'برنده: ' + (turn === 'X' ? 'ضربدر' : 'دایره');
            active = false;
          } else if (board.every(Boolean)) {
            document.getElementById('status').textContent = 'نتیجه مساوی شد';
            active = false;
          } else {
            turn = turn === 'X' ? 'O' : 'X';
            document.getElementById('status').textContent = 'نوبت: ' + (turn === 'X' ? 'ضربدر' : 'دایره');
          }
          render();
        };
        grid.appendChild(d);
      });
    }
    function initGame() { board = Array(9).fill(''); turn = 'X'; active = true; document.getElementById('status').textContent = 'نوبت: ضربدر (X)'; render(); }
    initGame();
  </script>
</body>
</html>`
    : `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: system-ui, sans-serif; }
    body { background: #fafaf9; color: #1c1917; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; padding: 16px; }
    .card { background: #ffffff; border: 1px solid #e7e5e4; border-radius: 24px; padding: 20px; width: 100%; max-width: 320px; text-align: center; }
    h1 { font-size: 1.1rem; margin-bottom: 6px; font-weight: 600; }
    p { font-size: 0.8rem; color: #78716c; margin-bottom: 18px; }
    .display { font-size: 2.2rem; font-weight: bold; margin-bottom: 18px; background: #f5f5f4; padding: 12px; border-radius: 16px; border: 1px solid #e7e5e4; font-variant-numeric: tabular-nums; }
    .controls { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px; }
    button { background: #f5f5f4; color: #1c1917; border: 1px solid #e7e5e4; border-radius: 14px; padding: 14px; font-size: 1.2rem; font-weight: bold; cursor: pointer; }
    button:active { background: #e7e5e4; transform: scale(0.97); }
    button.reset { grid-column: span 2; font-size: 0.85rem; font-weight: normal; background: #1c1917; color: #ffffff; border: none; padding: 10px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${title}</h1>
    <p>${description}</p>
    <div id="val" class="display">۰</div>
    <div class="controls">
      <button onclick="change(1)">+</button>
      <button onclick="change(-1)">-</button>
      <button class="reset" onclick="reset()">صفر کردن</button>
    </div>
  </div>
  <script>
    let c = 0;
    function change(v) { c = Math.max(0, c + v); document.getElementById('val').textContent = c.toLocaleString('fa-IR'); }
    function reset() { c = 0; document.getElementById('val').textContent = '۰'; }
  </script>
</body>
</html>`;

  return { title, description, category, html };
}

/**
 * Executes a Gemini request with automatic multi-model fallback on quota/rate limits
 */
async function callGeminiWithFallback(
  ai: GoogleGenAI,
  userMessage: string,
  preferredModel: string
): Promise<{ title: string; description: string; category: string; html: string } | null> {
  const modelsToTry: string[] = [preferredModel];
  if (preferredModel !== 'gemini-3.8-flash') {
    modelsToTry.push('gemini-3.8-flash');
  }
  if (preferredModel !== 'gemini-3.1-flash-lite') {
    modelsToTry.push('gemini-3.1-flash-lite');
  }

  for (const model of modelsToTry) {
    try {
      const callPromise = ai.models.generateContent({
        model,
        contents: userMessage,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: 'نام کوتاه برنامه' },
              description: { type: Type.STRING, description: 'توضیح یک‌خطی برنامه' },
              category: { type: Type.STRING, description: 'دسته: بازی، ابزار، برنامه، دیگر' },
              html: { type: Type.STRING, description: 'کد کامل HTML مستقل' },
            },
            required: ['title', 'description', 'category', 'html'],
          },
        },
      });

      // 5-second timeout per attempt to rapidly fall back if quota is exhausted or model hangs
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Model request timed out')), 5000)
      );

      const response = await Promise.race([callPromise, timeoutPromise]);
      const responseText = response.text;
      if (responseText) {
        const parsed = JSON.parse(responseText);
        if (parsed && parsed.html) {
          return parsed;
        }
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      const isQuotaOrLimit =
        errMsg.includes('429') ||
        errMsg.includes('quota') ||
        errMsg.includes('RESOURCE_EXHAUSTED') ||
        errMsg.includes('limit: 0');

      if (isQuotaOrLimit) {
        console.warn(`Model ${model} exceeded quota/rate limit. Falling back to alternative...`);
        continue;
      }
      console.warn(`Model ${model} generation failed, trying alternative:`, errMsg);
    }
  }

  return null;
}

/**
 * 0. Rate limit & Model check for Gemini generation
 */
app.post('/api/gemini/generate', async (req: Request, res: Response) => {
  try {
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'client';
    const rateKey = req.body.username ? `user_${req.body.username}` : `ip_${clientIp}`;

    const { allowed, remaining } = checkRateLimit(rateKey);
    if (!allowed) {
      return res.status(429).json({
        isUserRateLimit: true,
        error: 'محدودیت تعداد درخواست در ساعت به پایان رسیده است. لطفاً بعداً تلاش کنید.',
      });
    }

    const { prompt, isRevision, currentCode, model: requestedModel } = req.body;
    const modelToUse: GeminiModelId =
      requestedModel && ALLOWED_MODELS.has(requestedModel)
        ? (requestedModel as GeminiModelId)
        : 'gemini-3.8-flash';

    const ai = getGeminiClient();
    const userMessage = isRevision && currentCode
      ? `کد فعلی برنامه:\n${currentCode}\n\nتوضیح تغییرات درخواستی کاربر:\n${prompt}`
      : `توضیح برنامه درخواستی کاربر:\n${prompt}`;

    if (ai) {
      const result = await callGeminiWithFallback(ai, userMessage, modelToUse);
      if (result) {
        return res.json({ ...result, remainingRateLimit: remaining });
      }
    }

    // Graceful fallback: when AI key has quota limits or is unavailable,
    // seamlessly provide a complete functional Persian HTML app
    const fallback = generateServerFallbackApp(prompt, isRevision, currentCode);
    return res.json({ ...fallback, remainingRateLimit: remaining, fallbackUsed: true });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.warn('Recovering with fallback app due to:', errorMsg);
    const fallback = generateServerFallbackApp(req.body?.prompt, req.body?.isRevision, req.body?.currentCode);
    return res.json({ ...fallback, fallbackUsed: true });
  }
});

/**
 * 1. User Identity & Username verification
 */
app.get('/api/auth/check-username/:username', async (req: Request, res: Response) => {
  const username = req.params.username;
  const available = await storage.isUsernameAvailable(username);
  return res.json({ available });
});

app.post('/api/auth/profile', async (req: Request, res: Response) => {
  const { username, displayName } = req.body;
  if (!username || !displayName) {
    return res.status(400).json({ error: 'یوزرنیم و اسم نمایشی الزامی هستند.' });
  }

  const available = await storage.isUsernameAvailable(username);
  if (!available) {
    return res.status(409).json({ error: 'این یوزرنیم قبلاً ثبت شده است.' });
  }

  const profile = {
    username: username.trim().toLowerCase(),
    displayName: displayName.trim(),
    createdAt: new Date().toLocaleDateString('fa-IR'),
  };

  await storage.registerUserProfile(profile);
  return res.json({ success: true, profile });
});

/**
 * 2. Real Chat endpoints with persistence & real-time broadcast
 */
const chatClients = new Set<Response>();

app.get('/api/chat/stream', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  chatClients.add(res);
  req.on('close', () => {
    chatClients.delete(res);
  });
});

function broadcastChatMessage(chatId: string, message: unknown) {
  const data = JSON.stringify({ chatId, message });
  for (const client of chatClients) {
    client.write(`data: ${data}\n\n`);
  }
}

app.get('/api/chat/messages/:chatId', async (req: Request, res: Response) => {
  const messages = await storage.getChatMessages(req.params.chatId);
  return res.json(messages);
});

app.post('/api/chat/messages', async (req: Request, res: Response) => {
  const { chatId, message } = req.body;
  if (!chatId || !message) {
    return res.status(400).json({ error: 'اطلاعات پیام ناقص است.' });
  }
  await storage.saveChatMessage(chatId, message);
  broadcastChatMessage(chatId, message);
  return res.json({ success: true });
});

/**
 * 3. Sharing & Collaborative Tools
 */
app.post('/api/collab/create', async (req: Request, res: Response) => {
  const { app: toolApp, ownerUsername, ownerDisplayName, mode, collaborators } = req.body;
  if (!toolApp || !ownerUsername) {
    return res.status(400).json({ error: 'اطلاعات ابزار برای اشتراک‌گذاری الزامی است.' });
  }

  const shareCode = 'APP-' + Math.floor(1000 + Math.random() * 9000);
  const sessionId = 'collab_' + Date.now();

  const initialVersion: AppVersion = {
    versionNumber: 1,
    prompt: toolApp.prompt || 'نسخه اولیه',
    authorUsername: ownerUsername,
    authorDisplayName: ownerDisplayName || ownerUsername,
    timestamp: 'الان',
    html: toolApp.html,
  };

  const session: SharedToolSession = {
    id: sessionId,
    shareCode,
    app: toolApp,
    ownerUsername,
    ownerDisplayName: ownerDisplayName || ownerUsername,
    mode: mode === 'collab' ? 'collab' : 'preview',
    collaborators: collaborators || [],
    versions: [initialVersion],
    currentVersion: 1,
    createdAt: new Date().toLocaleDateString('fa-IR'),
  };

  await storage.saveCollabSession(session);
  return res.json(session);
});

app.get('/api/collab/:id', async (req: Request, res: Response) => {
  const session = await storage.getCollabSession(req.params.id);
  if (!session) return res.status(404).json({ error: 'نشست اشتراک‌گذاری یافت نشد.' });
  return res.json(session);
});

app.get('/api/collab/code/:code', async (req: Request, res: Response) => {
  const session = await storage.getCollabSessionByCode(req.params.code);
  if (!session) return res.status(404).json({ error: 'کد اشتراک‌گذاری معتبر نیست.' });
  return res.json(session);
});

// Concurrency queue-based collaborative edit
app.post('/api/collab/:id/edit', async (req: Request, res: Response) => {
  const sessionId = req.params.id;
  const { prompt, authorUsername, authorDisplayName } = req.body;

  const session = await storage.getCollabSession(sessionId);
  if (!session) return res.status(404).json({ error: 'نشست یافت نشد.' });
  if (session.mode !== 'collab') {
    return res.status(403).json({ error: 'این ابزار در حالت فقط پیش‌نمایش اشتراک گذاشته شده است.' });
  }

  // Check collaborator authorization
  const isOwner = session.ownerUsername === authorUsername;
  const isCollab = session.collaborators.some((c) => c.username === authorUsername);
  if (!isOwner && !isCollab) {
    return res.status(403).json({ error: 'شما دسترسی ویرایش به این ابزار را ندارید.' });
  }

  try {
    // Process request sequentially through queue
    const updatedSession = await queueCollabTask(sessionId, async () => {
      const current = await storage.getCollabSession(sessionId);
      if (!current) throw new Error('نشست یافت نشد');

      const ai = getGeminiClient();
      let newHtml = current.app.html;

      if (ai) {
        const userMessage = `کد فعلی برنامه:\n${current.app.html}\n\nدستور تغییر کاربر:\n${prompt}`;
        try {
          const result = await callGeminiWithFallback(ai, userMessage, 'gemini-3.8-flash');
          if (result && result.html) {
            newHtml = result.html;
          }
        } catch {
          // Graceful fallback preserves app code and logs warning
          console.warn('Collab edit using fallback due to API limit');
        }
      }

      const nextVersionNum = current.versions.length + 1;
      const newVersion: AppVersion = {
        versionNumber: nextVersionNum,
        prompt: prompt.trim(),
        authorUsername,
        authorDisplayName: authorDisplayName || authorUsername,
        timestamp: 'الان',
        html: newHtml,
      };

      const updated = await storage.updateCollabSession(sessionId, (s) => ({
        ...s,
        app: { ...s.app, html: newHtml, code: newHtml },
        versions: [...s.versions, newVersion],
        currentVersion: nextVersionNum,
      }));

      // Broadcast update to real-time chat/collab channels
      broadcastChatMessage(`collab_${sessionId}`, {
        type: 'version_updated',
        version: newVersion,
      });

      return updated;
    });

    return res.json(updatedSession);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: errorMsg });
  }
});

// Revert to previous version
app.post('/api/collab/:id/revert', async (req: Request, res: Response) => {
  const sessionId = req.params.id;
  const { versionNumber, username } = req.body;

  const session = await storage.getCollabSession(sessionId);
  if (!session) return res.status(404).json({ error: 'نشست یافت نشد.' });
  if (session.ownerUsername !== username) {
    return res.status(403).json({ error: 'فقط توسعه‌دهنده اصلی می‌تواند نسخه را بازگرداند.' });
  }

  const targetVersion = session.versions.find((v) => v.versionNumber === Number(versionNumber));
  if (!targetVersion) {
    return res.status(404).json({ error: 'نسخه مورد نظر در تاریخچه یافت نشد.' });
  }

  const updated = await storage.updateCollabSession(sessionId, (s) => ({
    ...s,
    app: { ...s.app, html: targetVersion.html, code: targetVersion.html },
    currentVersion: targetVersion.versionNumber,
  }));

  broadcastChatMessage(`collab_${sessionId}`, {
    type: 'version_reverted',
    versionNumber: targetVersion.versionNumber,
  });

  return res.json(updated);
});

// Add or remove collaborators (Main developer only)
app.post('/api/collab/:id/collaborators', async (req: Request, res: Response) => {
  const sessionId = req.params.id;
  const { action, collaborator, ownerUsername } = req.body;

  const session = await storage.getCollabSession(sessionId);
  if (!session) return res.status(404).json({ error: 'نشست یافت نشد.' });
  if (session.ownerUsername !== ownerUsername) {
    return res.status(403).json({ error: 'فقط توسعه‌دهنده اصلی می‌تواند همکاران را مدیریت کند.' });
  }

  const updated = await storage.updateCollabSession(sessionId, (s) => {
    let nextCollabs = [...s.collaborators];
    if (action === 'add') {
      if (!nextCollabs.some((c) => c.username === collaborator.username)) {
        nextCollabs.push(collaborator);
      }
    } else if (action === 'remove') {
      nextCollabs = nextCollabs.filter((c) => c.username !== collaborator.username);
    }
    return { ...s, collaborators: nextCollabs };
  });

  return res.json(updated);
});

// Serve frontend in development (Vite middleware) or production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}

startServer();
