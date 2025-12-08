import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getDailyLimit,
  getDailyLimitSync,
  getTimeUsedToday,
  getRemainingTimeToday,
  isLimitReached,
  addTimeSpent
} from '../services/timeLimitService';

interface UseTimeLimitReturn {
  dailyLimit: number;
  timeUsed: number;
  remainingTime: number;
  limitReached: boolean;
  startTracking: () => void;
  stopTracking: () => void;
  isTracking: boolean;
}

/**
 * Hook to manage video time limits
 * Tracks time spent watching videos and enforces daily limits
 */
export function useTimeLimit(): UseTimeLimitReturn {
  const [dailyLimit, setDailyLimit] = useState(getDailyLimitSync());
  const [timeUsed, setTimeUsed] = useState(getTimeUsedToday());
  const [remainingTime, setRemainingTime] = useState(getRemainingTimeToday());
  const [limitReached, setLimitReached] = useState(isLimitReached());
  const [isTracking, setIsTracking] = useState(false);
  
  const trackingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(Date.now());

  // Update state from localStorage and cached server limit
  const updateState = useCallback(() => {
    setDailyLimit(getDailyLimitSync());
    setTimeUsed(getTimeUsedToday());
    setRemainingTime(getRemainingTimeToday());
    setLimitReached(isLimitReached());
  }, []);

  // Fetch limit from server on mount
  useEffect(() => {
    getDailyLimit().then(limit => {
      setDailyLimit(limit);
      // Immediately recalculate limitReached with the correct server limit
      updateState();
    });
  }, [updateState]);

  // Start tracking time
  const startTracking = useCallback(() => {
    if (limitReached) {
      return; // Don't start if limit already reached
    }

    if (trackingIntervalRef.current) {
      return; // Already tracking
    }

    startTimeRef.current = Date.now();
    lastUpdateRef.current = Date.now();
    setIsTracking(true);

    // Update every 5 seconds
    trackingIntervalRef.current = setInterval(() => {
      if (startTimeRef.current) {
        const now = Date.now();
        const secondsElapsed = (now - lastUpdateRef.current) / 1000;
        lastUpdateRef.current = now;

        // Add time spent
        addTimeSpent(secondsElapsed);

        // Update state
        updateState();

        // Check if limit reached during tracking
        if (isLimitReached()) {
          // Stop tracking if limit reached
          if (trackingIntervalRef.current) {
            clearInterval(trackingIntervalRef.current);
            trackingIntervalRef.current = null;
          }
          if (startTimeRef.current && lastUpdateRef.current) {
            const secondsElapsed = (Date.now() - lastUpdateRef.current) / 1000;
            if (secondsElapsed > 0) {
              addTimeSpent(secondsElapsed);
            }
            startTimeRef.current = null;
          }
          setIsTracking(false);
          updateState();
        }
      }
    }, 5000);
  }, [limitReached, updateState]);

  // Stop tracking time
  const stopTracking = useCallback(() => {
    if (trackingIntervalRef.current) {
      clearInterval(trackingIntervalRef.current);
      trackingIntervalRef.current = null;
    }

    // Add any remaining time
    if (startTimeRef.current && lastUpdateRef.current) {
      const secondsElapsed = (Date.now() - lastUpdateRef.current) / 1000;
      if (secondsElapsed > 0) {
        addTimeSpent(secondsElapsed);
      }
      startTimeRef.current = null;
    }

    setIsTracking(false);
    updateState();
  }, [updateState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
      }
      // Save any remaining time before unmount
      if (startTimeRef.current && lastUpdateRef.current) {
        const secondsElapsed = (Date.now() - lastUpdateRef.current) / 1000;
        if (secondsElapsed > 0) {
          addTimeSpent(secondsElapsed);
        }
      }
    };
  }, []);

  // Update state periodically to catch external changes
  useEffect(() => {
    const interval = setInterval(() => {
      updateState();
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [updateState]);

  return {
    dailyLimit,
    timeUsed,
    remainingTime,
    limitReached,
    startTracking,
    stopTracking,
    isTracking
  };
}
