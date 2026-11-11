import React, { useState } from 'react';
import { GeneratedApp } from '../types';

interface InteractivePreviewProps {
  app: GeneratedApp;
}

export const InteractivePreview: React.FC<InteractivePreviewProps> = ({ app }) => {
  // Mini interactive state depending on type
  const [board, setBoard] = useState<string[]>(Array(9).fill(''));
  const [turn, setTurn] = useState<'X' | 'O'>('X');
  const [counter, setCounter] = useState(0);

  const handleCellClick = (index: number) => {
    if (board[index]) return;
    const next = [...board];
    next[index] = turn;
    setBoard(next);
    setTurn(turn === 'X' ? 'O' : 'X');
  };

  const resetBoard = () => {
    setBoard(Array(9).fill(''));
    setTurn('X');
  };

  if (app.category === 'بازی') {
    return (
      <div className="w-full flex flex-col items-center justify-center p-2">
        <div className="text-xs font-medium mb-3 text-stone-500 dark:text-stone-400">
          نوبت: {turn === 'X' ? 'ضربدر' : 'دایره'}
        </div>
        <div className="grid grid-cols-3 gap-2 w-48 h-48 mb-3">
          {board.map((val, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleCellClick(idx)}
              className="flex items-center justify-center bg-stone-50 hover:bg-stone-100 dark:bg-stone-800/90 dark:hover:bg-stone-700/90 border border-stone-200 dark:border-stone-700 rounded-2xl text-xl font-bold text-stone-800 dark:text-stone-100 transition-colors"
            >
              {val}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={resetBoard}
          className="text-xs text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 py-1.5 px-3.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 transition-colors"
        >
          شروع دوباره
        </button>
      </div>
    );
  }

  // Tool or default interactive preview (e.g. Smart counter/timer/calculator)
  return (
    <div className="w-full flex flex-col items-center justify-center p-4">
      <div className="text-3xl font-semibold mb-4 text-stone-800 dark:text-stone-100 tabular-nums">
        {counter}
      </div>
      <div className="flex items-center gap-3 mb-3">
        <button
          type="button"
          onClick={() => setCounter((c) => c + 1)}
          className="w-12 h-12 rounded-2xl bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-xl font-bold text-stone-800 dark:text-stone-100 flex items-center justify-center transition-colors"
        >
          +
        </button>
        <button
          type="button"
          onClick={() => setCounter(0)}
          className="px-4 py-2 rounded-xl text-xs text-stone-500 dark:text-stone-400 border border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
        >
          صفر
        </button>
        <button
          type="button"
          onClick={() => setCounter((c) => Math.max(0, c - 1))}
          className="w-12 h-12 rounded-2xl bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-xl font-bold text-stone-800 dark:text-stone-100 flex items-center justify-center transition-colors"
        >
          -
        </button>
      </div>
    </div>
  );
};
