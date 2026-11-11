import React, { useState } from 'react';
import { GeneratedApp, Contact, Group } from '../types';
import { initialContacts, initialGroups } from '../services/chatService';
import { IconUser, IconGroup, IconLink, IconCheck, IconClose, IconSend } from './Icons';

interface ShareBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  app: GeneratedApp | null;
  onShareComplete: (type: 'pv' | 'group', targetIds: string[]) => void;
}

export const ShareBottomSheet: React.FC<ShareBottomSheetProps> = ({
  isOpen,
  onClose,
  app,
  onShareComplete,
}) => {
  const [activeMode, setActiveMode] = useState<'pv' | 'group' | 'link'>('pv');
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [copiedLink, setCopiedLink] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  if (!isOpen || !app) return null;

  const toggleContact = (id: string) => {
    setSelectedContacts((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleGroup = (id: string) => {
    setSelectedGroups((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleCopyLink = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
      }
    } catch {
      // Ignored
    }
    setCopiedLink(true);
    setTimeout(() => {
      setCopiedLink(false);
      onClose();
    }, 1200);
  };

  const handleSend = () => {
    if (activeMode === 'pv' && selectedContacts.length > 0) {
      onShareComplete('pv', selectedContacts);
      setSentSuccess(true);
      setTimeout(() => {
        setSentSuccess(false);
        setSelectedContacts([]);
        onClose();
      }, 1000);
    } else if (activeMode === 'group' && selectedGroups.length > 0) {
      onShareComplete('group', selectedGroups);
      setSentSuccess(true);
      setTimeout(() => {
        setSentSuccess(false);
        setSelectedGroups([]);
        onClose();
      }, 1000);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="اشتراک‌گذاری"
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/45 backdrop-blur-[2px] transition-opacity duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-stone-50 dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 rounded-t-[32px] p-5 pb-8 anim-sheet flex flex-col max-h-[85vh] shadow-2xl relative z-[61]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Grab bar */}
        <div className="w-12 h-1 bg-stone-300 dark:bg-stone-700 rounded-full mx-auto mb-4" />

        {/* Top Header with App Preview: Name ALWAYS on top, description below */}
        <div className="p-3.5 mb-4 rounded-2xl bg-stone-100 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700/60 flex items-center justify-between">
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
            className="p-1.5 rounded-xl hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 transition-colors"
          >
            <IconClose className="w-4 h-4" />
          </button>
        </div>

        {/* 3 Share Mode Buttons */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <button
            type="button"
            onClick={() => setActiveMode('pv')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl text-xs font-medium transition-all duration-200 active:scale-95 ${
              activeMode === 'pv'
                ? 'bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 shadow-sm'
                : 'bg-stone-100 dark:bg-stone-800/70 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
            }`}
          >
            <IconUser className="w-4 h-4" />
            <span>پیوی</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('group')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl text-xs font-medium transition-all duration-200 active:scale-95 ${
              activeMode === 'group'
                ? 'bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 shadow-sm'
                : 'bg-stone-100 dark:bg-stone-800/70 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
            }`}
          >
            <IconGroup className="w-4 h-4" />
            <span>گروه</span>
          </button>

          <button
            type="button"
            onClick={handleCopyLink}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl text-xs font-medium transition-all duration-200 active:scale-95 ${
              copiedLink
                ? 'bg-stone-800 text-stone-100 dark:bg-stone-200 dark:text-stone-900'
                : 'bg-stone-100 dark:bg-stone-800/70 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
            }`}
          >
            {copiedLink ? <IconCheck className="w-4 h-4" /> : <IconLink className="w-4 h-4" />}
            <span>{copiedLink ? 'کپی شد' : 'لینک'}</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto no-scrollbar py-1">
          {sentSuccess ? (
            <div className="py-8 text-center anim-pop flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-stone-200 dark:bg-stone-700 flex items-center justify-center text-stone-900 dark:text-stone-100 mb-2">
                <IconCheck className="w-6 h-6" />
              </div>
              <span className="text-sm font-medium text-stone-800 dark:text-stone-200">
                با موفقیت ارسال شد
              </span>
            </div>
          ) : activeMode === 'pv' ? (
            /* Contacts List */
            <div className="space-y-2 anim-fade-up">
              {initialContacts.map((contact, idx) => {
                const isChecked = selectedContacts.includes(contact.id);
                return (
                  <div
                    key={contact.id}
                    onClick={() => toggleContact(contact.id)}
                    className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all duration-200 active:scale-[0.98] stagger-${(idx % 5) + 1} ${
                      isChecked
                        ? 'bg-stone-200/70 dark:bg-stone-800 border-stone-300 dark:border-stone-600'
                        : 'bg-stone-100 dark:bg-stone-800/50 border-stone-200/80 dark:border-stone-800/80 hover:bg-stone-200/40 dark:hover:bg-stone-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-stone-200 dark:bg-stone-700 flex items-center justify-center text-stone-700 dark:text-stone-300">
                        <IconUser className="w-4 h-4" />
                      </div>
                      <div className="text-right">
                        <h4 className="text-sm font-medium text-stone-900 dark:text-stone-100">
                          {contact.name}
                        </h4>
                        <span className="text-[11px] text-stone-500 dark:text-stone-400">
                          {contact.status}
                        </span>
                      </div>
                    </div>

                    <div
                      className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all duration-150 ${
                        isChecked
                          ? 'bg-stone-900 dark:bg-stone-100 border-stone-900 dark:border-stone-100 text-stone-50 dark:text-stone-900 scale-100'
                          : 'border-stone-300 dark:border-stone-600'
                      }`}
                    >
                      {isChecked && <IconCheck className="w-3.5 h-3.5 anim-pop" />}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : activeMode === 'group' ? (
            /* Groups List */
            <div className="space-y-2 anim-fade-up">
              {initialGroups.map((group, idx) => {
                const isChecked = selectedGroups.includes(group.id);
                return (
                  <div
                    key={group.id}
                    onClick={() => toggleGroup(group.id)}
                    className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all duration-200 active:scale-[0.98] stagger-${(idx % 4) + 1} ${
                      isChecked
                        ? 'bg-stone-200/70 dark:bg-stone-800 border-stone-300 dark:border-stone-600'
                        : 'bg-stone-100 dark:bg-stone-800/50 border-stone-200/80 dark:border-stone-800/80 hover:bg-stone-200/40 dark:hover:bg-stone-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-stone-200 dark:bg-stone-700 flex items-center justify-center text-stone-700 dark:text-stone-300">
                        <IconGroup className="w-4 h-4" />
                      </div>
                      <div className="text-right">
                        <h4 className="text-sm font-medium text-stone-900 dark:text-stone-100">
                          {group.name}
                        </h4>
                        <span className="text-[11px] text-stone-500 dark:text-stone-400">
                          {group.description}
                        </span>
                      </div>
                    </div>

                    <div
                      className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all duration-150 ${
                        isChecked
                          ? 'bg-stone-900 dark:bg-stone-100 border-stone-900 dark:border-stone-100 text-stone-50 dark:text-stone-900 scale-100'
                          : 'border-stone-300 dark:border-stone-600'
                      }`}
                    >
                      {isChecked && <IconCheck className="w-3.5 h-3.5 anim-pop" />}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Link view */
            <div className="py-6 px-4 text-center anim-fade-up">
              <p className="text-xs text-stone-500 dark:text-stone-400 mb-4">
                لینک اختصاصی برنامه آماده اشتراک‌گذاری است
              </p>
              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full py-3 px-4 rounded-2xl bg-stone-900 dark:bg-stone-100 text-stone-50 dark:text-stone-900 text-sm font-medium transition-transform active:scale-95 flex items-center justify-center gap-2"
              >
                <IconLink className="w-4 h-4" />
                <span>{copiedLink ? 'لینک کپی شد' : 'کپی کردن پیوند'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Send Action Button for PV and Group */}
        {(activeMode === 'pv' || activeMode === 'group') && !sentSuccess && (
          <div className="pt-4 border-t border-stone-200 dark:border-stone-800 mt-2">
            <button
              type="button"
              disabled={
                (activeMode === 'pv' && selectedContacts.length === 0) ||
                (activeMode === 'group' && selectedGroups.length === 0)
              }
              onClick={handleSend}
              className="w-full py-3 px-4 rounded-2xl bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-stone-200 text-stone-50 dark:text-stone-900 text-sm font-medium disabled:opacity-35 disabled:pointer-events-none transition-all duration-150 active:scale-95 flex items-center justify-center gap-2"
            >
              <IconSend className="w-4 h-4 rtl:-rotate-90" />
              <span>ارسال</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
