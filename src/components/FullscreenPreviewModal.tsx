import React from 'react';
import { GeneratedApp } from '../types';
import { IconClose } from './Icons';

interface FullscreenPreviewModalProps {
  app: GeneratedApp | null;
  onClose: () => void;
}

export const FullscreenPreviewModal: React.FC<FullscreenPreviewModalProps> = ({
  app,
  onClose,
}) => {
  if (!app) return null;

  const isLandscape = app.orientation === 'landscape';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={app.title}
      className="fixed inset-0 z-[80] flex flex-col bg-stone-950/80 backdrop-blur-md anim-fade-up p-2 sm:p-4 items-center justify-center"
    >
      {/* Container with orientation awareness */}
      <div
        className={`bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-[28px] overflow-hidden flex flex-col shadow-2xl transition-all duration-300 anim-scale ${
          isLandscape
            ? 'w-full max-w-3xl h-[88vh]'
            : 'w-full max-w-sm h-[90vh]'
        }`}
      >
        {/* Top Header */}
        <div className="h-12 bg-stone-100/90 dark:bg-stone-800/90 border-b border-stone-200 dark:border-stone-700/80 px-4 flex items-center justify-between z-10 flex-shrink-0">
          <div className="flex items-center gap-2 text-right">
            <span className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate max-w-[200px]">
              {app.title}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300">
              {isLandscape ? 'افقی' : 'عمودی'}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="بستن"
            className="p-1.5 rounded-xl text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors active:scale-90"
          >
            <IconClose className="w-4 h-4" />
          </button>
        </div>

        {/* Sandboxed iframe */}
        <div className="flex-1 w-full p-2 bg-stone-100 dark:bg-stone-950 flex items-center justify-center overflow-hidden">
          <iframe
            sandbox="allow-scripts"
            srcDoc={app.html || app.code}
            title={app.title}
            className="w-full h-full rounded-2xl border-0 bg-white"
          />
        </div>
      </div>
    </div>
  );
};
