import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { getInitialUsername, validateProfile, checkUsernameAvailability } from '../services/identityService';
import { IconUser, IconCheck } from './Icons';

interface UserProfileModalProps {
  isOpen: boolean;
  onProfileCreated: (profile: UserProfile) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onProfileCreated,
}) => {
  const [username, setUsername] = useState(getInitialUsername());
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setUsername(getInitialUsername());
  }, []);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const val = validateProfile(username, displayName);
    if (!val.valid) {
      setError(val.error || 'اطلاعات وارد شده معتبر نیست.');
      return;
    }

    setIsChecking(true);
    setIsSubmitting(true);
    try {
      const isAvailable = await checkUsernameAvailability(username);
      if (!isAvailable) {
        setError('این یوزرنیم قبلاً ثبت شده است.');
        setIsSubmitting(false);
        setIsChecking(false);
        return;
      }

      // Register profile on server
      const res = await fetch('/api/auth/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim().toLowerCase(),
          displayName: displayName.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'خطا در ثبت پروفایل.');
        setIsSubmitting(false);
        setIsChecking(false);
        return;
      }

      const data = await res.json();
      onProfileCreated(data.profile);
    } catch {
      // Fallback local registration
      const profile: UserProfile = {
        username: username.trim().toLowerCase(),
        displayName: displayName.trim(),
        createdAt: new Date().toLocaleDateString('fa-IR'),
      };
      onProfileCreated(profile);
    } finally {
      setIsChecking(false);
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="ساخت پروفایل کاربری"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md anim-fade-up"
    >
      <div
        className="w-full max-w-sm rounded-[32px] bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-6 shadow-2xl anim-scale flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-12 rounded-2xl bg-stone-200 dark:bg-stone-800 flex items-center justify-center mx-auto mb-4 text-stone-700 dark:text-stone-300">
          <IconUser className="w-6 h-6" />
        </div>

        <div className="text-center mb-6">
          <h2 className="text-base font-bold text-stone-900 dark:text-stone-100 mb-1">
            پروفایل کاربری
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            برای شروع، یوزرنیم یکتا و اسم نمایشی خود را مشخص کنید
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1.5 text-right">
              اسم نمایشی (اجباری)
            </label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => {
                setDisplayName(e.target.value);
                if (error) setError(null);
              }}
              placeholder="مثال: سارا محمدی"
              className="w-full bg-stone-100 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-2xl px-4 py-2.5 text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-600 focus:outline-none focus:border-stone-400 dark:focus:border-stone-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1.5 text-right">
              یوزرنیم یکتا (انگلیسی)
            </label>
            <div className="relative">
              <input
                type="text"
                required
                dir="ltr"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''));
                  if (error) setError(null);
                }}
                placeholder="sara_dev"
                className="w-full bg-stone-100 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-2xl px-4 py-2.5 text-sm font-mono text-left text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-600 focus:outline-none focus:border-stone-400 dark:focus:border-stone-500 transition-colors"
              />
              <span className="absolute right-3 top-2.5 text-xs text-stone-400 font-mono">@</span>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-stone-200/60 dark:bg-stone-800/80 border border-stone-300 dark:border-stone-700 text-xs text-stone-800 dark:text-stone-200 text-right anim-pop">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!displayName.trim() || !username.trim() || isSubmitting}
            className="w-full py-3 px-4 rounded-2xl bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-stone-200 text-stone-50 dark:text-stone-900 text-sm font-medium disabled:opacity-35 disabled:pointer-events-none transition-all duration-150 active:scale-95 flex items-center justify-center gap-2 mt-2"
          >
            <IconCheck className="w-4 h-4" />
            <span>{isChecking ? 'بررسی یوزرنیم...' : 'ثبت و ورود'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
