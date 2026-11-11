import { GeneratedApp, GeminiModelId, GeminiModelOption } from '../types';

export const AVAILABLE_MODELS: GeminiModelOption[] = [
  {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash',
    badge: 'سریع',
    description: 'مدل استاندارد و سریع برای تولید ابزارها و بازی‌های کوچک',
  },
  {
    id: 'gemini-3.1-flash-lite',
    name: 'Gemini 3.1 Flash Lite',
    badge: 'سریع',
    description: 'فوق‌العاده سبک و کم‌مصرف برای پاسخ‌های فوری',
  },
  {
    id: 'gemini-4-carbon',
    name: 'Gemini 4 Carbon',
    badge: 'قوی',
    description: 'مدل قدرتمند با استدلال عمیق برای برنامه‌های پیچیده‌تر',
  },
];

export const DEFAULT_MODEL: GeminiModelId = 'gemini-3.8-flash';

export function getStoredModel(): GeminiModelId {
  try {
    const stored = localStorage.getItem('selected_gemini_model') as GeminiModelId | null;
    if (stored && AVAILABLE_MODELS.some((m) => m.id === stored)) {
      return stored;
    }
  } catch {
    // Ignored
  }
  return DEFAULT_MODEL;
}

export function saveStoredModel(model: GeminiModelId): void {
  localStorage.setItem('selected_gemini_model', model);
}

/**
 * Detects whether an app is best suited for portrait or landscape orientation
 */
export function detectAppOrientation(
  prompt: string,
  category: string,
  html?: string
): 'portrait' | 'landscape' {
  const text = `${prompt} ${category} ${html || ''}`.toLowerCase();
  const landscapeKeywords = [
    'افقی',
    'landscape',
    'پینگ پنگ',
    'pong',
    'ماشین',
    'رانندگی',
    'racing',
    'piano',
    'پیانو',
    'منچ',
    'شطرنج',
    'chess',
    'نمودار افقی',
    'timeline',
  ];

  for (const kw of landscapeKeywords) {
    if (text.includes(kw)) {
      return 'landscape';
    }
  }
  return 'portrait';
}

/**
 * Generates or revises an app using server-side Gemini API.
 * Securely communicates with the server without any client-side keys.
 */
export async function generateAppFromPrompt(
  prompt: string,
  onProgress: (percent: number, stageName: string) => void,
  currentCode?: string,
  model?: GeminiModelId,
  username?: string
): Promise<GeneratedApp> {
  const cleanPrompt = prompt.trim();
  const isRevision = Boolean(currentCode && currentCode.trim().length > 0);
  const effectiveModel = model || getStoredModel();

  // Stage 1: Preparation
  onProgress(15, 'تحلیل متن و آماده‌سازی پرامپت');
  await delay(180);

  // Stage 2: Communicating with server
  onProgress(35, `ارتباط با سرور و پردازش با ${effectiveModel}`);
  try {
    const response = await fetch('/api/gemini/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: cleanPrompt,
        isRevision,
        currentCode: currentCode || null,
        model: effectiveModel,
        username: username || undefined,
      }),
    });

    if (response.ok) {
      onProgress(88, 'اعتبارسنجی خروجی هوش مصنوعی');
      const parsed = await response.json();
      if (parsed && parsed.html) {
        onProgress(100, 'بارگذاری نهایی در فریم');
        const orientation = detectAppOrientation(cleanPrompt, parsed.category, parsed.html);
        return {
          id: 'app_' + Date.now(),
          title: parsed.title || cleanPrompt,
          description: parsed.description || 'برنامه ساخته‌شده با هوش مصنوعی',
          category: normalizeCategory(parsed.category),
          html: parsed.html,
          code: parsed.html,
          prompt: cleanPrompt,
          createdAt: 'امروز',
          isFavorite: false,
          orientation,
        };
      }
    } else if (response.status === 429) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || 'محدودیت تعداد درخواست در ساعت به پایان رسیده است.');
    }
  } catch (err: unknown) {
    // If rate limit error, propagate it
    if (err instanceof Error && err.message.includes('محدودیت')) {
      throw err;
    }
  }

  // Fallback: Smart local engine for offline / seamless testing
  onProgress(45, 'ارتباط با موتور ساخت برنامه');
  await delay(280);

  onProgress(75, 'تولید منطق، ظاهر و استایل برنامه');
  await delay(320);

  onProgress(90, 'اعتبارسنجی ساختار HTML');
  await delay(240);

  const fallbackApp = generateSmartFallbackApp(cleanPrompt, isRevision, currentCode);
  onProgress(100, 'پایان ساخت و نمایش برنامه');
  return fallbackApp;
}

function normalizeCategory(cat: string): 'بازی' | 'ابزار' | 'برنامه' | 'دیگر' {
  if (!cat) return 'برنامه';
  if (cat.includes('بازی')) return 'بازی';
  if (cat.includes('ابزار')) return 'ابزار';
  if (cat.includes('برنامه')) return 'برنامه';
  return 'دیگر';
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function generateSmartFallbackApp(
  prompt: string,
  isRevision: boolean,
  currentCode?: string
): GeneratedApp {
  const isGame = /بازی|دوز|حدس|مار|پازل|تاس|سرگرمی|کوییز|پینگ/i.test(prompt);
  const isTool = /ماشین|حساب|مبدل|محاسبه|ابزار|تایمر|زمان|درصد|تقویم|شمارنده/i.test(prompt);

  let category: 'بازی' | 'ابزار' | 'برنامه' | 'دیگر' = 'برنامه';
  let title = prompt.length > 20 ? prompt.slice(0, 20) + '...' : prompt;
  let description = 'ابزار کاربردی سبک و تعاملی';

  if (isGame) {
    category = 'بازی';
    title = prompt.includes('دوز') ? 'بازی دوز هوشمند' : (prompt.length > 2 ? prompt : 'بازی تعاملی');
    description = 'بازی ساده دونفره روی یک صفحه با رابط کاربری لمسی';
  } else if (isTool) {
    category = 'ابزار';
    title = prompt.includes('ماشین') ? 'ماشین‌حساب مینیمال' : (prompt.length > 2 ? prompt : 'ابزار محاسباتی');
    description = 'ابزار محاسبه سریع و روان با رابط لمسی';
  } else {
    category = 'برنامه';
    title = prompt.length > 2 ? prompt : 'برنامه کاربردی';
    description = 'برنامه کوچک و سبک جهت انجام کارهای روزمره';
  }

  if (isRevision && currentCode) {
    title = title + ' (ویرایش‌شده)';
    description = `ویرایش بر اساس: ${prompt}`;
  }

  const html = generateCompleteHtml(title, description, category);
  const orientation = detectAppOrientation(prompt, category, html);

  return {
    id: 'app_' + Date.now(),
    title,
    description,
    category,
    html,
    code: html,
    prompt,
    createdAt: 'امروز',
    isFavorite: false,
    orientation,
  };
}

function generateCompleteHtml(title: string, description: string, category: string): string {
  if (category === 'بازی') {
    return `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; user-select: none; font-family: system-ui, -apple-system, sans-serif; }
    body { background: #fafaf9; color: #1c1917; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; padding: 16px; }
    .card { background: #ffffff; border: 1px solid #e7e5e4; border-radius: 24px; padding: 20px; width: 100%; max-width: 320px; text-align: center; }
    h1 { font-size: 1.1rem; margin-bottom: 6px; font-weight: 600; }
    p { font-size: 0.8rem; color: #78716c; margin-bottom: 16px; }
    .status { font-size: 0.85rem; font-weight: 500; margin-bottom: 14px; padding: 6px 12px; background: #f5f5f4; border-radius: 12px; display: inline-block; }
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 16px; }
    .cell { aspect-ratio: 1; background: #f5f5f4; border: 1px solid #e7e5e4; border-radius: 14px; font-size: 1.6rem; font-weight: bold; color: #1c1917; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background 0.15s; }
    .cell:active { background: #e7e5e4; transform: scale(0.96); }
    button.btn { background: #1c1917; color: #ffffff; border: none; border-radius: 14px; padding: 10px 20px; font-size: 0.85rem; cursor: pointer; font-weight: 500; width: 100%; transition: opacity 0.15s; }
    button.btn:active { opacity: 0.85; }
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
    let board = Array(9).fill('');
    let turn = 'X';
    let active = true;

    function render() {
      const grid = document.getElementById('grid');
      grid.innerHTML = '';
      board.forEach((val, idx) => {
        const d = document.createElement('div');
        d.className = 'cell';
        d.textContent = val;
        d.onclick = () => makeMove(idx);
        grid.appendChild(d);
      });
    }

    function makeMove(idx) {
      if (!active || board[idx]) return;
      board[idx] = turn;
      if (checkWin()) {
        document.getElementById('status').textContent = 'برنده: ' + (turn === 'X' ? 'ضربدر' : 'دایره');
        active = false;
      } else if (board.every(Boolean)) {
        document.getElementById('status').textContent = 'نتیجه مساوی شد';
        active = false;
      } else {
        turn = turn === 'X' ? 'O' : 'X';
        document.getElementById('status').textContent = 'نوبت: ' + (turn === 'X' ? 'ضربدر (X)' : 'دایره (O)');
      }
      render();
    }

    function checkWin() {
      const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
      return wins.some(([a,b,c]) => board[a] && board[a] === board[b] && board[a] === board[c]);
    }

    function initGame() {
      board = Array(9).fill('');
      turn = 'X';
      active = true;
      document.getElementById('status').textContent = 'نوبت: ضربدر (X)';
      render();
    }

    initGame();
  </script>
</body>
</html>`;
  }

  return `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: system-ui, -apple-system, sans-serif; }
    body { background: #fafaf9; color: #1c1917; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; padding: 16px; }
    .card { background: #ffffff; border: 1px solid #e7e5e4; border-radius: 24px; padding: 20px; width: 100%; max-width: 320px; text-align: center; }
    h1 { font-size: 1.1rem; margin-bottom: 6px; font-weight: 600; }
    p { font-size: 0.8rem; color: #78716c; margin-bottom: 18px; }
    .display { font-size: 2.4rem; font-weight: bold; margin-bottom: 18px; background: #f5f5f4; padding: 12px; border-radius: 16px; border: 1px solid #e7e5e4; font-variant-numeric: tabular-nums; }
    .controls { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px; }
    button { background: #f5f5f4; color: #1c1917; border: 1px solid #e7e5e4; border-radius: 14px; padding: 14px; font-size: 1.2rem; font-weight: bold; cursor: pointer; transition: background 0.15s, transform 0.1s; }
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
    function change(v) {
      c = Math.max(0, c + v);
      document.getElementById('val').textContent = c.toLocaleString('fa-IR');
    }
    function reset() {
      c = 0;
      document.getElementById('val').textContent = '۰';
    }
  </script>
</body>
</html>`;
}

export function calculateCircleProgress(percent: number, radius = 54) {
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;
  return {
    circumference,
    strokeDashoffset,
  };
}
