import React, { useState, useRef, useEffect } from 'react';
import {
  Conversation,
  GeneratedApp,
  ChatMessage,
  UserProfile,
  SharedToolSession,
  AppVersion,
} from '../types';
import { appendMessage } from '../services/chatService';
import {
  IconUser,
  IconGroup,
  IconBack,
  IconSend,
  IconAttach,
  IconPlay,
  IconClose,
  IconPhoto,
  IconVideo,
  IconPlus,
  IconHistory,
  IconCheck,
} from './Icons';

interface SharesTabProps {
  currentUser: UserProfile | null;
  savedCreations: GeneratedApp[];
  conversations: Conversation[];
  onUpdateConversations: (conversations: Conversation[]) => void;
  onPreviewApp: (app: GeneratedApp) => void;
  onNavigateToCreate: () => void;
}

export const SharesTab: React.FC<SharesTabProps> = ({
  currentUser,
  savedCreations,
  conversations,
  onUpdateConversations,
  onPreviewApp,
  onNavigateToCreate,
}) => {
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [isAttachOpen, setIsAttachOpen] = useState(false);
  const [attachSubView, setAttachSubView] = useState<'main' | 'creations'>('main');

  // Collaboration Session & Version History State
  const [collabSession, setCollabSession] = useState<SharedToolSession | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [collabPrompt, setCollabPrompt] = useState('');
  const [isApplyingCollabEdit, setIsApplyingCollabEdit] = useState(false);
  const [collabStatusMsg, setCollabStatusMsg] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeConv = conversations.find((c) => c.id === activeConvId);

  // Real-time Chat SSE Stream connection
  useEffect(() => {
    let evtSource: EventSource | null = null;
    try {
      evtSource = new EventSource('/api/chat/stream');
      evtSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload && payload.chatId && payload.message) {
            onUpdateConversations(
              conversations.map((c) => {
                if (c.id === payload.chatId) {
                  // Avoid duplicate message IDs
                  if (c.messages.some((m) => m.id === payload.message.id)) return c;
                  return {
                    ...c,
                    subtitle: payload.message.text || 'پیام جدید',
                    timestamp: payload.message.timestamp || 'الان',
                    messages: [...c.messages, payload.message],
                  };
                }
                return c;
              })
            );
          }
        } catch {
          // Ignored parse error
        }
      };
    } catch {
      // Stream fallback
    }

    return () => {
      if (evtSource) evtSource.close();
    };
  }, [conversations, onUpdateConversations]);

  // Load shared session details if active conversation has one
  useEffect(() => {
    if (activeConv?.sharedSessionId) {
      fetch(`/api/collab/${activeConv.sharedSessionId}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) setCollabSession(data);
        })
        .catch(() => {});
    } else {
      setCollabSession(null);
    }
  }, [activeConvId, activeConv?.sharedSessionId]);

  useEffect(() => {
    if (activeConv) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeConv?.messages.length]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeConvId) return;

    const textToSend = inputText.trim();
    setInputText('');

    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const newMsg: ChatMessage = {
      id: 'msg_' + Date.now(),
      sender: 'user',
      senderUsername: currentUser?.username || 'user',
      senderName: currentUser?.displayName || 'شما',
      text: textToSend,
      timestamp: timeStr,
    };

    // 1. Optimistic update
    const updated = conversations.map((conv) => {
      if (conv.id === activeConvId) {
        return {
          ...conv,
          subtitle: textToSend,
          timestamp: timeStr,
          messages: [...conv.messages, newMsg],
        };
      }
      return conv;
    });
    onUpdateConversations(updated);

    // 2. Persist to server
    try {
      await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: activeConvId,
          message: newMsg,
        }),
      });
    } catch {
      // In-memory fallback
    }
  };

  const handleSendAppCard = async (app: GeneratedApp) => {
    if (!activeConvId) return;

    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const newMsg: ChatMessage = {
      id: 'msg_' + Date.now(),
      sender: 'user',
      senderUsername: currentUser?.username || 'user',
      senderName: currentUser?.displayName || 'شما',
      attachedApp: app,
      timestamp: timeStr,
    };

    const updated = appendMessage(conversations, activeConvId, undefined, app);
    onUpdateConversations(updated);
    setIsAttachOpen(false);
    setAttachSubView('main');

    try {
      await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: activeConvId,
          message: newMsg,
        }),
      });
    } catch {
      // Offline fallback
    }
  };

  const handleSendMediaPlaceholder = (type: 'image' | 'video') => {
    if (!activeConvId) return;
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const newMsg: ChatMessage = {
      id: 'msg_' + Date.now(),
      sender: 'user',
      senderUsername: currentUser?.username || 'user',
      senderName: currentUser?.displayName || 'شما',
      attachment: {
        type,
        title: type === 'image' ? 'تصویر ضمیمه‌شده' : 'ویدیو ضمیمه‌شده',
      },
      text: type === 'image' ? 'یک عکس فرستاد' : 'یک ویدیو فرستاد',
      timestamp: timeStr,
    };

    const updated = conversations.map((conv) => {
      if (conv.id === activeConvId) {
        return {
          ...conv,
          subtitle: type === 'image' ? 'عکس' : 'ویدیو',
          timestamp: timeStr,
          messages: [...conv.messages, newMsg],
        };
      }
      return conv;
    });

    onUpdateConversations(updated);
    setIsAttachOpen(false);
  };

  // Collaborative Edit Request with AI
  const handleCollabEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collabSession || !collabPrompt.trim() || isApplyingCollabEdit) return;

    setIsApplyingCollabEdit(true);
    setCollabStatusMsg('در صف ویرایش هوش مصنوعی...');

    try {
      const res = await fetch(`/api/collab/${collabSession.id}/edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: collabPrompt.trim(),
          authorUsername: currentUser?.username || 'user',
          authorDisplayName: currentUser?.displayName || 'کاربر',
        }),
      });

      if (res.ok) {
        const updatedSession = await res.json();
        setCollabSession(updatedSession);
        setCollabPrompt('');
        setCollabStatusMsg('تغییرات با موفقیت اعمال شد.');
        setTimeout(() => setCollabStatusMsg(null), 2500);
      } else {
        const err = await res.json().catch(() => ({}));
        setCollabStatusMsg(err.error || 'خطا در اعمال تغییرات');
      }
    } catch {
      setCollabStatusMsg('عدم برقراری ارتباط با سرور.');
    } finally {
      setIsApplyingCollabEdit(false);
    }
  };

  // Rollback to a specific version
  const handleRollbackVersion = async (versionNumber: number) => {
    if (!collabSession) return;
    try {
      const res = await fetch(`/api/collab/${collabSession.id}/revert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ versionNumber }),
      });
      if (res.ok) {
        const updated = await res.json();
        setCollabSession(updated);
        setIsHistoryOpen(false);
      }
    } catch {
      // Ignored
    }
  };

  // 1. Conversation List View
  if (!activeConv) {
    return (
      <div className="flex flex-col h-full overflow-y-auto no-scrollbar px-4 pt-4 pb-24 max-w-md mx-auto w-full anim-fade-up">
        <div className="mb-4">
          <h1 className="text-base font-semibold text-stone-900 dark:text-stone-100">
            گفتگوها
          </h1>
        </div>

        <div className="space-y-2">
          {conversations.map((conv, idx) => (
            <div
              key={conv.id}
              onClick={() => setActiveConvId(conv.id)}
              className={`p-3.5 rounded-2xl bg-stone-100 hover:bg-stone-200/70 dark:bg-stone-900 dark:hover:bg-stone-800/80 border border-stone-200/80 dark:border-stone-800 cursor-pointer flex items-center justify-between transition-all duration-200 active:scale-[0.98] stagger-${(idx % 5) + 1}`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-full bg-stone-200 dark:bg-stone-800 flex items-center justify-center text-stone-700 dark:text-stone-300 flex-shrink-0">
                  {conv.type === 'pv' ? (
                    <IconUser className="w-5 h-5" />
                  ) : (
                    <IconGroup className="w-5 h-5" />
                  )}
                </div>
                <div className="min-w-0 text-right">
                  <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100 truncate mb-0.5">
                    {conv.title}
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400 truncate">
                    {conv.subtitle}
                  </p>
                </div>
              </div>

              <div className="text-left flex flex-col items-end flex-shrink-0 mr-2">
                <span className="text-[11px] text-stone-400 dark:text-stone-500 mb-1">
                  {conv.timestamp}
                </span>
                {Boolean(conv.unreadCount) && (
                  <span className="w-5 h-5 rounded-full bg-stone-900 dark:bg-stone-100 text-stone-50 dark:text-stone-900 text-[10px] font-bold flex items-center justify-center anim-pop">
                    {conv.unreadCount}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 2. Chat Screen View
  const isOwner = collabSession && collabSession.ownerUsername === currentUser?.username;
  const isCollaborator = collabSession && collabSession.mode === 'collab';

  return (
    <div className="flex flex-col h-full bg-stone-50 dark:bg-stone-950 anim-fade-up">
      {/* Chat Top Header */}
      <div className="h-14 px-4 border-b border-stone-200/80 dark:border-stone-800/80 bg-stone-50/90 dark:bg-stone-950/90 backdrop-blur-md flex items-center justify-between z-10 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setActiveConvId(null);
              setCollabSession(null);
            }}
            aria-label="برگشت"
            className="p-2 -mr-2 rounded-xl text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors active:scale-90"
          >
            <IconBack className="w-5 h-5" />
          </button>
          <div className="w-9 h-9 rounded-full bg-stone-200 dark:bg-stone-800 flex items-center justify-center text-stone-700 dark:text-stone-300">
            {activeConv.type === 'pv' ? (
              <IconUser className="w-4 h-4" />
            ) : (
              <IconGroup className="w-4 h-4" />
            )}
          </div>
          <div className="text-right">
            <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-100 leading-tight">
              {activeConv.title}
            </h2>
            <span className="text-[10px] text-stone-500 dark:text-stone-400">
              {activeConv.type === 'pv' ? 'آنلاین' : 'گروه'}
            </span>
          </div>
        </div>

        {/* If Shared Collab Session is active, show history icon button */}
        {collabSession && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsHistoryOpen(true)}
              aria-label="تاریخچه نسخه‌ها"
              title="تاریخچه نسخه‌ها"
              className="p-2 rounded-xl text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors"
            >
              <IconHistory className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Collaboration Banner if Session Attached */}
      {collabSession && (
        <div className="bg-stone-100 dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 px-4 py-2.5 text-xs flex items-center justify-between">
          <div className="text-right min-w-0 pr-1">
            <div className="flex items-center gap-1.5 font-bold text-stone-900 dark:text-stone-100 mb-0.5">
              <span>{collabSession.app.title}</span>
              <span className="text-[10px] font-normal px-1.5 py-0.2 rounded bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
                نسخه {collabSession.currentVersion}
              </span>
            </div>
            <div className="text-[11px] text-stone-500 dark:text-stone-400">
              نقش شما:{' '}
              {isOwner ? (
                <span className="font-semibold text-stone-800 dark:text-stone-200">
                  توسعه‌دهنده‌ی اصلی
                </span>
              ) : isCollaborator ? (
                <span className="font-semibold text-stone-800 dark:text-stone-200">
                  کمک‌کننده
                </span>
              ) : (
                'بیننده پیش‌نمایش'
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onPreviewApp(collabSession.app)}
              className="py-1 px-2.5 rounded-xl bg-stone-900 dark:bg-stone-100 text-stone-50 dark:text-stone-900 text-[11px] font-medium active:scale-95 transition-transform"
            >
              اجرا
            </button>
          </div>
        </div>
      )}

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3 pb-24">
        {activeConv.messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} anim-bubble`}
            >
              {/* If group message and other sender, show name */}
              {activeConv.type === 'group' && !isUser && msg.senderName && (
                <span className="text-[10px] text-stone-400 dark:text-stone-500 mb-1 px-1">
                  {msg.senderName}
                </span>
              )}

              {/* Message text bubble */}
              {msg.text && (
                <div
                  className={`max-w-[78%] p-3 rounded-2xl text-sm leading-relaxed ${
                    isUser
                      ? 'bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 rounded-bl-sm'
                      : 'bg-stone-200/90 text-stone-900 dark:bg-stone-800 dark:text-stone-100 rounded-br-sm'
                  }`}
                >
                  <p>{msg.text}</p>
                  <div
                    className={`text-[10px] mt-1 text-right ${
                      isUser
                        ? 'text-stone-400 dark:text-stone-500'
                        : 'text-stone-500 dark:text-stone-400'
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>
              )}

              {/* Attached Media Placeholder if any */}
              {msg.attachment && (
                <div className="p-3 rounded-2xl bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 flex items-center gap-2 text-xs text-stone-700 dark:text-stone-300 mt-1">
                  {msg.attachment.type === 'image' ? (
                    <IconPhoto className="w-4 h-4 text-stone-500" />
                  ) : (
                    <IconVideo className="w-4 h-4 text-stone-500" />
                  )}
                  <span>{msg.attachment.title}</span>
                </div>
              )}

              {/* Attached Creation Card in Chat: Name ALWAYS first, description below */}
              {msg.attachedApp && (
                <div className="w-64 p-3.5 rounded-2xl bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm anim-scale mt-1">
                  <div className="text-right mb-2">
                    <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 mb-0.5">
                      {msg.attachedApp.title}
                    </h4>
                    <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-2">
                      {msg.attachedApp.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-stone-200/60 dark:border-stone-800">
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
                      {msg.attachedApp.category}
                    </span>
                    <button
                      type="button"
                      onClick={() => onPreviewApp(msg.attachedApp!)}
                      className="flex items-center gap-1.5 py-1 px-2.5 rounded-xl bg-stone-900 dark:bg-stone-100 text-stone-50 dark:text-stone-900 text-xs font-medium active:scale-95 transition-transform"
                    >
                      <IconPlay className="w-3 h-3" />
                      <span>اجرا</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input bar pinned at bottom */}
      <div className="fixed bottom-16 inset-x-0 p-3 bg-stone-50/95 dark:bg-stone-950/95 backdrop-blur-md border-t border-stone-200/60 dark:border-stone-800/60 z-20">
        <form
          onSubmit={handleSendMessage}
          className="max-w-md mx-auto flex items-center gap-2"
        >
          {/* Attachment Button */}
          <button
            type="button"
            onClick={() => {
              setAttachSubView('main');
              setIsAttachOpen(true);
            }}
            aria-label="ضمیمه"
            title="ضمیمه"
            className="w-11 h-11 rounded-2xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-900 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 flex items-center justify-center transition-colors active:scale-95 flex-shrink-0"
          >
            <IconAttach className="w-5 h-5" />
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="پیام..."
            className="flex-1 bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl px-4 py-3 text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-600 focus:outline-none focus:border-stone-400 dark:focus:border-stone-600 transition-colors"
          />

          <button
            type="submit"
            disabled={!inputText.trim()}
            aria-label="ارسال"
            className="w-11 h-11 rounded-2xl bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-stone-200 text-stone-50 dark:text-stone-900 flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none transition-all active:scale-95 flex-shrink-0"
          >
            <IconSend className="w-4 h-4 rtl:-rotate-90" />
          </button>
        </form>
      </div>

      {/* Attachment Drawer: Slides completely up to full height without clipping or bugs */}
      {isAttachOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="پنجره ضمیمه"
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 backdrop-blur-[2px] anim-fade-up"
          onClick={() => {
            setIsAttachOpen(false);
            setAttachSubView('main');
          }}
        >
          <div
            className="w-full max-w-lg bg-stone-50 dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 rounded-t-[32px] p-5 pb-8 anim-sheet max-h-[88vh] flex flex-col relative z-[61] shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1 bg-stone-300 dark:bg-stone-700 rounded-full mx-auto mb-4" />

            <div className="flex items-center justify-between mb-4 px-1">
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                {attachSubView === 'main' ? 'ضمیمه کردن' : 'انتخاب از ساخته‌هام'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  if (attachSubView === 'creations') {
                    setAttachSubView('main');
                  } else {
                    setIsAttachOpen(false);
                  }
                }}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
              >
                <IconClose className="w-4 h-4" />
              </button>
            </div>

            {attachSubView === 'main' ? (
              /* The 4 requested drawer options: عکس, ویدیو, ساخته‌هام, جدید */
              <div className="grid grid-cols-2 gap-3 py-2 anim-fade-up">
                {/* 1. عکس */}
                <button
                  type="button"
                  onClick={() => handleSendMediaPlaceholder('image')}
                  className="p-4 rounded-2xl bg-stone-100 dark:bg-stone-800/70 border border-stone-200 dark:border-stone-800 flex flex-col items-center justify-center gap-2 hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-all active:scale-95"
                >
                  <div className="w-10 h-10 rounded-xl bg-stone-200 dark:bg-stone-700 flex items-center justify-center text-stone-700 dark:text-stone-300">
                    <IconPhoto className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold text-stone-900 dark:text-stone-100">
                    عکس
                  </span>
                </button>

                {/* 2. ویدیو */}
                <button
                  type="button"
                  onClick={() => handleSendMediaPlaceholder('video')}
                  className="p-4 rounded-2xl bg-stone-100 dark:bg-stone-800/70 border border-stone-200 dark:border-stone-800 flex flex-col items-center justify-center gap-2 hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-all active:scale-95"
                >
                  <div className="w-10 h-10 rounded-xl bg-stone-200 dark:bg-stone-700 flex items-center justify-center text-stone-700 dark:text-stone-300">
                    <IconVideo className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold text-stone-900 dark:text-stone-100">
                    ویدیو
                  </span>
                </button>

                {/* 3. ساخته‌هام */}
                <button
                  type="button"
                  onClick={() => setAttachSubView('creations')}
                  className="p-4 rounded-2xl bg-stone-100 dark:bg-stone-800/70 border border-stone-200 dark:border-stone-800 flex flex-col items-center justify-center gap-2 hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-all active:scale-95"
                >
                  <div className="w-10 h-10 rounded-xl bg-stone-200 dark:bg-stone-700 flex items-center justify-center text-stone-700 dark:text-stone-300">
                    <IconPlay className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold text-stone-900 dark:text-stone-100">
                    ساخته‌هام
                  </span>
                </button>

                {/* 4. جدید (هدایت به تب ساخت) */}
                <button
                  type="button"
                  onClick={() => {
                    setIsAttachOpen(false);
                    onNavigateToCreate();
                  }}
                  className="p-4 rounded-2xl bg-stone-100 dark:bg-stone-800/70 border border-stone-200 dark:border-stone-800 flex flex-col items-center justify-center gap-2 hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-all active:scale-95"
                >
                  <div className="w-10 h-10 rounded-xl bg-stone-900 dark:bg-stone-100 text-stone-50 dark:text-stone-900 flex items-center justify-center">
                    <IconPlus className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold text-stone-900 dark:text-stone-100">
                    جدید
                  </span>
                </button>
              </div>
            ) : (
              /* Subview: List of saved creations to send as card */
              <div className="flex-1 overflow-y-auto no-scrollbar space-y-2 anim-fade-up">
                {savedCreations.length === 0 ? (
                  <div className="py-8 text-center text-xs text-stone-500">
                    هنوز هیچ برنامه‌ای ذخیره نشده است
                  </div>
                ) : (
                  savedCreations.map((app) => (
                    <div
                      key={app.id}
                      onClick={() => handleSendAppCard(app)}
                      className="p-3 rounded-2xl border border-stone-200/80 dark:border-stone-800 bg-stone-100 dark:bg-stone-800/60 hover:bg-stone-200/60 dark:hover:bg-stone-800 cursor-pointer flex items-center justify-between transition-all duration-150 active:scale-[0.98]"
                    >
                      <div className="text-right min-w-0 pr-1">
                        <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 truncate mb-0.5">
                          {app.title}
                        </h4>
                        <p className="text-xs text-stone-500 dark:text-stone-400 truncate">
                          {app.description}
                        </p>
                      </div>
                      <span className="text-[10px] px-2 py-1 rounded-lg bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 flex-shrink-0 mr-2">
                        {app.category}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Version History & Collaborative AI Edit Modal */}
      {isHistoryOpen && collabSession && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="تاریخچه نسخه‌ها و همکاری"
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md anim-fade-up"
          onClick={() => setIsHistoryOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-[32px] bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-5 shadow-2xl anim-scale flex flex-col max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="text-right">
                <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                  تاریخچه نسخه‌ها: {collabSession.app.title}
                </h3>
                <span className="text-[10px] text-stone-500">
                  کد اشتراک: {collabSession.shareCode}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsHistoryOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
              >
                <IconClose className="w-4 h-4" />
              </button>
            </div>

            {/* List of Versions with Rollback Action */}
            <div className="flex-1 overflow-y-auto no-scrollbar space-y-2 mb-4">
              {collabSession.versions.map((ver: AppVersion) => {
                const isCurrent = ver.versionNumber === collabSession.currentVersion;
                return (
                  <div
                    key={ver.versionNumber}
                    className={`p-3 rounded-2xl border text-right transition-all ${
                      isCurrent
                        ? 'bg-stone-200/80 dark:bg-stone-800 border-stone-300 dark:border-stone-700'
                        : 'bg-stone-100 dark:bg-stone-800/40 border-stone-200 dark:border-stone-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-stone-900 dark:text-stone-100">
                        نسخه {ver.versionNumber}
                      </span>
                      <span className="text-[10px] text-stone-400">{ver.timestamp}</span>
                    </div>

                    <p className="text-xs text-stone-600 dark:text-stone-300 mb-2 leading-relaxed">
                      {ver.prompt}
                    </p>

                    <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-stone-200/60 dark:border-stone-700/60">
                      <span className="text-stone-500">نویسنده: {ver.authorDisplayName}</span>

                      {isCurrent ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-stone-300 dark:bg-stone-700 text-stone-800 dark:text-stone-200 font-medium">
                          نسخه فعلی
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleRollbackVersion(ver.versionNumber)}
                          className="px-2.5 py-1 rounded-xl bg-stone-900 dark:bg-stone-100 text-stone-50 dark:text-stone-900 text-[10px] font-medium active:scale-95 transition-transform"
                        >
                          بازگشت به این نسخه
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Collaborator AI Revision Form */}
            {collabSession.mode === 'collab' && (
              <form
                onSubmit={handleCollabEdit}
                className="pt-3 border-t border-stone-200 dark:border-stone-800 flex flex-col gap-2"
              >
                <div className="text-xs font-semibold text-stone-800 dark:text-stone-200 text-right">
                  درخواست ویرایش با هوش مصنوعی (همکاری)
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={collabPrompt}
                    onChange={(e) => setCollabPrompt(e.target.value)}
                    placeholder="توضیح تغییرات مورد نظر..."
                    disabled={isApplyingCollabEdit}
                    className="flex-1 bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl px-3 py-2 text-xs text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:border-stone-400"
                  />
                  <button
                    type="submit"
                    disabled={!collabPrompt.trim() || isApplyingCollabEdit}
                    className="py-2 px-3 rounded-2xl bg-stone-900 dark:bg-stone-100 text-stone-50 dark:text-stone-900 text-xs font-medium disabled:opacity-30 active:scale-95 flex items-center gap-1"
                  >
                    <IconSend className="w-3.5 h-3.5 rtl:-rotate-90" />
                    <span>ارسال</span>
                  </button>
                </div>

                {collabStatusMsg && (
                  <span className="text-[11px] text-stone-500 text-right anim-fade-up">
                    {collabStatusMsg}
                  </span>
                )}
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
