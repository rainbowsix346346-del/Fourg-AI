import React, { useState, useEffect } from 'react';
import {
  AppTab,
  AppTheme,
  GeneratedApp,
  Conversation,
  UserProfile,
  GeminiModelId,
  SharedToolSession,
} from './types';
import {
  IconBuild,
  IconCreations,
  IconShares,
  IconSettings,
} from './components/Icons';
import { CreationTab } from './components/CreationTab';
import { CreationsTab } from './components/CreationsTab';
import { SharesTab } from './components/SharesTab';
import { SettingsTab } from './components/SettingsTab';
import { FullscreenPreviewModal } from './components/FullscreenPreviewModal';
import { UserProfileModal } from './components/UserProfileModal';
import { getCurrentProfile, saveCurrentProfile } from './services/identityService';
import { getStoredModel, saveStoredModel } from './services/aiBuilder';
import {
  initialConversations,
  initialContacts,
  initialGroups,
} from './services/chatService';

const defaultMockCreations: GeneratedApp[] = [
  {
    id: 'app_mock_1',
    title: 'بازی دوز هوشمند',
    description: 'بازی دوز دونفره با رابط کاربری لمسی و کنترل نوبت',
    category: 'بازی',
    html: `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <title>بازی دوز هوشمند</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: system-ui, sans-serif; user-select: none; }
    body { background: #fafaf9; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; padding: 16px; }
    .card { background: #fff; border: 1px solid #e7e5e4; border-radius: 24px; padding: 20px; width: 100%; max-width: 320px; text-align: center; }
    h2 { font-size: 1.1rem; margin-bottom: 6px; font-weight: bold; }
    p { font-size: 0.8rem; color: #78716c; margin-bottom: 14px; }
    .status { font-size: 0.85rem; font-weight: 500; margin-bottom: 14px; padding: 6px 12px; background: #f5f5f4; border-radius: 12px; display: inline-block; }
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 16px; }
    .cell { aspect-ratio: 1; background: #f5f5f4; border: 1px solid #e7e5e4; border-radius: 14px; font-size: 1.6rem; font-weight: bold; display: flex; align-items: center; justify-content: center; cursor: pointer; }
    .cell:active { background: #e7e5e4; transform: scale(0.96); }
    button { background: #1c1917; color: #fff; border: none; border-radius: 14px; padding: 10px 20px; font-size: 0.85rem; cursor: pointer; width: 100%; }
  </style>
</head>
<body>
  <div class="card">
    <h2>بازی دوز هوشمند</h2>
    <p>بازی دوز دونفره</p>
    <div id="status" class="status">نوبت: ضربدر (X)</div>
    <div class="grid" id="grid"></div>
    <button onclick="reset()">شروع مجدد</button>
  </div>
  <script>
    let b = Array(9).fill(''), turn = 'X', live = true;
    function draw() {
      const g = document.getElementById('grid'); g.innerHTML = '';
      b.forEach((v, i) => {
        const d = document.createElement('div'); d.className = 'cell'; d.textContent = v;
        d.onclick = () => {
          if (!live || b[i]) return;
          b[i] = turn;
          const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
          if (wins.some(([x,y,z]) => b[x] && b[x] === b[y] && b[x] === b[z])) {
            document.getElementById('status').textContent = 'برنده: ' + (turn === 'X' ? 'ضربدر' : 'دایره');
            live = false;
          } else if (b.every(Boolean)) {
            document.getElementById('status').textContent = 'نتیجه مساوی شد'; live = false;
          } else {
            turn = turn === 'X' ? 'O' : 'X';
            document.getElementById('status').textContent = 'نوبت: ' + (turn === 'X' ? 'ضربدر' : 'دایره');
          }
          draw();
        };
        g.appendChild(d);
      });
    }
    function reset() { b = Array(9).fill(''); turn = 'X'; live = true; document.getElementById('status').textContent = 'نوبت: ضربدر (X)'; draw(); }
    draw();
  </script>
</body>
</html>`,
    code: `<!-- بازی دوز هوشمند -->`,
    prompt: 'بازی دوز دونفره لمسی',
    createdAt: 'دیروز',
    isFavorite: true,
    orientation: 'portrait',
  },
  {
    id: 'app_mock_2',
    title: 'ماشین‌حساب مینیمال',
    description: 'ابزار محاسبه سریع ریاضی و چهار عمل اصلی',
    category: 'ابزار',
    html: `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <title>ماشین‌حساب مینیمال</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: system-ui, sans-serif; }
    body { background: #fafaf9; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; padding: 16px; }
    .card { background: #fff; border: 1px solid #e7e5e4; border-radius: 24px; padding: 20px; width: 100%; max-width: 320px; text-align: center; }
    h2 { font-size: 1.1rem; margin-bottom: 6px; font-weight: bold; }
    p { font-size: 0.8rem; color: #78716c; margin-bottom: 14px; }
    .display { font-size: 2rem; font-weight: bold; background: #f5f5f4; border: 1px solid #e7e5e4; border-radius: 16px; padding: 12px; margin-bottom: 12px; text-align: left; min-height: 60px; overflow-x: auto; }
    .pad { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
    button { background: #f5f5f4; border: 1px solid #e7e5e4; border-radius: 12px; padding: 14px 6px; font-size: 1rem; font-weight: 600; cursor: pointer; }
    button:active { background: #e7e5e4; transform: scale(0.96); }
    button.op { background: #1c1917; color: #fff; border: none; }
  </style>
</head>
<body>
  <div class="card">
    <h2>ماشین‌حساب مینیمال</h2>
    <p>ابزار محاسبه سریع</p>
    <div id="disp" class="display">0</div>
    <div class="pad">
      <button onclick="c()">C</button><button onclick="a('/')">/</button><button onclick="a('*')">*</button><button class="op" onclick="del()">←</button>
      <button onclick="a('7')">7</button><button onclick="a('8')">8</button><button onclick="a('9')">9</button><button class="op" onclick="a('-')">-</button>
      <button onclick="a('4')">4</button><button onclick="a('5')">5</button><button onclick="a('6')">6</button><button class="op" onclick="a('+')">+</button>
      <button onclick="a('1')">1</button><button onclick="a('2')">2</button><button onclick="a('3')">3</button><button class="op" onclick="eq()">=</button>
      <button style="grid-column: span 2;" onclick="a('0')">0</button><button style="grid-column: span 2;" onclick="a('.')">.</button>
    </div>
  </div>
  <script>
    let s = '0';
    function a(v) { if (s === '0') s = v; else s += v; upd(); }
    function c() { s = '0'; upd(); }
    function del() { s = s.length > 1 ? s.slice(0, -1) : '0'; upd(); }
    function eq() { try { s = String(Function('"use strict";return (' + s + ')')()); } catch { s = 'خطا'; } upd(); }
    function upd() { document.getElementById('disp').textContent = s; }
  </script>
</body>
</html>`,
    code: `<!-- ماشین‌حساب مینیمال -->`,
    prompt: 'ماشین‌حساب ساده لمسی',
    createdAt: '۳ روز پیش',
    isFavorite: false,
    orientation: 'portrait',
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('create');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => getCurrentProfile());
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(() => !getCurrentProfile());

  const [theme, setTheme] = useState<AppTheme>(() => {
    const saved = localStorage.getItem('app_theme') as AppTheme | null;
    return saved === 'light' || saved === 'dark' || saved === 'auto' ? saved : 'auto';
  });

  const [selectedModel, setSelectedModel] = useState<GeminiModelId>(() => getStoredModel());

  // Load saved creations from localStorage
  const [savedCreations, setSavedCreations] = useState<GeneratedApp[]>(() => {
    try {
      const stored = localStorage.getItem('saved_creations');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Ignored
    }
    return defaultMockCreations;
  });

  const [savedAppIds, setSavedAppIds] = useState<Set<string>>(
    () => new Set(savedCreations.map((a) => a.id))
  );

  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [previewApp, setPreviewApp] = useState<GeneratedApp | null>(null);

  // Apply theme to document element
  useEffect(() => {
    const root = document.documentElement;

    const applyTheme = () => {
      if (theme === 'dark') {
        root.classList.add('dark');
      } else if (theme === 'light') {
        root.classList.remove('dark');
      } else {
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (systemPrefersDark) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      }
    };

    applyTheme();

    if (theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme();
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  const handleThemeChange = (newTheme: AppTheme) => {
    setTheme(newTheme);
    localStorage.setItem('app_theme', newTheme);
  };

  const handleModelChange = (newModel: GeminiModelId) => {
    setSelectedModel(newModel);
    saveStoredModel(newModel);
  };

  const handleProfileCreated = (profile: UserProfile) => {
    saveCurrentProfile(profile);
    setCurrentUser(profile);
    setIsProfileModalOpen(false);
  };

  const handleSaveApp = (app: GeneratedApp) => {
    setSavedCreations((prev) => {
      if (prev.some((item) => item.id === app.id)) return prev;
      const updated = [app, ...prev];
      try {
        localStorage.setItem('saved_creations', JSON.stringify(updated));
      } catch {
        // Ignored
      }
      return updated;
    });
    setSavedAppIds((prev) => new Set([...prev, app.id]));
  };

  const handleToggleFavorite = (appId: string) => {
    setSavedCreations((prev) => {
      const updated = prev.map((app) =>
        app.id === appId ? { ...app, isFavorite: !app.isFavorite } : app
      );
      try {
        localStorage.setItem('saved_creations', JSON.stringify(updated));
      } catch {
        // Ignored
      }
      return updated;
    });
  };

  const handleShareSessionCreated = (
    session: SharedToolSession,
    targetType: 'pv' | 'group',
    targetIds: string[]
  ) => {
    let updatedConversations = [...conversations];

    targetIds.forEach((targetId) => {
      let targetConv = updatedConversations.find(
        (c) =>
          c.type === targetType &&
          (c.id === `conv_${targetId}` ||
            c.title ===
              (targetType === 'pv'
                ? initialContacts.find((x) => x.id === targetId)?.name
                : initialGroups.find((x) => x.id === targetId)?.name))
      );

      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      const newMsg = {
        id: 'msg_' + Date.now() + Math.random().toString(36).substring(2, 5),
        sender: 'user' as const,
        senderUsername: currentUser?.username || 'user',
        senderName: currentUser?.displayName || 'شما',
        attachedApp: session.app,
        timestamp: timeStr,
      };

      if (!targetConv) {
        const name =
          targetType === 'pv'
            ? initialContacts.find((x) => x.id === targetId)?.name || 'مخاطب'
            : initialGroups.find((x) => x.id === targetId)?.name || 'گروه';

        targetConv = {
          id: `conv_${targetId}`,
          title: name,
          subtitle: `کارت: ${session.app.title}`,
          type: targetType,
          timestamp: 'الان',
          sharedSessionId: session.id,
          messages: [newMsg],
        };
        updatedConversations = [targetConv, ...updatedConversations];
      } else {
        updatedConversations = updatedConversations.map((c) => {
          if (c.id === targetConv!.id) {
            return {
              ...c,
              subtitle: `کارت: ${session.app.title}`,
              timestamp: timeStr,
              sharedSessionId: session.id,
              messages: [...c.messages, newMsg],
            };
          }
          return c;
        });
      }
    });

    setConversations(updatedConversations);
  };

  const navTabs: { id: AppTab; label: string; icon: React.ReactNode }[] = [
    {
      id: 'create',
      label: 'ساخت',
      icon: <IconBuild className="w-5 h-5" />,
    },
    {
      id: 'creations',
      label: 'ساخته‌هام',
      icon: <IconCreations className="w-5 h-5" />,
    },
    {
      id: 'shares',
      label: 'اشتراک‌ها',
      icon: <IconShares className="w-5 h-5" />,
    },
    {
      id: 'settings',
      label: 'تنظیمات',
      icon: <IconSettings className="w-5 h-5" />,
    },
  ];

  const activeTabIndex = navTabs.findIndex((t) => t.id === activeTab);

  return (
    <div className="flex flex-col h-screen w-full bg-stone-50 text-stone-900 dark:bg-stone-950 dark:text-stone-100 overflow-hidden font-sans">
      {/* Main Content View with transition key */}
      <main className="flex-1 overflow-hidden relative">
        <div key={activeTab} className="h-full w-full anim-fade-up">
          {activeTab === 'create' && (
            <CreationTab
              currentUser={currentUser}
              onSaveApp={handleSaveApp}
              savedAppIds={savedAppIds}
              onShareSessionCreated={handleShareSessionCreated}
            />
          )}
          {activeTab === 'creations' && (
            <CreationsTab
              creations={savedCreations}
              onPreviewApp={(app) => setPreviewApp(app)}
              onToggleFavorite={handleToggleFavorite}
            />
          )}
          {activeTab === 'shares' && (
            <SharesTab
              currentUser={currentUser}
              savedCreations={savedCreations}
              conversations={conversations}
              onUpdateConversations={setConversations}
              onPreviewApp={(app) => setPreviewApp(app)}
              onNavigateToCreate={() => setActiveTab('create')}
            />
          )}
          {activeTab === 'settings' && (
            <SettingsTab
              theme={theme}
              onThemeChange={handleThemeChange}
              selectedModel={selectedModel}
              onModelChange={handleModelChange}
            />
          )}
        </div>
      </main>

      {/* Fullscreen Sandboxed Iframe Preview Modal with orientation detection */}
      <FullscreenPreviewModal
        app={previewApp}
        onClose={() => setPreviewApp(null)}
      />

      {/* First-time User Profile Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onProfileCreated={handleProfileCreated}
      />

      {/* Bottom Navigation Bar with Sliding Indicator */}
      <nav
        aria-label="ناوبری اصلی"
        className="fixed bottom-0 inset-x-0 h-16 bg-stone-50/95 dark:bg-stone-950/95 backdrop-blur-md border-t border-stone-200/80 dark:border-stone-800/80 z-30 max-w-lg mx-auto"
      >
        <div className="relative flex items-center justify-around h-full px-2">
          {/* Animated sliding indicator behind the active tab */}
          <div
            className="absolute top-1.5 bottom-1.5 rounded-2xl bg-stone-200/60 dark:bg-stone-800/60 transition-all duration-300 ease-out pointer-events-none"
            style={{
              width: 'calc(25% - 8px)',
              right: `calc(${activeTabIndex * 25}% + 4px)`,
            }}
          />

          {navTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`relative z-10 flex-1 flex flex-col items-center justify-center py-1 transition-all duration-200 active:scale-95 ${
                  isActive
                    ? 'text-stone-900 dark:text-stone-100 font-semibold'
                    : 'text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300'
                }`}
              >
                <div
                  className={`mb-1 transition-transform duration-200 ${
                    isActive ? 'scale-105' : 'scale-100'
                  }`}
                >
                  {tab.icon}
                </div>
                <span className="text-[11px] leading-tight">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
