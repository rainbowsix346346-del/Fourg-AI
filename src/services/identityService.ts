import { UserProfile } from '../types';

const STORAGE_KEY = 'user_profile';

/**
 * Separate function to determine initial username.
 * Currently returns empty string so user can choose or it can be sourced externally later.
 */
export function getInitialUsername(): string {
  return "";
}

/**
 * Retrieves the stored local user profile
 */
export function getCurrentProfile(): UserProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.username === 'string' && typeof parsed.displayName === 'string') {
      return parsed;
    }
  } catch {
    // Ignored
  }
  return null;
}

/**
 * Stores the user profile locally
 */
export function saveCurrentProfile(profile: UserProfile): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

/**
 * Checks with the server if a username is available
 */
export async function checkUsernameAvailability(username: string): Promise<boolean> {
  const clean = username.trim().toLowerCase();
  if (!clean || clean.length < 3) return false;

  try {
    const res = await fetch(`/api/auth/check-username/${encodeURIComponent(clean)}`);
    if (res.ok) {
      const data = await res.json();
      return Boolean(data.available);
    }
  } catch {
    // In case server check is offline, fallback check
  }
  return true;
}

/**
 * Validates a profile before submitting
 */
export function validateProfile(
  username: string,
  displayName: string
): { valid: boolean; error?: string } {
  const cleanUser = username.trim().toLowerCase();
  const cleanName = displayName.trim();

  if (!cleanName) {
    return { valid: false, error: 'انتخاب اسم نمایشی اجباری است.' };
  }
  if (!cleanUser) {
    return { valid: false, error: 'انتخاب یوزرنیم اجباری است.' };
  }
  if (cleanUser.length < 3) {
    return { valid: false, error: 'یوزرنیم باید حداقل ۳ حرف باشد.' };
  }
  if (!/^[a-z0-9_]+$/.test(cleanUser)) {
    return { valid: false, error: 'یوزرنیم فقط می‌تواند شامل حروف انگلیسی، عدد و خط زیر (_) باشد.' };
  }

  return { valid: true };
}
