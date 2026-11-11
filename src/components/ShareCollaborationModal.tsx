import React, { useState } from 'react';
import { GeneratedApp, Contact, Group, SharedToolSession, UserProfile } from '../types';
import { initialContacts, initialGroups } from '../services/chatService';
import {
  IconClose,
  IconCheck,
  IconLink,
  IconUser,
  IconGroup,
  IconQr,
  IconSend,
} from './Icons';

interface ShareCollaborationModalProps {
  isOpen: boolean;
  onClose: () => void;
  app: GeneratedApp | null;
  currentUser: UserProfile | null;
  onShareSessionCreated: (session: SharedToolSession, targetType: 'pv' | 'group', targetIds: string[]) => void;
}

type QRTheme = 'neutral' | 'slate' | 'forest' | 'warm';

export const ShareCollaborationModal: React.FC<ShareCollaborationModalProps> = ({
  isOpen,
  onClose,
  app,
  currentUser,
  onShareSessionCreated,
}) => {
  const [mode, setMode] = useState<'preview' | 'collab'>('preview');
  const [targetType, setTargetType] = useState<'pv' | 'group' | 'link'>('pv');
  const [recipientName, setRecipientName] = useState('');
  const [selectedTargets, setSelectedTargets] = useState<string[]>([]);
  const [qrTheme, setQrTheme] = useState<QRTheme>('neutral');
  const [shareCode] = useState(() => 'APP-' + Math.floor(1000 + Math.random() * 9000));
  const [copiedLink, setCopiedLink] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !app) return null;

  const toggleTarget = (id: string, name?: string) => {
    setSelectedTargets((prev) => {
      const exists = prev.includes(id);
      if (exists) return prev.filter((x) => x !== id);
      if (name && !recipientName) setRecipientName(name);
      return [...prev, id];
    });
  };

  const qrColorMap: Record<QRTheme, { bg: string; fg: string; label: string }> = {
    neutral: { bg: '#f5f5f4', fg: '#1c1917', label: 'سنگی' },
    slate: { bg: '#f1f5f9', fg: '#1e293b', label: 'سربی' },
    forest: { bg: '#f0fdf4', fg: '#14532d', label: 'جنگلی' },
    warm: { bg: '#fffbeb', fg: '#78350f', label: 'گرم' },
  };

  const handleCopyLink = async () => {
    const fullUrl = `${window.location.origin}/#collab=${shareCode}`;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(fullUrl);
      }
    } catch {
      // Ignored
    }
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 1500);
  };

  const handleSend = async () => {
    if (!app) return;
    setIsSubmitting(true);

    const ownerUser = currentUser?.username || 'user';
    const ownerName = currentUser?.displayName || 'شما';

    const collaborators = targetType === 'pv'
      ? selectedTargets.map((id) => {
          const c = initialContacts.find((x) => x.id === id);
          return { username: c?.username || id, displayName: c?.name || id };
        })
      : [];

    try {
      const res = await fetch('/api/collab/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          app,
          ownerUsername: ownerUser,
          ownerDisplayName: ownerName,
          mode,
          collaborators,
        }),
      });

      if (res.ok) {
        const session: SharedToolSession = await res.json();
        onShareSessionCreated(session, targetType === 'group' ? 'group' : 'pv', selectedTargets);
        onClose();
      }
    } catch {
      // Fallback local session
      const fallbackSession: SharedToolSession = {
        id: 'collab_' + Date.now(),
        shareCode,
        app,
        ownerUsername: ownerUser,
        ownerDisplayName: ownerName,
        mode,
        collaborators,
        versions: [
          {
            versionNumber: 1,
            prompt: app.prompt || 'نسخه اولیه',
            authorUsername: ownerUser,
            authorDisplayName: ownerName,
            timestamp: 'الان',
            html: app.html,
          },
        ],
        currentVersion: 1,
        createdAt: 'امروز',
      };
      onShareSessionCreated(fallbackSession, targetType === 'group' ? 'group' : 'pv', selectedTargets);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="اشتراک‌گذاری و همکاری"
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50 backdrop-blur-[2px] anim-fade-up"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-stone-50 dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 rounded-t-[32px] p-5 pb-8 anim-sheet flex flex-col max-h-[88vh] shadow-2xl relative z-[71]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-1 bg-stone-300 dark:bg-stone-700 rounded-full mx-auto mb-3" />

        {/* Header Preview: Name on top, description below */}
        <div className="p-3.5 mb-3.5 rounded-2xl bg-stone-100 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700/60 flex items-center justify-between">
          <div className="text-right flex-1 min-w-0 pr-1">
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 truncate mb-0.5">
              {app.title}
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 truncate">
              {app.description}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="بستن"
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
          >
            <IconClose className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Selector: پیش‌نمایش vs همکاری */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1.5 text-right">
            نوع دسترسی گیرنده
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMode('preview')}
              className={`p-3 rounded-2xl border text-right transition-all duration-200 active:scale-95 ${
                mode === 'preview'
                  ? 'bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 border-stone-900 dark:border-stone-100'
                  : 'bg-stone-100 dark:bg-stone-800/70 border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300'
              }`}
            >
              <div className="text-xs font-bold mb-0.5">فقط پیش‌نمایش</div>
              <div className="text-[10px] opacity-75">گیرنده فقط امکان مشاهده و اجرا دارد</div>
            </button>

            <button
              type="button"
              onClick={() => setMode('collab')}
              className={`p-3 rounded-2xl border text-right transition-all duration-200 active:scale-95 ${
                mode === 'collab'
                  ? 'bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 border-stone-900 dark:border-stone-100'
                  : 'bg-stone-100 dark:bg-stone-800/70 border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300'
              }`}
            >
              <div className="text-xs font-bold mb-0.5">همکاری مشترک</div>
              <div className="text-[10px] opacity-75">شما توسعه‌دهنده اصلی و گیرنده کمک‌کننده است</div>
            </button>
          </div>
        </div>

        {/* Target Tabs: پیوی، گروه، لینک و QR */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <button
            type="button"
            onClick={() => setTargetType('pv')}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-2xl text-xs font-medium transition-all active:scale-95 ${
              targetType === 'pv'
                ? 'bg-stone-800 text-stone-50 dark:bg-stone-200 dark:text-stone-900'
                : 'bg-stone-100 dark:bg-stone-800/60 text-stone-700 dark:text-stone-300'
            }`}
          >
            <IconUser className="w-3.5 h-3.5" />
            <span>پیوی</span>
          </button>

          <button
            type="button"
            onClick={() => setTargetType('group')}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-2xl text-xs font-medium transition-all active:scale-95 ${
              targetType === 'group'
                ? 'bg-stone-800 text-stone-50 dark:bg-stone-200 dark:text-stone-900'
                : 'bg-stone-100 dark:bg-stone-800/60 text-stone-700 dark:text-stone-300'
            }`}
          >
            <IconGroup className="w-3.5 h-3.5" />
            <span>گروه</span>
          </button>

          <button
            type="button"
            onClick={() => setTargetType('link')}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-2xl text-xs font-medium transition-all active:scale-95 ${
              targetType === 'link'
                ? 'bg-stone-800 text-stone-50 dark:bg-stone-200 dark:text-stone-900'
                : 'bg-stone-100 dark:bg-stone-800/60 text-stone-700 dark:text-stone-300'
            }`}
          >
            <IconQr className="w-3.5 h-3.5" />
            <span>کد و QR</span>
          </button>
        </div>

        {/* Target Content Area */}
        <div className="flex-1 overflow-y-auto no-scrollbar py-1">
          {targetType === 'pv' ? (
            <div className="space-y-2 anim-fade-up">
              {initialContacts.map((c) => {
                const isSelected = selectedTargets.includes(c.id);
                return (
                  <div
                    key={c.id}
                    onClick={() => toggleTarget(c.id, c.name)}
                    className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all active:scale-[0.98] ${
                      isSelected
                        ? 'bg-stone-200/80 dark:bg-stone-800 border-stone-300 dark:border-stone-600'
                        : 'bg-stone-100 dark:bg-stone-800/50 border-stone-200 dark:border-stone-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-stone-200 dark:bg-stone-700 flex items-center justify-center text-stone-700 dark:text-stone-300">
                        <IconUser className="w-4 h-4" />
                      </div>
                      <div className="text-right">
                        <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100">{c.name}</h4>
                        <span className="text-[10px] text-stone-500 font-mono">@{c.username}</span>
                      </div>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-stone-900 dark:bg-stone-100 border-stone-900 dark:border-stone-100 text-stone-50 dark:text-stone-900'
                          : 'border-stone-300 dark:border-stone-600'
                      }`}
                    >
                      {isSelected && <IconCheck className="w-3 h-3 anim-pop" />}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : targetType === 'group' ? (
            <div className="space-y-2 anim-fade-up">
              {initialGroups.map((g) => {
                const isSelected = selectedTargets.includes(g.id);
                return (
                  <div
                    key={g.id}
                    onClick={() => toggleTarget(g.id, g.name)}
                    className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all active:scale-[0.98] ${
                      isSelected
                        ? 'bg-stone-200/80 dark:bg-stone-800 border-stone-300 dark:border-stone-600'
                        : 'bg-stone-100 dark:bg-stone-800/50 border-stone-200 dark:border-stone-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-stone-200 dark:bg-stone-700 flex items-center justify-center text-stone-700 dark:text-stone-300">
                        <IconGroup className="w-4 h-4" />
                      </div>
                      <div className="text-right">
                        <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100">{g.name}</h4>
                        <span className="text-[10px] text-stone-500">{g.description}</span>
                      </div>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-stone-900 dark:bg-stone-100 border-stone-900 dark:border-stone-100 text-stone-50 dark:text-stone-900'
                          : 'border-stone-300 dark:border-stone-600'
                      }`}
                    >
                      {isSelected && <IconCheck className="w-3 h-3 anim-pop" />}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* QR & Code View */
            <div className="flex flex-col items-center py-2 anim-fade-up">
              {/* QR Theme Selector */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[11px] text-stone-500 dark:text-stone-400">تم رنگی QR:</span>
                {(Object.keys(qrColorMap) as QRTheme[]).map((themeKey) => (
                  <button
                    key={themeKey}
                    type="button"
                    onClick={() => setQrTheme(themeKey)}
                    className={`px-2.5 py-1 rounded-xl text-[10px] font-medium transition-all active:scale-95 border ${
                      qrTheme === themeKey
                        ? 'border-stone-900 dark:border-stone-100 font-bold shadow-sm'
                        : 'border-stone-200 dark:border-stone-700 opacity-60'
                    }`}
                    style={{ backgroundColor: qrColorMap[themeKey].bg, color: qrColorMap[themeKey].fg }}
                  >
                    {qrColorMap[themeKey].label}
                  </button>
                ))}
              </div>

              {/* Vector SVG QR Code with animated palette change */}
              <div
                className="p-4 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm transition-colors duration-300 mb-3"
                style={{ backgroundColor: qrColorMap[qrTheme].bg }}
              >
                <svg
                  width="130"
                  height="130"
                  viewBox="0 0 100 100"
                  className="transition-colors duration-300"
                  style={{ color: qrColorMap[qrTheme].fg }}
                  fill="currentColor"
                >
                  {/* Top-left eye */}
                  <rect x="10" y="10" width="24" height="24" rx="6" fill="none" stroke="currentColor" strokeWidth="5" />
                  <rect x="17" y="17" width="10" height="10" rx="3" />
                  {/* Top-right eye */}
                  <rect x="66" y="10" width="24" height="24" rx="6" fill="none" stroke="currentColor" strokeWidth="5" />
                  <rect x="73" y="17" width="10" height="10" rx="3" />
                  {/* Bottom-left eye */}
                  <rect x="10" y="66" width="24" height="24" rx="6" fill="none" stroke="currentColor" strokeWidth="5" />
                  <rect x="17" y="73" width="10" height="10" rx="3" />
                  {/* Center data pattern */}
                  <rect x="44" y="12" width="12" height="6" rx="2" />
                  <rect x="44" y="24" width="6" height="12" rx="2" />
                  <rect x="42" y="42" width="16" height="16" rx="4" />
                  <rect x="64" y="44" width="8" height="8" rx="2" />
                  <rect x="14" y="44" width="8" height="8" rx="2" />
                  <rect x="44" y="66" width="12" height="6" rx="2" />
                  <rect x="66" y="66" width="8" height="14" rx="2" />
                  <rect x="80" y="76" width="10" height="10" rx="2" />
                </svg>
              </div>

              {/* Unique Code & Copy Link */}
              <div className="flex items-center gap-2 mb-2 font-mono text-xs bg-stone-200/80 dark:bg-stone-800 px-3 py-1.5 rounded-xl text-stone-800 dark:text-stone-200">
                <span>کد اشتراک:</span>
                <span className="font-bold tracking-wider">{shareCode}</span>
              </div>

              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full py-2.5 px-4 rounded-2xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 text-xs font-medium transition-all active:scale-95 flex items-center justify-center gap-2 mt-1"
              >
                {copiedLink ? <IconCheck className="w-4 h-4" /> : <IconLink className="w-4 h-4" />}
                <span>{copiedLink ? 'لینک کپی شد' : 'کپی لینک یکتای همکاری'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Send Action */}
        {(targetType === 'pv' || targetType === 'group') && (
          <div className="pt-3 border-t border-stone-200 dark:border-stone-800 mt-2">
            <button
              type="button"
              disabled={selectedTargets.length === 0 || isSubmitting}
              onClick={handleSend}
              className="w-full py-3 px-4 rounded-2xl bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-stone-200 text-stone-50 dark:text-stone-900 text-sm font-medium disabled:opacity-35 disabled:pointer-events-none transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <IconSend className="w-4 h-4 rtl:-rotate-90" />
              <span>ارسال اشتراک</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
