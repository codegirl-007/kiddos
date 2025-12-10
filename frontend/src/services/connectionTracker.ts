/**
 * Connection Tracker Service
 * Sends periodic heartbeats to the server to indicate active connection
 */

const HEARTBEAT_INTERVAL = 30 * 1000; // Send heartbeat every 30 seconds
const SESSION_ID_KEY = 'connection_session_id';
let heartbeatInterval: NodeJS.Timeout | null = null;
let isTracking = false;
let visibilityCleanup: (() => void) | null = null;
let currentVideo: { title: string; channelName: string } | null = null;

/**
 * Get or create a unique session ID for this browser window/tab
 * Uses localStorage which is isolated per incognito window
 */
function getSessionId(): string {
  try {
    let sessionId = localStorage.getItem(SESSION_ID_KEY);
    if (!sessionId) {
      // Generate a unique session ID for this window/tab
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem(SESSION_ID_KEY, sessionId);
    }
    return sessionId;
  } catch (error) {
    // Fallback if localStorage is not available
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Start sending heartbeats to the server
 */
export function startConnectionTracking(): void {
  if (isTracking) {
    return; // Already tracking
  }

  isTracking = true;
  
  // Send initial heartbeat immediately
  sendHeartbeat();

  // Then send periodic heartbeats
  heartbeatInterval = setInterval(() => {
    // Only send heartbeat if page is visible (not backgrounded on mobile)
    if (!document.hidden) {
      sendHeartbeat();
    }
  }, HEARTBEAT_INTERVAL);

  // Handle page visibility changes (e.g., iPad locks, tab switches)
  // When page becomes visible again, send immediate heartbeat
  const handleVisibilityChange = () => {
    if (!document.hidden && isTracking) {
      // Page became visible - send heartbeat immediately
      sendHeartbeat();
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);

  // Store cleanup function
  visibilityCleanup = () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
}

/**
 * Stop sending heartbeats
 */
export function stopConnectionTracking(): void {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
  
  // Clean up visibility change listener
  if (visibilityCleanup) {
    visibilityCleanup();
    visibilityCleanup = null;
  }
  
  isTracking = false;
}

/**
 * Get the current route/pathname
 */
function getCurrentRoute(): string {
  // Use window.location.pathname to get current route
  // This works outside React Router context
  return window.location.pathname || '/';
}

/**
 * Set the current video being watched (call when video player opens)
 */
export function setCurrentVideo(video: { title: string; channelName: string } | null): void {
  currentVideo = video;
  // Send immediate heartbeat when video changes
  if (isTracking) {
    sendHeartbeat();
  }
}

/**
 * Send a heartbeat to the server with the session ID, current route, video info, and time limit usage
 */
async function sendHeartbeat(): Promise<void> {
  try {
    const { settingsApi } = await import('./apiClient');
    const { getTimeUsedToday, getDailyLimitSync } = await import('./timeLimitService');
    
    const sessionId = getSessionId();
    const route = getCurrentRoute();
    const timeUsed = getTimeUsedToday();
    const dailyLimit = getDailyLimitSync();
    
    await settingsApi.heartbeat(
      sessionId, 
      route, 
      currentVideo ? { title: currentVideo.title, channelName: currentVideo.channelName } : undefined,
      { timeUsed, dailyLimit }
    );
  } catch (error) {
    // Silently fail - don't spam console with errors
    // Connection tracking is not critical for app functionality
    console.debug('Heartbeat failed:', error);
  }
}
