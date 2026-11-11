import React, { useState, useMemo, useEffect, useRef } from 'react';
import { GeneratedApp, AppCategory } from '../types';
import { filterCreations } from '../services/chatService';
import {
  IconSearch,
  IconCode,
  IconPlay,
  IconSave,
  IconClose,
  IconMic,
  IconHeart,
} from './Icons';

interface CreationsTabProps {
  creations: GeneratedApp[];
  onPreviewApp: (app: GeneratedApp) => void;
  onToggleFavorite: (appId: string) => void;
}

export const CreationsTab: React.FC<CreationsTabProps> = ({
  creations,
  onPreviewApp,
  onToggleFavorite,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<AppCategory>('همه');
  const [inspectCodeApp, setInspectCodeApp] = useState<GeneratedApp | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        setSpeechSupported(true);
      }
    }
  }, []);

  const toggleSpeechRecognition = () => {
    if (!speechSupported) return;

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    try {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'fa-IR';
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          setSearchQuery(transcript);
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const categories: AppCategory[] = ['همه', 'علاقه‌مندی‌ها', 'بازی', 'ابزار', 'برنامه'];

  const filtered = useMemo(() => {
    return filterCreations(creations, searchQuery, activeCategory);
  }, [creations, searchQuery, activeCategory]);

  return (
    <div className="flex flex-col h-full overflow-y-auto no-scrollbar px-4 pt-4 pb-24 max-w-md mx-auto w-full anim-fade-up">
      {/* Title */}
      <div className="mb-3">
        <h1 className="text-base font-semibold text-stone-900 dark:text-stone-100">
          ساخته‌هام
        </h1>
      </div>

      {/* Search Bar with optional Persian Voice Input */}
      <div className="relative mb-3 flex items-center">
        <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-stone-400">
          <IconSearch className="w-4 h-4" />
        </div>

        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="جستجوی ساخته‌ها..."
          className="w-full bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl pr-10 pl-16 py-2.5 text-xs text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-600 focus:outline-none focus:border-stone-400 dark:focus:border-stone-600 transition-colors"
        />

        <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center gap-1">
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors"
              aria-label="پاک کردن"
            >
              <IconClose className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Conditional Voice Microphone icon if browser supports Web Speech API */}
          {speechSupported && (
            <button
              type="button"
              onClick={toggleSpeechRecognition}
              aria-label={isListening ? 'در حال شنیدن...' : 'ورودی صوتی فارسی'}
              title={isListening ? 'در حال شنیدن...' : 'ورودی صوتی فارسی'}
              className={`p-1.5 rounded-xl transition-all duration-200 active:scale-90 ${
                isListening
                  ? 'bg-stone-300 dark:bg-stone-700 text-stone-900 dark:text-stone-100 animate-pulse'
                  : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-300'
              }`}
            >
              <IconMic className="w-3.5 h-3.5" active={isListening} />
            </button>
          )}
        </div>
      </div>

      {/* Category Chips: همه، علاقه‌مندی‌ها، بازی، ابزار، برنامه */}
      <div className="flex items-center gap-1.5 mb-4 overflow-x-auto no-scrollbar pb-1">
        {categories.map((cat) => {
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`py-1.5 px-3.5 rounded-xl text-xs font-medium transition-all duration-200 active:scale-95 flex-shrink-0 flex items-center gap-1.5 ${
                isActive
                  ? 'bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 shadow-sm'
                  : 'bg-stone-100 dark:bg-stone-900 text-stone-600 dark:text-stone-400 hover:bg-stone-200/70 dark:hover:bg-stone-800 border border-stone-200/80 dark:border-stone-800'
              }`}
            >
              {cat === 'علاقه‌مندی‌ها' && (
                <IconHeart
                  className="w-3 h-3"
                  filled={isActive}
                />
              )}
              <span>{cat}</span>
            </button>
          );
        })}
      </div>

      {/* Creations Card List */}
      {filtered.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center my-auto anim-pop">
          <div className="w-14 h-14 rounded-full bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 flex items-center justify-center mb-3 text-stone-400 dark:text-stone-600">
            <IconSave className="w-6 h-6" />
          </div>
          <p className="text-sm font-medium text-stone-600 dark:text-stone-400 mb-1">
            موردی یافت نشد
          </p>
          <p className="text-xs text-stone-400 dark:text-stone-600">
            برنامه‌ای مطابق با فیلترها و جستجو پیدا نشد
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((app, idx) => (
            <div
              key={app.id}
              className={`p-4 rounded-2xl bg-stone-100 dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 transition-all duration-200 stagger-${(idx % 6) + 1} anim-fade-up`}
            >
              {/* Card top: Name ALWAYS first (large, top priority), short description below */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="text-right flex-1 min-w-0">
                  <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 mb-1 leading-snug">
                    {app.title}
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed line-clamp-2">
                    {app.description}
                  </p>
                </div>

                {/* Favorite Heart SVG Icon */}
                <button
                  type="button"
                  onClick={() => onToggleFavorite(app.id)}
                  aria-label={app.isFavorite ? 'حذف از علاقه‌مندی‌ها' : 'افزودن به علاقه‌مندی‌ها'}
                  className={`p-1.5 rounded-xl transition-all duration-150 active:scale-90 flex-shrink-0 ${
                    app.isFavorite
                      ? 'text-stone-900 dark:text-stone-100'
                      : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-300'
                  }`}
                >
                  <IconHeart className="w-4 h-4" filled={Boolean(app.isFavorite)} />
                </button>
              </div>

              {/* Card Footer: Metadata and Action Buttons */}
              <div className="flex items-center justify-between pt-2.5 border-t border-stone-200/60 dark:border-stone-800/80 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] px-2 py-0.5 rounded-lg bg-stone-200/80 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                    {app.category}
                  </span>
                  <span className="text-[11px] text-stone-400 dark:text-stone-500">
                    {app.createdAt}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setInspectCodeApp(app)}
                    aria-label="کد"
                    title="کد"
                    className="p-1.5 rounded-xl border border-stone-200/80 dark:border-stone-800 hover:bg-stone-200/70 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400 transition-colors active:scale-90"
                  >
                    <IconCode className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onPreviewApp(app)}
                    className="flex items-center gap-1 py-1 px-3 rounded-xl bg-stone-900 dark:bg-stone-100 text-stone-50 dark:text-stone-900 text-xs font-medium active:scale-95 transition-transform"
                  >
                    <IconPlay className="w-3 h-3" />
                    <span>اجرا</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Code Inspector Modal if code button pressed */}
      {inspectCodeApp && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="کد برنامه"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-[2px]"
          onClick={() => setInspectCodeApp(null)}
        >
          <div
            className="w-full max-w-md bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-5 anim-pop flex flex-col max-h-[80vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                کد منبع: {inspectCodeApp.title}
              </h3>
              <button
                type="button"
                onClick={() => setInspectCodeApp(null)}
                className="p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
              >
                <IconClose className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar rounded-2xl bg-stone-100 dark:bg-stone-950 p-3 text-left dir-ltr font-mono text-xs text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-800">
              <pre>{inspectCodeApp.code || inspectCodeApp.html}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
