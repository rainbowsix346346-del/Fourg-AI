import React, { useState } from 'react';
import { AppTheme, GeminiModelId } from '../types';
import { IconAuto, IconSun, IconMoon, IconCheck } from './Icons';
import { AVAILABLE_MODELS, getStoredModel, saveStoredModel } from '../services/aiBuilder';

interface SettingsTabProps {
  theme: AppTheme;
  onThemeChange: (theme: AppTheme) => void;
  selectedModel?: GeminiModelId;
  onModelChange?: (model: GeminiModelId) => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  theme,
  onThemeChange,
  selectedModel: propModel,
  onModelChange,
}) => {
  const [currentModel, setCurrentModel] = useState<GeminiModelId>(() => propModel || getStoredModel());

  const themeOptions: { id: AppTheme; label: string; icon: React.ReactNode }[] = [
    {
      id: 'auto',
      label: 'خودکار',
      icon: <IconAuto className="w-5 h-5 text-stone-600 dark:text-stone-400" />,
    },
    {
      id: 'light',
      label: 'روشن',
      icon: <IconSun className="w-5 h-5 text-stone-600 dark:text-stone-400" />,
    },
    {
      id: 'dark',
      label: 'تیره',
      icon: <IconMoon className="w-5 h-5 text-stone-600 dark:text-stone-400" />,
    },
  ];

  const handleSelectModel = (modelId: GeminiModelId) => {
    setCurrentModel(modelId);
    saveStoredModel(modelId);
    if (onModelChange) {
      onModelChange(modelId);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto no-scrollbar px-4 pt-4 pb-24 max-w-md mx-auto w-full anim-fade-up">
      <div className="mb-4">
        <h1 className="text-base font-semibold text-stone-800 dark:text-stone-200">
          تنظیمات
        </h1>
      </div>

      {/* Theme Selection */}
      <div className="mb-5">
        <h2 className="text-xs font-medium text-stone-600 dark:text-stone-400 mb-2 px-1">
          تم ظاهری
        </h2>
        <div className="p-2 rounded-2xl bg-stone-100 dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 space-y-1">
          {themeOptions.map((option) => {
            const isSelected = theme === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onThemeChange(option.id)}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-150 active:scale-[0.99] ${
                  isSelected
                    ? 'bg-stone-200/80 dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-medium'
                    : 'text-stone-700 dark:text-stone-300 hover:bg-stone-200/40 dark:hover:bg-stone-800/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  {option.icon}
                  <span className="text-sm">{option.label}</span>
                </div>

                {isSelected && (
                  <div className="text-stone-900 dark:text-stone-100">
                    <IconCheck className="w-4 h-4" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* AI Model Selection */}
      <div className="mb-4">
        <h2 className="text-xs font-medium text-stone-600 dark:text-stone-400 mb-2 px-1">
          مدل هوش مصنوعی
        </h2>
        <div className="p-2 rounded-2xl bg-stone-100 dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 space-y-1.5">
          {AVAILABLE_MODELS.map((model) => {
            const isSelected = (propModel || currentModel) === model.id;
            return (
              <button
                key={model.id}
                type="button"
                onClick={() => handleSelectModel(model.id)}
                className={`w-full flex items-start justify-between p-3 rounded-xl text-right transition-all duration-150 active:scale-[0.99] ${
                  isSelected
                    ? 'bg-stone-200/80 dark:bg-stone-800 border border-stone-300/60 dark:border-stone-700/60 text-stone-900 dark:text-stone-100'
                    : 'text-stone-700 dark:text-stone-300 hover:bg-stone-200/40 dark:hover:bg-stone-800/40 border border-transparent'
                }`}
              >
                <div className="flex-1 pr-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold font-mono tracking-wide dir-ltr text-stone-900 dark:text-stone-100">
                      {model.name}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-md font-sans ${
                        model.badge === 'سریع'
                          ? 'bg-stone-200 text-stone-700 dark:bg-stone-700 dark:text-stone-200'
                          : 'bg-stone-800 text-stone-100 dark:bg-stone-200 dark:text-stone-900'
                      }`}
                    >
                      {model.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed">
                    {model.description}
                  </p>
                </div>

                {isSelected && (
                  <div className="text-stone-900 dark:text-stone-100 mt-1 flex-shrink-0 mr-2">
                    <IconCheck className="w-4 h-4 anim-pop" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

