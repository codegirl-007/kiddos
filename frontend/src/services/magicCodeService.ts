const MAGIC_CODE_KEY = 'magic_code';
const MAGIC_CODE_SETTINGS_KEY = 'magic_code_settings';

export interface MagicCodeSettings {
  dailyTimeLimit: number | null;
  appliedAt: string;
}

/**
 * Get the currently applied magic code from localStorage
 */
export function getAppliedMagicCode(): string | null {
  try {
    return localStorage.getItem(MAGIC_CODE_KEY);
  } catch (e) {
    console.warn('Failed to get magic code from localStorage', e);
    return null;
  }
}

/**
 * Get the settings from the currently applied magic code
 */
export function getMagicCodeSettings(): MagicCodeSettings | null {
  try {
    const stored = localStorage.getItem(MAGIC_CODE_SETTINGS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn('Failed to parse magic code settings from localStorage', e);
  }
  return null;
}

/**
 * Check if a magic code is currently applied
 */
export function hasMagicCode(): boolean {
  return getAppliedMagicCode() !== null;
}

/**
 * Apply a magic code by fetching settings and storing them locally
 */
export async function applyMagicCode(code: string): Promise<MagicCodeSettings> {
  const { magicCodeApi } = await import('./apiClient');
  
  // Normalize code (uppercase, trim)
  const normalizedCode = code.toUpperCase().trim();
  
  if (normalizedCode.length > 7) {
    throw new Error('Magic code must be 7 characters or less');
  }
  
  // Fetch settings from server
  const response: any = await magicCodeApi.getSettingsByCode(normalizedCode);
  
  const settings: MagicCodeSettings = {
    dailyTimeLimit: response.data.dailyTimeLimit,
    appliedAt: new Date().toISOString()
  };
  
  // Store in localStorage
  try {
    localStorage.setItem(MAGIC_CODE_KEY, normalizedCode);
    localStorage.setItem(MAGIC_CODE_SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn('Failed to save magic code to localStorage', e);
    throw new Error('Failed to save magic code settings');
  }
  
  return settings;
}

/**
 * Clear the applied magic code and settings
 */
export function clearMagicCode(): void {
  try {
    localStorage.removeItem(MAGIC_CODE_KEY);
    localStorage.removeItem(MAGIC_CODE_SETTINGS_KEY);
  } catch (e) {
    console.warn('Failed to clear magic code from localStorage', e);
  }
}
