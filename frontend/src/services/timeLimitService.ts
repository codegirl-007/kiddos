interface TimeLimitData {
  dailyLimit: number; // minutes (stored on server)
  dailyTimeUsed: number; // minutes (stored per-device in localStorage)
  lastResetDate: string; // ISO date string (YYYY-MM-DD)
}

const STORAGE_KEY = 'video_time_limit';
const DEFAULT_DAILY_LIMIT = 1; // 1 minute for testing

// Cache for daily limit from server
let cachedDailyLimit: number | null = null;
let limitCacheTime: number = 0;
const LIMIT_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get local date string in YYYY-MM-DD format (not UTC)
 * This ensures the daily reset happens at local midnight, not UTC midnight
 */
function getLocalDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get time limit data from localStorage (for usage tracking only)
 */
function getTimeLimitData(): Omit<TimeLimitData, 'dailyLimit'> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      return {
        dailyTimeUsed: data.dailyTimeUsed || 0,
        lastResetDate: data.lastResetDate || getLocalDateString()
      };
    }
  } catch (e) {
    console.warn('Failed to parse time limit data from localStorage', e);
  }

  // Return default data
  return {
    dailyTimeUsed: 0,
    lastResetDate: getLocalDateString()
  };
}

/**
 * Save time limit data to localStorage (for usage tracking only)
 */
function saveTimeLimitData(data: Omit<TimeLimitData, 'dailyLimit'>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to save time limit data to localStorage', e);
  }
}

/**
 * Check if we need to reset daily counter (new day)
 */
function shouldResetDaily(): boolean {
  const data = getTimeLimitData();
  const today = getLocalDateString();
  return data.lastResetDate !== today;
}

/**
 * Reset daily counter if it's a new day
 */
function resetIfNeeded(): void {
  if (shouldResetDaily()) {
    const data = getTimeLimitData();
    data.dailyTimeUsed = 0;
    data.lastResetDate = getLocalDateString();
    saveTimeLimitData(data);
  }
}

/**
 * Get current time limit configuration from server
 * Falls back to cached value or default if server unavailable
 */
export async function getDailyLimit(): Promise<number> {
  // Return cached value if still valid
  const now = Date.now();
  if (cachedDailyLimit !== null && (now - limitCacheTime) < LIMIT_CACHE_DURATION) {
    return cachedDailyLimit;
  }

  try {
    const { settingsApi } = await import('./apiClient');
    const response = await settingsApi.getTimeLimit();
    const limit = response.data.dailyLimit;
    cachedDailyLimit = limit;
    limitCacheTime = now;
    return limit;
  } catch (error) {
    console.warn('Failed to fetch daily limit from server, using cached/default:', error);
    // Return cached value or default
    return cachedDailyLimit ?? DEFAULT_DAILY_LIMIT;
  }
}

/**
 * Set daily time limit (in minutes) on server
 */
export async function setDailyLimit(minutes: number): Promise<void> {
  try {
    const { settingsApi } = await import('./apiClient');
    await settingsApi.setTimeLimit(minutes);
    cachedDailyLimit = minutes;
    limitCacheTime = Date.now();
  } catch (error) {
    console.error('Failed to set daily limit on server:', error);
    throw error;
  }
}

/**
 * Synchronous version for use in hooks (uses cached value)
 */
export function getDailyLimitSync(): number {
  return cachedDailyLimit ?? DEFAULT_DAILY_LIMIT;
}

/**
 * Get time used today (in minutes) - per device
 */
export function getTimeUsedToday(): number {
  resetIfNeeded();
  const data = getTimeLimitData();
  return data.dailyTimeUsed;
}

/**
 * Get remaining time today (in minutes)
 * Note: Uses cached limit value
 */
export function getRemainingTimeToday(): number {
  resetIfNeeded();
  const limit = getDailyLimitSync();
  const used = getTimeUsedToday();
  return Math.max(0, limit - used);
}

/**
 * Check if daily limit has been reached
 * Note: Uses cached limit value
 */
export function isLimitReached(): boolean {
  resetIfNeeded();
  return getRemainingTimeToday() <= 0;
}

/**
 * Add time spent (in seconds) to the daily counter
 * Note: Uses cached limit value to cap the usage
 */
export function addTimeSpent(seconds: number): void {
  resetIfNeeded();
  const data = getTimeLimitData();
  const minutesToAdd = seconds / 60;
  const limit = getDailyLimitSync();
  data.dailyTimeUsed = Math.min(
    limit,
    data.dailyTimeUsed + minutesToAdd
  );
  saveTimeLimitData(data);
}

/**
 * Reset daily counter (for testing/admin purposes)
 */
export function resetDailyCounter(): void {
  const data = getTimeLimitData();
  data.dailyTimeUsed = 0;
  data.lastResetDate = getLocalDateString();
  saveTimeLimitData(data);
}
