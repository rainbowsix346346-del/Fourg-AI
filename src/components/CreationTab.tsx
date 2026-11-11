import React, { useState, useRef } from 'react';
import { GeneratedApp, UserProfile, SharedToolSession } from '../types';
import {
  IconSend,
  IconEdit,
  IconSave,
  IconShareAction,
  IconCode,
  IconCheck,
} from './Icons';
import { generateAppFromPrompt, calculateCircleProgress } from '../services/aiBuilder';
import { ShareCollaborationModal } from './ShareCollaborationModal';

interface CreationTabProps {
  currentUser: UserProfile | null;
  onSaveApp: (app: GeneratedApp) => void;
  savedAppIds: Set<string>;
  onShareSessionCreated: (
    session: SharedToolSession,
    targetType: 'pv' | 'group',
    targetIds: string[]
  ) => void;
}

export const CreationTab: React.FC<CreationTabProps> = ({
  currentUser,
  onSaveApp,
  savedAppIds,
  onShareSessionCreated,
}) => {
  const [promptText, setPromptText] = useState('');
  const [isBuilding, setIsBuilding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressStage, setProgressStage] = useState('');
  const [currentApp, setCurrentApp] = useState<GeneratedApp | null>(null);
  const [showCode, setShowCode] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptText.trim() || isBuilding) return;

    setIsBuilding(true);
    setProgress(0);
    setProgressStage('آماده‌سازی درخواست...');
    setShowCode(false);

    try {
      const previousCode = isEditMode && currentApp ? currentApp.code : undefined;
      const result = await generateAppFromPrompt(
        promptText,
        (p, stage) => {
          setProgress(p);
          if (stage) setProgressStage(stage);
        },
        previousCode,
        undefined,
        currentUser?.username
      );
      setCurrentApp(result);
      setIsEditMode(false);
      setPromptText('');
    } catch {
      // Handled inside aiBuilder with smart fallback
    } finally {
      setIsBuilding(false);
    }
  };

  const handleEditClick = () => {
    setIsEditMode(true);
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSaveClick = () => {
    if (currentApp) {
      onSaveApp(currentApp);
    }
  };

  const isSaved = currentApp ? savedAppIds.has(currentApp.id) : false;

  const radius = 56;
  const { circumference, strokeDashoffset } = calculateCircleProgress(progress, radius);

  return (
    <div className="flex flex-col h-full overflow-y-auto no-scrollbar px-4 pt-4 pb-28">
      {/* Stream Area */}
      <div className="flex-1 flex flex-col justify-center items-center max-w-md mx-auto w-full my-auto py-4">
        {isBuilding ? (
          /* Square card with completely rounded corners and progressive filling circle */
          <div
            className="w-full aspect-square max-w-[320px] rounded-[36px] bg-stone-100 dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 flex flex-col items-center justify-center p-6 anim-scale"
            aria-live="polite"
          >
            <div className="relative flex items-center justify-center mb-3">
              <svg
                width="140"
                height="140"
                viewBox="0 0 140 140"
                className="transform -rotate-90"
              >
                {/* Background track circle */}
                <circle
                  cx="70"
                  cy="70"
                  r={radius}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-stone-200 dark:text-stone-800"
                />
                {/* Filling progress circle */}
                <circle
                  cx="70"
                  cy="70"
                  r={radius}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  className="text-stone-800 dark:text-stone-100 transition-all duration-300 ease-out"
                />
              </svg>
              {/* Percentage in center */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100 tabular-nums">
                  {progress}٪
                </span>
              </div>
            </div>

            {/* Stage text */}
            <span className="text-xs text-stone-500 dark:text-stone-400 text-center line-clamp-1">
              {progressStage}
            </span>
          </div>
        ) : currentApp ? (
          /* Finished Result State */
          <div className="w-full flex flex-col items-center max-w-[340px] anim-scale">
            {/* Title & Description: Title ALWAYS first, description below */}
            <div className="w-full text-right mb-2 px-1">
              <h2 className="text-base font-bold text-stone-900 dark:text-stone-100 mb-0.5 truncate">
                {currentApp.title}
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400 truncate">
                {currentApp.description}
              </p>
            </div>

            {/* Square card with fully rounded corners showing graphical result inside sandboxed iframe */}
            <div className="w-full aspect-square rounded-[36px] bg-stone-100 dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 overflow-hidden shadow-sm flex flex-col p-2">
              <iframe
                sandbox="allow-scripts"
                srcDoc={currentApp.html}
                title={currentApp.title}
                className="w-full h-full rounded-[28px] border-0 bg-white"
              />
            </div>

            {/* The 4 action buttons */}
            <div className="w-full flex items-center justify-between gap-2 mt-4 px-1">
              <button
                type="button"
                onClick={handleEditClick}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-900 dark:hover:bg-stone-800 border border-stone-200/80 dark:border-stone-800 text-stone-800 dark:text-stone-200 text-xs font-medium transition-all duration-150 active:scale-95"
              >
                <IconEdit className="w-4 h-4 text-stone-600 dark:text-stone-400" />
                <span>ویرایش</span>
              </button>

              <button
                type="button"
                onClick={handleSaveClick}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-900 dark:hover:bg-stone-800 border border-stone-200/80 dark:border-stone-800 text-stone-800 dark:text-stone-200 text-xs font-medium transition-all duration-150 active:scale-95"
              >
                {isSaved ? (
                  <>
                    <IconCheck className="w-4 h-4 text-stone-700 dark:text-stone-300" />
                    <span>ذخیره شد</span>
                  </>
                ) : (
                  <>
                    <IconSave className="w-4 h-4 text-stone-600 dark:text-stone-400" />
                    <span>ذخیره</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsShareModalOpen(true)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-900 dark:hover:bg-stone-800 border border-stone-200/80 dark:border-stone-800 text-stone-800 dark:text-stone-200 text-xs font-medium transition-all duration-150 active:scale-95"
              >
                <IconShareAction className="w-4 h-4 text-stone-600 dark:text-stone-400" />
                <span>اشتراک‌گذاری</span>
              </button>

              {/* Code toggle icon button without text */}
              <button
                type="button"
                onClick={() => setShowCode((prev) => !prev)}
                aria-label="کد"
                title="کد"
                className={`p-2.5 rounded-2xl border transition-all duration-150 active:scale-95 flex items-center justify-center ${
                  showCode
                    ? 'bg-stone-300 dark:bg-stone-700 border-stone-400 dark:border-stone-600 text-stone-900 dark:text-stone-100'
                    : 'bg-stone-100 hover:bg-stone-200 dark:bg-stone-900 dark:hover:bg-stone-800 border-stone-200/80 dark:border-stone-800 text-stone-700 dark:text-stone-300'
                }`}
              >
                <IconCode className="w-4 h-4" />
              </button>
            </div>

            {/* Toggleable code viewer */}
            {showCode && (
              <div className="w-full mt-4 p-4 rounded-2xl bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-left dir-ltr overflow-x-auto text-xs font-mono text-stone-700 dark:text-stone-300 max-h-56 anim-scale">
                <pre>{currentApp.code || currentApp.html}</pre>
              </div>
            )}
          </div>
        ) : (
          /* Clean empty prompt card */
          <div className="w-full aspect-square max-w-[280px] rounded-[36px] border border-dashed border-stone-200 dark:border-stone-800 flex flex-col items-center justify-center p-6 text-center text-stone-400 dark:text-stone-600 anim-fade-up">
            <span className="text-sm font-normal">برای شروع، توضیح برنامه را بنویسید</span>
          </div>
        )}
      </div>

      {/* Input bar pinned at bottom */}
      <div className="fixed bottom-16 inset-x-0 p-3 bg-stone-50/90 dark:bg-stone-950/90 backdrop-blur-md border-t border-stone-200/60 dark:border-stone-800/60 z-20">
        <form
          onSubmit={handleSend}
          className="max-w-md mx-auto flex items-center gap-2"
        >
          <input
            ref={inputRef}
            type="text"
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            placeholder={isEditMode ? 'توضیح تغییرات...' : 'توضیح...'}
            disabled={isBuilding}
            className="flex-1 bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl px-4 py-3 text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-600 focus:outline-none focus:border-stone-400 dark:focus:border-stone-600 transition-colors"
          />
          <button
            type="submit"
            disabled={!promptText.trim() || isBuilding}
            aria-label="ارسال"
            className="w-12 h-12 rounded-2xl bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-stone-200 text-stone-50 dark:text-stone-900 flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none transition-all duration-150 active:scale-95"
          >
            <IconSend className="w-5 h-5 rtl:-rotate-90" />
          </button>
        </form>
      </div>

      {/* Sharing & Collaboration Modal with Preview vs Collab, Code, Link, and themeable QR */}
      <ShareCollaborationModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        app={currentApp}
        currentUser={currentUser}
        onShareSessionCreated={onShareSessionCreated}
      />
    </div>
  );
};
