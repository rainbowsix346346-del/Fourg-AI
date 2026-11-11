import React from 'react';
import { GeneratedApp } from '../types';
import { IconClose } from './Icons';

interface AppPreviewModalProps {
  app: GeneratedApp | null;
  onClose: () => void;
}

export const AppPreviewModal: React.FC<AppPreviewModalProps> = ({ app, onClose }) => {
  if (!app) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={app.title}
      className="fixed inset-0 z-50 flex flex-col bg-stone-900/60 backdrop-blur-sm anim-fade-up"
    >
      {/* Top Bar */}
      <div className="h-12 bg-stone-50 dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between px-4 z-10 flex-shrink-0">
        <div className="text-right">
          <h3 className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
            {app.title}
          </h3>
          <span className="text-[10px] text-stone-500 dark:text-stone-400">
            {app.category}
          </span>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="بستن"
          className="p-1.5 rounded-xl hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 transition-colors"
        >
          <IconClose className="w-4 h-4" />
        </button>
      </div>

      {/* Sandboxed iframe */}
      <div className="flex-1 w-full bg-white dark:bg-stone-950 p-2 overflow-hidden flex items-center justify-center">
        <iframe
          sandbox="allow-scripts"
          srcDoc={app.html || app.code}
          title={app.title}
          className="w-full h-full max-w-md rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm bg-white"
        />
      </div>
    </div>
  );
};
