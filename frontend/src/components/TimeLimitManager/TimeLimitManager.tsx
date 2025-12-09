import { useState, useEffect } from 'react';
import {
  getDailyLimit,
  getTimeUsedToday,
  setDailyLimit,
  resetDailyCounter
} from '../../services/timeLimitService';

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
      <div className="bg-card rounded-xl p-6 border border-border h-fit">
        <div className="mb-6">
          <h2 className="m-0 mb-2 text-xl font-semibold text-foreground">Daily Time Limit Settings</h2>
          <p className="m-0 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl p-6 border border-border h-fit">
      <div className="mb-6">
        <h2 className="m-0 mb-2 text-xl font-semibold text-foreground">Daily Time Limit Settings</h2>
        <p className="m-0 text-sm text-muted-foreground">
          Configure how much time users can spend watching videos each day
        </p>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-md mb-4 text-sm bg-red-50 text-red-800 border border-red-200">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <label htmlFor="daily-limit-input" className="text-sm font-medium text-foreground">
            Daily Limit (minutes)
          </label>
          <div className="flex gap-3 items-center md:flex-row flex-col md:items-center items-stretch">
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
              className="flex-1 max-w-[200px] md:max-w-[200px] max-w-full px-3 py-2.5 border border-border rounded-md text-sm bg-muted text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <button
              onClick={handleSaveLimit}
              disabled={isSaving || (dailyLimit !== null && inputValue === dailyLimit.toString())}
              className="px-5 py-2.5 bg-gradient-to-r from-primary to-secondary text-white border-none rounded-md text-sm font-medium cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
          {dailyLimit !== null && (
            <p className="m-0 text-[13px] text-muted-foreground">
              Current limit: <strong className="font-semibold">{formatTime(dailyLimit)}</strong> per day
            </p>
          )}
        </div>

        {dailyLimit !== null && (
          <div className="p-5 bg-muted rounded-lg border border-border/50">
            <h3 className="m-0 mb-4 text-base font-semibold text-foreground">Today's Usage</h3>
            <div className="flex flex-col gap-3">
              <div className="w-full h-6 bg-border/30 rounded-xl overflow-hidden relative">
                <div
                  className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-300 ease-in-out rounded-xl"
                  style={{
                    width: `${Math.min(100, (timeUsed / dailyLimit) * 100)}%`
                  }}
                />
              </div>
              <div className="flex justify-between text-sm text-foreground md:flex-row flex-col md:gap-0 gap-2">
                <span className="time-used">
                  Used: <strong className="text-primary font-semibold">{formatTime(timeUsed)}</strong>
                </span>
                <span className="time-remaining">
                  Remaining: <strong className="text-primary font-semibold">{formatTime(remainingTime)}</strong>
                </span>
              </div>
            </div>

            {timeUsed > 0 && (
              <div className="mt-4 pt-4 border-t border-border/50">
                <button
                  onClick={() => setShowResetConfirm(true)}
                  className="px-4 py-2 bg-transparent text-primary border border-primary rounded-md text-sm font-medium cursor-pointer transition-colors hover:bg-primary hover:text-primary-foreground"
                >
                  Reset Today's Counter
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {showResetConfirm && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] backdrop-blur-sm"
          onClick={() => setShowResetConfirm(false)}
        >
          <div 
            className="bg-card rounded-xl p-6 max-w-[400px] w-[90%] shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="m-0 mb-3 text-lg font-semibold text-foreground">Reset Today's Counter?</h3>
            <p className="m-0 mb-5 text-sm text-muted-foreground leading-relaxed">
              This will reset the time used today back to 0. Users will be able to watch videos again.
            </p>
            <div className="flex gap-3 justify-end md:flex-row flex-col">
              <button
                onClick={handleResetCounter}
                className="px-5 py-2.5 bg-gradient-to-r from-primary to-secondary text-white border-none rounded-md text-sm font-medium cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lg"
              >
                Reset Counter
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-5 py-2.5 bg-transparent text-foreground border border-border rounded-md text-sm font-medium cursor-pointer transition-colors hover:bg-muted"
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
