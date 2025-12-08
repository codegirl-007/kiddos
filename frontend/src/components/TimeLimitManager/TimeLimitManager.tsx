import { useState, useEffect } from 'react';
import {
  getDailyLimit,
  getTimeUsedToday,
  setDailyLimit,
  resetDailyCounter
} from '../../services/timeLimitService';
import './TimeLimitManager.css';

export function TimeLimitManager() {
  const [dailyLimit, setDailyLimitState] = useState<number | null>(null);
  const [timeUsed, setTimeUsed] = useState(getTimeUsedToday());
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch limit from server on mount
  useEffect(() => {
    const fetchLimit = async () => {
      try {
        setIsLoading(true);
        const limit = await getDailyLimit();
        setDailyLimitState(limit);
        setInputValue(limit.toString());
      } catch (err: any) {
        setError(err.error?.message || 'Failed to load time limit');
      } finally {
        setIsLoading(false);
      }
    };
    fetchLimit();
  }, []);

  // Update time used periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeUsed(getTimeUsedToday());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleSaveLimit = async () => {
    const minutes = parseInt(inputValue, 10);
    if (isNaN(minutes) || minutes < 1) {
      alert('Please enter a valid number of minutes (minimum 1)');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await setDailyLimit(minutes);
      setDailyLimitState(minutes);
    } catch (err: any) {
      setError(err.error?.message || 'Failed to save time limit');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetCounter = () => {
    resetDailyCounter();
    setTimeUsed(0);
    setShowResetConfirm(false);
  };

  const formatTime = (minutes: number): string => {
    if (minutes < 1) {
      return `${Math.round(minutes * 60)} seconds`;
    }
    if (minutes < 60) {
      return `${Math.round(minutes)} minute${Math.round(minutes) !== 1 ? 's' : ''}`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (mins === 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''}`;
    }
    return `${hours} hour${hours !== 1 ? 's' : ''} ${mins} minute${mins !== 1 ? 's' : ''}`;
  };

  const remainingTime = dailyLimit !== null ? Math.max(0, dailyLimit - timeUsed) : 0;

  if (isLoading) {
    return (
      <div className="time-limit-manager">
        <div className="time-limit-header">
          <h2>Daily Time Limit Settings</h2>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="time-limit-manager">
      <div className="time-limit-header">
        <h2>Daily Time Limit Settings</h2>
        <p>Configure how much time users can spend watching videos each day</p>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '16px' }}>
          {error}
        </div>
      )}

      <div className="time-limit-section">
        <div className="time-limit-setting">
          <label htmlFor="daily-limit-input">
            Daily Limit (minutes)
          </label>
          <div className="time-limit-input-group">
            <input
              id="daily-limit-input"
              type="number"
              min="1"
              step="1"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSaveLimit();
                }
              }}
              className="time-limit-input"
            />
            <button
              onClick={handleSaveLimit}
              disabled={isSaving || (dailyLimit !== null && inputValue === dailyLimit.toString())}
              className="time-limit-save-btn"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
          {dailyLimit !== null && (
            <p className="time-limit-hint">
              Current limit: <strong>{formatTime(dailyLimit)}</strong> per day
            </p>
          )}
        </div>

        {dailyLimit !== null && (
          <div className="time-limit-status">
            <h3>Today's Usage</h3>
            <div className="time-limit-progress">
              <div className="time-limit-progress-bar">
                <div
                  className="time-limit-progress-fill"
                  style={{
                    width: `${Math.min(100, (timeUsed / dailyLimit) * 100)}%`
                  }}
                />
              </div>
              <div className="time-limit-stats">
                <span className="time-used">
                  Used: <strong>{formatTime(timeUsed)}</strong>
                </span>
                <span className="time-remaining">
                  Remaining: <strong>{formatTime(remainingTime)}</strong>
                </span>
              </div>
            </div>

            {timeUsed > 0 && (
              <div className="time-limit-actions">
                <button
                  onClick={() => setShowResetConfirm(true)}
                  className="time-limit-reset-btn"
                >
                  Reset Today's Counter
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {showResetConfirm && (
        <div className="time-limit-confirm-overlay" onClick={() => setShowResetConfirm(false)}>
          <div className="time-limit-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Reset Today's Counter?</h3>
            <p>
              This will reset the time used today back to 0. Users will be able to watch videos again.
            </p>
            <div className="time-limit-confirm-actions">
              <button
                onClick={handleResetCounter}
                className="time-limit-confirm-btn confirm"
              >
                Reset Counter
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="time-limit-confirm-btn cancel"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
